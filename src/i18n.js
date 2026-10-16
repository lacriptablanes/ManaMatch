// Idiomas de la app. El texto en español es la clave: t('Editar perfil') devuelve la traducción
// del idioma activo o, si falta, el propio texto en español. Variables: t('Hola, {name}', { name }).
import { useSyncExternalStore } from 'react';

export const LANGS = [['es', 'Español'], ['ca', 'Català'], ['eu', 'Euskara'], ['gl', 'Galego'], ['en', 'English']];
// Los diccionarios no se cargan todos con la app: cada idioma es un archivo aparte que solo se descarga si se usa.
const LOADERS = {
  en: () => import('./locales/en.js'),
  ca: () => import('./locales/ca.js'),
  gl: () => import('./locales/gl.js'),
  eu: () => import('./locales/eu.js'),
};
const DICTS = {};
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
/* Descarga el diccionario del idioma (el español no necesita ninguno). Si falla, se queda en español. */
const loadDict = (l) => {
  if (!LOADERS[l] || DICTS[l]) return Promise.resolve();
  return LOADERS[l]().then((m) => { DICTS[l] = m.default; }, () => {});
};
const apply = () => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.title = t('ManaMatch · Rivales de TCG cerca de ti');
};
apply();
/* La app espera a esta promesa para pintarse ya traducida, sin un destello en español */
export const ready = loadDict(lang).then(apply);

export const getLang = () => lang;
export const locale = () => LOCALES[lang];
export async function setLang(l) {
  if (!LOCALES[l] || l === lang) return;
  await loadDict(l);
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
