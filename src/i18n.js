// Idiomas de la app. El texto en español es la clave: t('Editar perfil') devuelve la traducción
// del idioma activo o, si falta, el propio texto en español. Variables: t('Hola, {name}', { name }).
import { useSyncExternalStore } from 'react';
import en from './locales/en.js';
import ca from './locales/ca.js';
import gl from './locales/gl.js';
import eu from './locales/eu.js';

export const LANGS = [['es', 'Español'], ['ca', 'Català'], ['eu', 'Euskara'], ['gl', 'Galego'], ['en', 'English']];
const DICTS = { en, ca, gl, eu };
const LOCALES = { es: 'es-ES', ca: 'ca-ES', eu: 'eu-ES', gl: 'gl-ES', en: 'en-GB' };
const KEY = 'manamatch-lang';

const detect = () => {
  try {
    const saved = localStorage.getItem(KEY);
    if (LOCALES[saved]) return saved;
  } catch { /* sin almacenamiento */ }
  const nav = (navigator.languages ?? [navigator.language ?? 'es']).map((l) => l.slice(0, 2).toLowerCase());
  return nav.find((l) => LOCALES[l]) ?? 'es';
};

let lang = typeof navigator === 'undefined' ? 'es' : detect();
const listeners = new Set();
const apply = () => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.title = t('ManaMatch · Rivales de TCG cerca de ti');
};
apply();

export const getLang = () => lang;
export const locale = () => LOCALES[lang];
export function setLang(l) {
  if (!LOCALES[l] || l === lang) return;
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* sin almacenamiento */ }
  apply();
  listeners.forEach((f) => f());
}
const subscribe = (f) => { listeners.add(f); return () => listeners.delete(f); };
/* Vuelve a pintar el componente cuando cambia el idioma */
export const useLang = () => useSyncExternalStore(subscribe, getLang, getLang);

export function t(text, vars) {
  const out = (lang !== 'es' && DICTS[lang]?.[text]) || text;
  return vars ? out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : out;
}
