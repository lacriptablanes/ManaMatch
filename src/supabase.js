import { createClient } from '@supabase/supabase-js';

// Conexión con el servidor (Supabase). Las dos variables son públicas por diseño: la seguridad la ponen
// los permisos de la base de datos (supabase/schema.sql), no esconder estas claves.
// Nunca pongas aquí la clave "secret" o "service_role": todo lo que va en la app lo puede leer cualquiera.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Sin configurar (p. ej. al probar en local sin .env.local) la app funciona en modo demostración
export const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null;
