-- =====================================================================
-- ManaMatch · Enlace opcional en los anuncios de tiendas
--   · Solo HTTPS y de hasta 300 caracteres. Lo añade el equipo al revisar el anuncio.
--   · La app avisa antes de salir de ManaMatch y abre el enlace sin pasar datos del usuario.
-- =====================================================================
alter table public.store_ads add column if not exists link_url text
  check (link_url is null or (link_url like 'https://%' and char_length(link_url) <= 300));
