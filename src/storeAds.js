// Anuncios de tiendas («Patrocinado»). Con Supabase, solo se leen los anuncios activos (política RLS);
// sin Supabase (modo demostración) se muestra un anuncio de ejemplo para poder probarlo.
import { supabase } from './supabase';

const DEMO_ADS = [
  { id: 'demo-ad-1', store_id: 's1', title: 'Commander este miércoles', body: 'Mesa abierta desde las 18:00. Trae tu mazo y tus fundas.' },
];

export async function loadStoreAds() {
  if (!supabase) return DEMO_ADS;
  const { data, error } = await supabase.from('store_ads').select('id, store_id, title, body');
  if (error) return [];
  return data ?? [];
}

// Sin datos personales: solo se suma un contador del anuncio. Nunca bloquea la app si falla.
export function logStoreAd(id, kind) {
  if (!supabase || String(id).startsWith('demo-')) return;
  supabase.rpc('log_store_ad_event', { p_ad: id, p_kind: kind }).then(() => {}, () => {});
}
