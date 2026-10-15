-- =====================================================================
-- ManaMatch · Imágenes de los anuncios de tiendas
--   · Bucket público «store-ads» solo de lectura: la app muestra la imagen por URL pública.
--   · Solo JPEG o WebP, de 500 KB como máximo. Sin políticas de subida: solo el equipo sube
--     las imágenes (panel de Supabase o service_role), tras revisarlas.
-- =====================================================================
alter table public.store_ads add column if not exists image_path text
  check (image_path is null or char_length(image_path) <= 200);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-ads', 'store-ads', true, 512000, array['image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
