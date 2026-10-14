-- =====================================================================
-- ManaMatch · Súper duelos de pago
--   · Saldo por usuario (super_credits). Solo lo suma el servidor tras un pago confirmado por Stripe
--     (Edge Function stripe-webhook con la clave de servicio); el usuario solo puede leer el suyo.
--   · send_super_like gasta uno y deja el reto marcado como súper (likes.is_super).
--   · my_super_likers devuelve quién te ha retado con Súper duelo, para mostrarlos los primeros.
-- =====================================================================
create table if not exists public.super_credits (
  user_id    uuid primary key references public.profiles on delete cascade,
  balance    int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
alter table public.super_credits enable row level security;
drop policy if exists "ver mi saldo" on public.super_credits;
create policy "ver mi saldo" on public.super_credits for select to authenticated using (user_id = auth.uid());

-- Registro de compras (idempotente por sesión de Stripe). Sin políticas: solo lo usa el servidor.
create table if not exists public.super_purchases (
  stripe_session text primary key,
  user_id        uuid not null references public.profiles on delete cascade,
  pack           text not null,
  credits        int not null check (credits > 0),
  amount_cents   int not null check (amount_cents >= 0),
  currency       text not null,
  created_at     timestamptz not null default now()
);
alter table public.super_purchases enable row level security;

-- Gastar un Súper duelo con alguien (atómico: no se puede gastar lo que no tienes)
create or replace function public.send_super_like(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if target = auth.uid() then raise exception 'No puedes retarte a ti mismo'; end if;
  if public.is_blocked(auth.uid(), target) then raise exception 'Bloqueado'; end if;
  update super_credits set balance = balance - 1, updated_at = now() where user_id = auth.uid() and balance > 0;
  if not found then raise exception 'Sin súper duelos'; end if;
  insert into likes (from_user, to_user, is_super) values (auth.uid(), target, true)
  on conflict (from_user, to_user) do update set is_super = true;
end;
$$;
revoke execute on function public.send_super_like(uuid) from public, anon;
grant execute on function public.send_super_like(uuid) to authenticated;

-- Quién me ha retado con Súper duelo (y aún no es mi rival ni está bloqueado)
create or replace function public.my_super_likers() returns setof uuid
language sql stable security definer set search_path = public as $$
  select l.from_user from likes l
  where l.to_user = auth.uid() and l.is_super and not public.is_blocked(auth.uid(), l.from_user)
    and not exists (select 1 from matches m where (m.user_a, m.user_b) = (least(l.from_user, auth.uid()), greatest(l.from_user, auth.uid())));
$$;
revoke execute on function public.my_super_likers() from public, anon;
grant execute on function public.my_super_likers() to authenticated;

-- Sumar saldo: solo desde el servidor (Edge Function con la clave de servicio)
create or replace function public.add_super_credits(target uuid, amount int) returns void
language sql security definer set search_path = public as $$
  insert into super_credits (user_id, balance) values (target, amount)
  on conflict (user_id) do update set balance = super_credits.balance + excluded.balance, updated_at = now();
$$;
revoke execute on function public.add_super_credits(uuid, int) from public, anon, authenticated;
