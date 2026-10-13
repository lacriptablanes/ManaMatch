-- =====================================================================
-- ManaMatch · Fiabilidad: tras una partida, cada jugador confirma si su rival se presentó
--   · Cada participante responde una vez por duelo (puede cambiar su respuesta).
--   · Nadie ve las respuestas individuales: solo el resumen (partidas confirmadas y ausencias).
--   · "Fiable" con 3 o más partidas y como mucho un 10 % de ausencias (lo decide la app con este resumen).
-- =====================================================================
create table if not exists public.attendance (
  match_id   uuid not null references public.matches on delete cascade,
  reporter   uuid not null default auth.uid() references public.profiles on delete cascade,
  subject    uuid not null references public.profiles on delete cascade,  -- el rival (lo rellena el trigger)
  result     text not null check (result in ('came', 'noshow', 'cancelled')),
  updated_at timestamptz not null default now(),
  primary key (match_id, reporter)
);
alter table public.attendance enable row level security;

-- El rival se calcula en el servidor: nadie puede valorar a quien no era su rival en ese duelo
create or replace function public.fill_attendance_subject() returns trigger
language plpgsql security definer set search_path = public as $$
declare m matches;
begin
  select * into m from matches where id = new.match_id;
  if m is null or new.reporter not in (m.user_a, m.user_b) then raise exception 'No participas en este duelo'; end if;
  -- Solo se puede confirmar a partir de 1 hora después de crear el duelo (evita valoraciones instantáneas)
  if m.created_at > now() - interval '1 hour' then raise exception 'Aún no ha dado tiempo a jugar'; end if;
  new.subject := case when new.reporter = m.user_a then m.user_b else m.user_a end;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists attendance_subject on public.attendance;
create trigger attendance_subject before insert or update on public.attendance
  for each row execute function public.fill_attendance_subject();

drop policy if exists "confirmar asistencia" on public.attendance;
drop policy if exists "cambiar mi respuesta" on public.attendance;
drop policy if exists "ver mis respuestas" on public.attendance;
create policy "confirmar asistencia" on public.attendance for insert to authenticated
  with check (reporter = auth.uid() and public.is_participant(match_id));
create policy "cambiar mi respuesta" on public.attendance for update to authenticated
  using (reporter = auth.uid()) with check (reporter = auth.uid());
create policy "ver mis respuestas" on public.attendance for select to authenticated
  using (reporter = auth.uid());

-- Resumen público de fiabilidad (sin detalle de quién respondió qué)
create or replace function public.player_reliability(ids uuid[])
returns table (user_id uuid, played int, no_show int)
language sql stable security definer set search_path = public as $$
  select subject, count(*) filter (where result = 'came')::int, count(*) filter (where result = 'noshow')::int
  from attendance where subject = any(ids[1:100]) group by subject;
$$;
revoke execute on function public.player_reliability(uuid[]) from public, anon;
grant execute on function public.player_reliability(uuid[]) to authenticated;
