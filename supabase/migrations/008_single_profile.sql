-- =====================================================================
-- ManaMatch · Perfil único y arreglo de la subida de imágenes
--
-- 1) Arreglo: las políticas de 004 y 006 contaban los archivos del usuario con una subconsulta sobre la propia
--    tabla storage.objects. Postgres lo rechaza ("infinite recursion detected in policy for relation objects"),
--    así que ninguna foto ni imagen de carta se podía subir. Ahora se cuenta con una función SECURITY DEFINER.
-- 2) Perfil único: nivel, formatos y carta favorita pasan a la tabla profiles (antes uno por juego en game_profiles).
--    Se copian los datos del juego activo. La tabla game_profiles se deja de usar (se puede borrar más adelante).
-- =====================================================================

-- ---------- 1) Contar archivos propios sin recursión ----------
create or replace function public.my_file_count(bucket text) returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from storage.objects o
  where o.bucket_id = bucket and (storage.foldername(o.name))[1] = auth.uid()::text;
$$;
revoke execute on function public.my_file_count(text) from public, anon;
grant execute on function public.my_file_count(text) to authenticated;

drop policy if exists "subir mi foto" on storage.objects;
create policy "subir mi foto" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and public.my_file_count('avatars') < 2);

drop policy if exists "subir mis cartas" on storage.objects;
create policy "subir mis cartas" on storage.objects for insert to authenticated
  with check (bucket_id = 'cards' and (storage.foldername(name))[1] = auth.uid()::text and public.my_file_count('cards') < 40);

-- ---------- 2) Perfil único ----------
alter table public.profiles
  add column if not exists level text not null default 'Casual' check (level in ('Casual', 'Casual competitivo', 'Competitivo')),
  add column if not exists formats text[] not null default '{}' check (cardinality(formats) <= 20),
  add column if not exists fav_card jsonb not null default '{}'::jsonb check (pg_column_size(fav_card) < 2000);

alter table public.profiles drop constraint if exists fav_card_valid;
alter table public.profiles add constraint fav_card_valid check (
  public.is_valid_card(fav_card, id) and coalesce(fav_card->>'game', 'magic') ~ '^[a-z0-9-]{1,24}$'
) not valid;

grant update (level, formats, fav_card) on public.profiles to authenticated;

-- Copia nivel, formatos (de todos tus juegos) y carta favorita (del juego activo) a profiles
update public.profiles p set
  level = coalesce(g.level, p.level),
  fav_card = coalesce(g.fav_card, '{}'::jsonb) || jsonb_build_object('game', p.active_game),
  formats = coalesce((select array_agg(distinct f) from public.game_profiles x, unnest(x.formats) f where x.user_id = p.id), '{}')
from public.game_profiles g
where g.user_id = p.id and g.game = p.active_game and p.fav_card = '{}'::jsonb;
