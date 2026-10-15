// Anuncios de tiendas («Patrocinado»). La base de datos elige un anuncio por visita (rotación justa
// o por pago, según app_settings). Sin Supabase (modo demostración) se muestra un anuncio de ejemplo.
import { supabase } from './supabase';
import { cardArt } from './data';

const DEMO_ADS = [
  { id: 'demo-ad-1', storeId: 's1', storeName: 'Dragón Rojo Games', title: 'Commander este miércoles', body: 'Mesa abierta desde las 18:00. Trae tu mazo y tus fundas.', imageUrl: cardArt('Sol Ring'), link: 'https://magic.wizards.com/' },
];

// Devuelve como mucho un anuncio para esta visita (lista de 0 o 1)
export async function loadStoreAds() {
  if (!supabase) return DEMO_ADS;
  const { data, error } = await supabase.rpc('pick_store_ad');
  if (error || !data?.length) return [];
  const row = data[0];
  return [{
    id: row.ad_id,
    storeId: row.ad_store_id,
    storeName: row.store_name,
    title: row.ad_title,
    body: row.ad_body ?? '',
    link: row.ad_link_url ?? '',
    // Solo rutas que el equipo ha subido al bucket público; la URL se construye aquí, nunca viene de una tienda
    imageUrl: row.ad_image_path ? supabase.storage.from('store-ads').getPublicUrl(row.ad_image_path).data.publicUrl : '',
  }];
}

// Sin datos personales: solo se suma un contador del anuncio. Nunca bloquea la app si falla.
export function logStoreAd(id, kind) {
  if (!supabase || String(id).startsWith('demo-')) return;
  supabase.rpc('log_store_ad_event', { p_ad: id, p_kind: kind }).then(() => {}, () => {});
}
