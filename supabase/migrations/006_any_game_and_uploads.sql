-- =====================================================================
-- ManaMatch · Cualquier juego del catálogo, imágenes subidas por el jugador y denuncia de imágenes
-- =====================================================================

-- ---------- Juegos: ya no solo magic/pokemon/onepiece, sino cualquier id del catálogo (src/catalog.js) ----------
alter table public.game_profiles drop constraint if exists game_profiles_game_check;
alter table public.game_profiles add constraint game_profiles_game_check check (game ~ '^[a-z0-9-]{1,24}$');
alter table public.decks drop constraint if exists decks_game_check;
alter table public.decks add constraint decks_game_check check (game ~ '^[a-z0-9-]{1,24}$');
alter table public.profiles drop constraint if exists profiles_active_game_check;
alter table public.profiles add constraint profiles_active_game_check check (active_game ~ '^[a-z0-9-]{1,24}$');
-- Los formatos de los juegos sin buscador son genéricos; el nivel no cambia

-- ---------- Carta válida: nombre (puede ir vacío), imagen oficial o imagen subida ----------
-- "upload" es la ruta en el bucket cards: "<id del dueño>/<nombre aleatorio>.jpg"
create or replace function public.is_valid_card(c jsonb, owner uuid) returns boolean
language sql immutable set search_path = public as $$
  select jsonb_typeof(c) = 'object'
     and char_length(coalesce(c->>'name', '')) <= 80
     and (c->'img' is null or jsonb_typeof(c->'img') = 'null' or c->>'img' = ''
          or c->>'img' ~ '^https://(api\.scryfall\.com|cards\.scryfall\.io|images\.pokemontcg\.io|images\.scrydex\.com|optcgapi\.com)/[^\s"''<>]*$')
     and (c->'upload' is null or jsonb_typeof(c->'upload') = 'null'
          or c->>'upload' ~ ('^' || owner::text || '/[0-9a-f-]{36}\.jpg$'));
$$;

alter table public.game_profiles drop constraint if exists fav_card_valid;
alter table public.game_profiles add constraint fav_card_valid check (public.is_valid_card(fav_card, user_id)) not valid;
alter table public.decks drop constraint if exists deck_card_valid;
alter table public.decks add constraint deck_card_valid check (public.is_valid_card(card, user_id)) not valid;
drop function if exists public.is_valid_card(jsonb);

-- ---------- Bucket de imágenes de cartas (como el de fotos: público, JPEG, 1 MB, carpeta propia) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cards', 'cards', true, 1048576, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg'];

drop policy if exists "subir mis cartas" on storage.objects;
drop policy if exists "ver mis cartas" on storage.objects;
drop policy if exists "borrar mis cartas" on storage.objects;
-- Máximo 40 imágenes por persona (favorita de cada juego + mazos)
create policy "subir mis cartas" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'cards'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (select count(*) from storage.objects o
         where o.bucket_id = 'cards' and (storage.foldername(o.name))[1] = auth.uid()::text) < 40
  );
create policy "ver mis cartas" on storage.objects for select to authenticated
  using (bucket_id = 'cards' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "borrar mis cartas" on storage.objects for delete to authenticated
  using (bucket_id = 'cards' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Denuncias de imágenes ----------
-- Cada persona puede denunciar una imagen una vez; con 3 denuncias de personas distintas se oculta para todos
-- hasta que moderación la revise (y la borre o la restaure vaciando sus denuncias).
create table if not exists public.image_flags (
  path       text not null check (path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'),
  reporter   uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (path, reporter)
);
alter table public.image_flags enable row level security;
drop policy if exists "denunciar imagen" on public.image_flags;
create policy "denunciar imagen" on public.image_flags for insert to authenticated
  with check (reporter = auth.uid() and split_part(path, '/', 1) <> auth.uid()::text);

-- Solo devuelve las rutas ocultas, nunca quién denunció
create or replace function public.hidden_images() returns table (path text)
language sql stable security definer set search_path = public as $$
  select f.path from image_flags f group by f.path having count(*) >= 3;
$$;
revoke execute on function public.hidden_images() from public, anon;
grant execute on function public.hidden_images() to authenticated;

-- Límite: como mucho 30 denuncias de imágenes al día por persona
create or replace function public.limit_image_flags() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from image_flags where reporter = new.reporter and created_at > now() - interval '1 day') >= 30 then
    raise exception 'Demasiadas denuncias seguidas';
  end if;
  return new;
end;
$$;
drop trigger if exists image_flags_limit on public.image_flags;
create trigger image_flags_limit before insert on public.image_flags for each row execute function public.limit_image_flags();
