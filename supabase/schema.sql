-- =====================================================================
-- ManaMatch · Esquema de base de datos con permisos por usuario (Supabase / PostgreSQL)
-- Ejecutado en el proyecto de Supabase (eu-west-1) el 13-10-2026. Los cambios posteriores, como migraciones nuevas.
--
-- Principios:
--   · Row Level Security (RLS) activado en TODAS las tablas: sin política, nadie lee ni escribe.
--   · Los datos privados (fecha de nacimiento, ubicación) viven en tablas que solo ve su dueño.
--   · Los demás usuarios solo reciben rangos de distancia, calculados en el servidor.
-- =====================================================================

create extension if not exists postgis;

-- ---------- Perfil público ----------
create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 24),
  bio           text not null default '' check (char_length(bio) <= 160),
  avatar_path   text,                                   -- ruta en Storage, nunca una URL arbitraria
  active_game   text not null default 'magic' check (active_game in ('magic', 'pokemon', 'onepiece')),
  visible       boolean not null default true,
  verified_store_id uuid,                               -- lo marca el personal de una tienda, nunca el usuario
  created_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ---------- Datos privados: solo los ve su dueño ----------
create table public.private_profiles (
  user_id     uuid primary key references public.profiles on delete cascade,
  birth_date  date not null check (birth_date <= current_date - interval '18 years'),
  location    geography(point, 4326),                  -- nunca se expone a otros usuarios
  location_at timestamptz
);
alter table public.private_profiles enable row level security;

-- ---------- Un perfil por juego ----------
create table public.game_profiles (
  user_id  uuid references public.profiles on delete cascade,
  game     text check (game in ('magic', 'pokemon', 'onepiece')),
  level    text not null check (level in ('Casual', 'Casual competitivo', 'Competitivo')),
  fav_card jsonb not null,                              -- { "name": "...", "img": "..." }
  colors   text[] not null default '{}',
  formats  text[] not null default '{}' check (cardinality(formats) >= 1),
  primary key (user_id, game)
);
alter table public.game_profiles enable row level security;

create table public.decks (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.profiles on delete cascade,
  game     text not null check (game in ('magic', 'pokemon', 'onepiece')),
  name     text not null check (char_length(name) between 1 and 32),
  format   text not null,
  card     jsonb not null
);
alter table public.decks enable row level security;

-- ---------- Tiendas (públicas, gestionadas por el equipo) ----------
create table public.stores (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  events   text not null default '',
  location geography(point, 4326) not null
);
alter table public.stores enable row level security;

-- ---------- Bloqueos, retos, duelos y mensajes ----------
create table public.blocks (
  blocker uuid references public.profiles on delete cascade,
  blocked uuid references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
alter table public.blocks enable row level security;

create table public.likes (
  from_user uuid references public.profiles on delete cascade,
  to_user   uuid references public.profiles on delete cascade,
  is_super  boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user),
  check (from_user <> to_user)
);
alter table public.likes enable row level security;

create table public.matches (
  id     uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles on delete cascade,
  user_b uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);
alter table public.matches enable row level security;

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches on delete cascade,
  sender_id  uuid not null references public.profiles on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter    uuid not null references public.profiles on delete cascade,
  reported    uuid not null references public.profiles on delete cascade,
  reason      text not null,
  details     text not null default '' check (char_length(details) <= 500),
  status      text not null default 'pendiente',
  created_at  timestamptz not null default now()
);
alter table public.reports enable row level security;

-- ---------- Funciones auxiliares ----------
-- ¿Hay bloqueo en cualquiera de los dos sentidos?
create or replace function public.is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a));
$$;

create or replace function public.is_participant(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from matches where id = m and auth.uid() in (user_a, user_b));
$$;

-- Jugadores cercanos: devuelve SOLO el rango de distancia, nunca coordenadas.
create or replace function public.nearby_players(radius_km int default 5)
returns table (user_id uuid, distance_band text)
language sql stable security definer set search_path = public as $$
  select p.id,
         case when d < 1000 then 'A menos de 1 km' when d < 2000 then 'A 1–2 km'
              when d < 5000 then 'A 2–5 km' else 'A más de 5 km' end
  from profiles p
  join private_profiles pp on pp.user_id = p.id
  cross join lateral (
    select st_distance(pp.location, (select location from private_profiles where user_id = auth.uid())) as d
  ) dist
  where p.id <> auth.uid()
    and p.visible
    and pp.location is not null
    and d <= least(radius_km, 50) * 1000
    and not public.is_blocked(auth.uid(), p.id);
