-- =====================================================================
-- ManaMatch · Anuncios de tiendas («Patrocinado»)
--   · Las tiendas son las anunciantes. Los anuncios los crea el equipo (panel de Supabase o service_role),
--     nunca la app ni la propia tienda desde la app.
--   · Cualquiera (también sin cuenta) lee solo los anuncios activos en este momento.
--   · Las impresiones y clics se cuentan por día y anuncio, sin guardar quién los vio.
-- =====================================================================
create table if not exists public.store_ads (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores on delete cascade,
  title      text not null check (char_length(title) between 1 and 60),
  body       text not null default '' check (char_length(body) <= 140),
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
alter table public.store_ads enable row level security;
drop policy if exists "ver anuncios activos" on public.store_ads;
create policy "ver anuncios activos" on public.store_ads for select to anon, authenticated
  using (starts_at <= now() and ends_at > now());

-- Contadores diarios por anuncio. Sin políticas: solo los escribe la función de abajo.
create table if not exists public.store_ad_daily (
  ad_id  uuid not null references public.store_ads on delete cascade,
  day    date not null default current_date,
  views  int not null default 0 check (views >= 0),
  clicks int not null default 0 check (clicks >= 0),
  primary key (ad_id, day)
);
alter table public.store_ad_daily enable row level security;

create or replace function public.log_store_ad_event(p_ad uuid, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('view', 'click') then raise exception 'tipo de evento no válido'; end if;
  -- Solo cuenta anuncios que estén activos ahora mismo
  if not exists (select 1 from public.store_ads where id = p_ad and starts_at <= now() and ends_at > now()) then return; end if;
  insert into public.store_ad_daily (ad_id, day) values (p_ad, current_date) on conflict do nothing;
  if p_kind = 'view' then
    update public.store_ad_daily set views = views + 1 where ad_id = p_ad and day = current_date;
  else
    update public.store_ad_daily set clicks = clicks + 1 where ad_id = p_ad and day = current_date;
  end if;
end;
$$;
grant execute on function public.log_store_ad_event(uuid, text) to anon, authenticated;
