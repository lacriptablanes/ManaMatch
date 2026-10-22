-- =====================================================================
-- ManaMatch · Código de jugador: otra persona te encuentra con tu código aunque no estéis cerca.
--   · El código vive en su propia tabla: solo lo ve su dueño (no se filtra al listar perfiles).
--   · find_player_by_code devuelve solo el id de un perfil visible y no bloqueado, con coincidencia exacta.
-- =====================================================================
create table if not exists public.share_codes (
  user_id uuid primary key references public.profiles on delete cascade,
  code    text not null unique check (code ~ '^[0-9a-f]{12}$')
);
alter table public.share_codes enable row level security;
drop policy if exists "mi código" on public.share_codes;
create policy "mi código" on public.share_codes for select to authenticated using (user_id = auth.uid());

-- Código nuevo: 12 caracteres hexadecimales aleatorios (48 bits)
create or replace function public.new_share_code() returns text
language sql volatile as $$
  select substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
$$;

-- Devuelve mi código; lo crea la primera vez
create or replace function public.ensure_share_code() returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  insert into share_codes (user_id, code) values (auth.uid(), new_share_code())
  on conflict (user_id) do nothing;
  select code into c from share_codes where user_id = auth.uid();
  return c;
end;
$$;

-- Cambia mi código: el anterior deja de funcionar
create or replace function public.regenerate_share_code() returns text
language plpgsql security definer set search_path = public as $$
declare c text := new_share_code();
begin
  insert into share_codes (user_id, code) values (auth.uid(), c)
  on conflict (user_id) do update set code = excluded.code;
  return c;
end;
$$;

-- Busca a quien tiene ese código. Solo devuelve el id si el perfil es visible y no hay bloqueo.
create or replace function public.find_player_by_code(p_code text) returns setof uuid
language sql stable security definer set search_path = public as $$
  select sc.user_id
  from share_codes sc
  join profiles p on p.id = sc.user_id
  where sc.code = lower(p_code)
    and sc.user_id <> auth.uid()
    and p.visible
    and not public.is_blocked(auth.uid(), sc.user_id);
$$;

revoke execute on function public.new_share_code() from public, anon, authenticated;
revoke execute on function public.ensure_share_code() from public, anon;
revoke execute on function public.regenerate_share_code() from public, anon;
revoke execute on function public.find_player_by_code(text) from public, anon;
grant execute on function public.ensure_share_code() to authenticated;
grant execute on function public.regenerate_share_code() to authenticated;
grant execute on function public.find_player_by_code(text) to authenticated;

-- Perfiles que ya existían reciben su código
insert into share_codes (user_id, code)
select id, new_share_code() from profiles
on conflict (user_id) do nothing;
