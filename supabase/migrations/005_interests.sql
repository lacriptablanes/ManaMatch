-- =====================================================================
-- ManaMatch · Lista de juegos del jugador ("Tus juegos")
-- Hasta 10 identificadores del catálogo de la app (src/catalog.js). Se usan para ordenar a los jugadores
-- por juegos en común. Solo letras minúsculas, números y guiones: nunca texto libre.
-- =====================================================================
alter table public.profiles
  add column if not exists interests text[] not null default '{}';

alter table public.profiles drop constraint if exists interests_valid;
alter table public.profiles add constraint interests_valid check (
  cardinality(interests) <= 10
  and array_to_string(interests, ',') ~ '^([a-z0-9-]{1,24}(,|$))*$'
);

grant update (interests) on public.profiles to authenticated;

-- Para buscar rápido a quien comparte juegos (operador && de arrays)
create index if not exists profiles_interests_idx on public.profiles using gin (interests);
