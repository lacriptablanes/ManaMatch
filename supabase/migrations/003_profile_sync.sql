-- =====================================================================
-- ManaMatch · Guardar el perfil completo en la cuenta
-- Añade lo que la app ya tenía pero el esquema no: disponibilidad, tiendas habituales, ajustes privados
-- y las fotos de perfil (Storage, una carpeta por usuario).
-- =====================================================================

-- ---------- Perfil público: disponibilidad y tiendas (se muestran en la tarjeta del jugador) ----------
alter table public.profiles
  add column if not exists days text[] not null default '{}'
    check (days <@ array['L', 'M', 'X', 'J', 'V', 'S', 'D']::text[]),
  add column if not exists slots text[] not null default '{}'
    check (slots <@ array['Mañana', 'Tarde', 'Noche']::text[]),
  -- De momento son los identificadores de las tiendas de ejemplo; pasarán a la tabla stores cuando se den de alta
  add column if not exists store_ids text[] not null default '{}' check (cardinality(store_ids) <= 10),
  add column if not exists show_distance boolean not null default true;

-- La foto solo puede estar en la carpeta del propio usuario (nunca una URL arbitraria)
alter table public.profiles drop constraint if exists avatar_in_own_folder;
alter table public.profiles add constraint avatar_in_own_folder
  check (avatar_path is null or (avatar_path like id::text || '/%' and avatar_path !~ '\.\.'));

-- Las columnas nuevas también las puede editar su dueño (verified_store_id sigue bloqueada)
grant update (days, slots, store_ids, show_distance) on public.profiles to authenticated;

-- ---------- Ajustes privados (radio, filtros, notificaciones): solo los ve su dueño ----------
alter table public.private_profiles
  add column if not exists settings jsonb not null default '{}' check (pg_column_size(settings) < 2000);

-- Límites de tamaño para que nadie llene la base de datos
alter table public.game_profiles drop constraint if exists fav_card_size;
alter table public.game_profiles add constraint fav_card_size check (pg_column_size(fav_card) < 2000);
alter table public.decks drop constraint if exists deck_card_size;
alter table public.decks add constraint deck_card_size check (pg_column_size(card) < 2000);

-- ---------- Fotos de perfil ----------
-- Bucket público para que los jugadores vean las fotos, pero cada archivo tiene un nombre aleatorio
-- imposible de adivinar, y solo se conoce a través de perfiles que exigen haber iniciado sesión.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg'];

drop policy if exists "subir mi foto" on storage.objects;
drop policy if exists "ver mis fotos" on storage.objects;
drop policy if exists "borrar mis fotos" on storage.objects;
create policy "subir mi foto" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "ver mis fotos" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "borrar mis fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
