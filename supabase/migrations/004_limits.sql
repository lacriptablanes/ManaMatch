-- =====================================================================
-- ManaMatch · Límites que antes solo ponía la app
--   · Las imágenes de cartas solo pueden venir de los servicios oficiales de imágenes (nunca una URL cualquiera,
--     que serviría para rastrear a quien ve el perfil o mostrar contenido inapropiado).
--   · Máximo de fotos por usuario en Storage, para que nadie llene el almacenamiento saltándose la app.
-- =====================================================================

-- ¿La carta { "name": "...", "img": "..." } es válida? img es opcional; si existe, solo de hosts permitidos
create or replace function public.is_valid_card(c jsonb) returns boolean
language sql immutable set search_path = public as $$
  select jsonb_typeof(c) = 'object'
     and char_length(coalesce(c->>'name', '')) between 1 and 80
     and (c->'img' is null or jsonb_typeof(c->'img') = 'null' or c->>'img' = ''
          or c->>'img' ~ '^https://(api\.scryfall\.com|cards\.scryfall\.io|images\.pokemontcg\.io|images\.scrydex\.com|optcgapi\.com)/[^\s"''<>]*$');
$$;

alter table public.game_profiles drop constraint if exists fav_card_valid;
alter table public.game_profiles add constraint fav_card_valid check (public.is_valid_card(fav_card)) not valid;
alter table public.decks drop constraint if exists deck_card_valid;
alter table public.decks add constraint deck_card_valid check (public.is_valid_card(card)) not valid;
-- "not valid" no revisa las filas que ya existen (por si alguna antigua no cumple); las nuevas y las editadas sí.
-- Para revisarlas también: alter table ... validate constraint ...;

-- Máximo de mazos por usuario y juego
create or replace function public.limit_decks() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Un "upsert" de un mazo que ya existe también pasa por aquí: ese no cuenta como nuevo
  if exists (select 1 from decks where id = new.id) then return new; end if;
  if (select count(*) from decks where user_id = new.user_id and game = new.game) >= 20 then
    raise exception 'Demasiados mazos';
  end if;
  return new;
end;
$$;
drop trigger if exists decks_limit on public.decks;
create trigger decks_limit before insert on public.decks for each row execute function public.limit_decks();

-- ---------- Fotos: como mucho 2 a la vez por usuario ----------
-- La app sube la nueva y después borra la anterior, así que hacen falta 2 huecos.
drop policy if exists "subir mi foto" on storage.objects;
create policy "subir mi foto" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (select count(*) from storage.objects o
         where o.bucket_id = 'avatars' and (storage.foldername(o.name))[1] = auth.uid()::text) < 2
  );
