-- =====================================================================
-- ManaMatch · Reparto de anuncios de tiendas
--   · Modo «fair» (rotación justa): se muestra el anuncio con menos visualizaciones hoy.
--   · Modo «paid» (por pago): sale más veces el anuncio con más peso (weight), al azar.
--   · Cada anuncio tiene un tope diario de visualizaciones (daily_cap).
--   · El modo se cambia en app_settings (ver docs/PUBLICIDAD.md). La app pide un anuncio por visita.
-- =====================================================================
alter table public.store_ads
  add column if not exists weight int not null default 1 check (weight between 1 and 10),
  add column if not exists daily_cap int not null default 1000 check (daily_cap > 0);

create table if not exists public.app_settings (
  key   text primary key,
  value text not null
);
alter table public.app_settings enable row level security;
drop policy if exists "leer ajustes" on public.app_settings;
create policy "leer ajustes" on public.app_settings for select to anon, authenticated using (true);
insert into public.app_settings (key, value) values ('store_ad_mode', 'fair') on conflict (key) do nothing;

-- Elige un único anuncio para esta visita, respetando fechas, tope diario y el modo activo
create or replace function public.pick_store_ad()
returns table (ad_id uuid, ad_store_id uuid, store_name text, ad_title text, ad_body text, ad_image_path text, ad_link_url text)
language plpgsql security definer set search_path = public as $$
declare
  current_mode text;
begin
  select value into current_mode from public.app_settings where key = 'store_ad_mode';
  return query
    select a.id, a.store_id, s.name, a.title, a.body, a.image_path, a.link_url
    from public.store_ads a
    join public.stores s on s.id = a.store_id
    left join public.store_ad_daily d on d.ad_id = a.id and d.day = current_date
    where a.starts_at <= now() and a.ends_at > now()
      and coalesce(d.views, 0) < a.daily_cap
    order by
      case when current_mode = 'paid' then -ln(random()) / a.weight else coalesce(d.views, 0)::float end,
      random()
    limit 1;
end;
$$;
grant execute on function public.pick_store_ad() to anon, authenticated;