$$;
revoke execute on function public.nearby_players(int) from public, anon;
grant execute on function public.nearby_players(int) to authenticated;

-- ---------- Políticas (RLS) ----------
-- Solo los usuarios con sesión iniciada (rol "authenticated") ven perfiles: un visitante anónimo no ve a nadie.
-- Perfiles: los perfiles visibles y no bloqueados son públicos; cada uno solo edita el suyo
create policy "ver perfiles" on public.profiles for select to authenticated
  using (id = auth.uid() or (visible and not public.is_blocked(auth.uid(), id)));
create policy "crear mi perfil" on public.profiles for insert with check (id = auth.uid());
create policy "editar mi perfil" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
-- verified_store_id solo lo cambia el servidor. Revocar una sola columna no basta si hay permiso sobre la tabla
-- entera, así que se retira el UPDATE completo y se concede solo sobre las columnas que el usuario puede editar.
revoke update on public.profiles from authenticated;
grant update (display_name, bio, avatar_path, active_game, visible) on public.profiles to authenticated;

-- Datos privados: solo su dueño
create policy "mis datos privados" on public.private_profiles for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Perfiles de juego y mazos: lectura pública (si el perfil es visible), escritura solo del dueño
create policy "ver perfiles de juego" on public.game_profiles for select to authenticated
  using (exists (select 1 from profiles p where p.id = user_id));
create policy "editar mis perfiles de juego" on public.game_profiles for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ver mazos" on public.decks for select to authenticated
  using (exists (select 1 from profiles p where p.id = user_id));
create policy "editar mis mazos" on public.decks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "ver tiendas" on public.stores for select using (true);

-- Bloqueos: cada uno gestiona los suyos
create policy "mis bloqueos" on public.blocks for all
  using (blocker = auth.uid()) with check (blocker = auth.uid());

-- Retos: solo puedo crear los míos y ver los que he enviado (nadie ve quién le ha rechazado)
create policy "retar" on public.likes for insert
  with check (from_user = auth.uid() and not public.is_blocked(from_user, to_user));
create policy "ver mis retos" on public.likes for select using (from_user = auth.uid());

-- Duelos: solo los participantes (se crean con un trigger cuando el reto es mutuo, no desde la app)
create policy "ver mis duelos" on public.matches for select using (auth.uid() in (user_a, user_b));

-- Mensajes: solo participantes, sin bloqueo entre ellos y firmados por quien los envía
create policy "leer mensajes" on public.messages for select using (public.is_participant(match_id));
create policy "enviar mensajes" on public.messages for insert with check (
  sender_id = auth.uid()
  and public.is_participant(match_id)
  and not exists (
    select 1 from matches m where m.id = match_id and public.is_blocked(m.user_a, m.user_b)
  )
);

-- Denuncias: puedo crearlas, pero solo el equipo de moderación (rol de servicio) las lee
create policy "denunciar" on public.reports for insert with check (reporter = auth.uid() and reporter <> reported);

-- ---------- Límite de velocidad del chat en el servidor ----------
create or replace function public.limit_messages() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from messages where sender_id = new.sender_id and created_at > now() - interval '10 seconds') >= 5 then
    raise exception 'Demasiados mensajes seguidos';
  end if;
  return new;
end;
$$;
create trigger messages_rate_limit before insert on public.messages
  for each row execute function public.limit_messages();

-- ---------- Duelo automático cuando el reto es mutuo ----------
create or replace function public.create_match_on_mutual_like() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from likes where from_user = new.to_user and to_user = new.from_user) then
    insert into matches (user_a, user_b)
    values (least(new.from_user, new.to_user), greatest(new.from_user, new.to_user))
    on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger likes_mutual after insert on public.likes
  for each row execute function public.create_match_on_mutual_like();

-- PENDIENTE: moderación del texto de los mensajes y de las fotos (función en el servidor o Edge Function),
-- verificación de edad con un proveedor externo y Storage con políticas por usuario para las fotos.
