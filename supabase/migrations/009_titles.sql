-- =====================================================================
-- ManaMatch · Título de jugador (como en los videojuegos), elegido entre los desbloqueados
-- Los requisitos de cada título están en src/titles.js. De momento los comprueba la app; cuando la
-- fiabilidad y la verificación vengan del servidor, conviene validarlos aquí (función o trigger).
-- =====================================================================
alter table public.profiles add column if not exists title text check (title is null or title ~ '^[a-z-]{1,24}$');
grant update (title) on public.profiles to authenticated;
