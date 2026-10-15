// Anuncios de tiendas («Patrocinado»). Con Supabase, solo se leen los anuncios activos (política RLS);
// sin Supabase (modo demostración) se muestra un anuncio de ejemplo para poder probarlo.
import { supabase } from './supabase';
import { cardArt } from './data';

const DEMO_ADS = [
  { id: 'demo-ad-1', store_id: 's1', title: 'Commander este miércoles', body: 'Mesa abierta desde las 18:00. Trae tu mazo y tus fundas.', imageUrl: cardArt('Sol Ring'), link: 'https://magic.wizards.com/' },
];

export async function loadStoreAds() {
  if (!supabase) return DEMO_ADS;
  const { data, error } = await supabase.from('store_ads').select('id, store_id, title, body, image_path, link_url');
  if (error) return [];
  // Solo rutas que el equipo ha subido al bucket público; la URL se construye aquí, nunca viene de una tienda
  return (data ?? []).map(({ image_path, link_url, ...ad }) => ({
    ...ad,
    link: link_url || '',
    imageUrl: image_path ? supabase.storage.from('store-ads').getPublicUrl(image_path).data.publicUrl : '',
  }));
}

// Sin datos personales: solo se suma un contador del anuncio. Nunca bloquea la app si falla.
export function logStoreAd(id, kind) {
  if (!supabase || String(id).startsWith('demo-')) return;
  supabase.rpc('log_store_ad_event', { p_ad: id, p_kind: kind }).then(() => {}, () => {});
}
