# Publicidad de ManaMatch

## Modelo (opción A): las tiendas son las anunciantes

- **Quién anuncia:** tiendas de juegos de cartas que quieren visibilidad en su zona.
- **Dónde sale:** en «Cerca de ti», como fila «Patrocinado» encima de la lista de tiendas, solo si la tienda está dentro de tu radio.
- **Qué no tiene:** anuncios en el chat, en la carta de jugador ni en el perfil. Nunca se segmenta por edad, ubicación exacta ni datos personales.
- **Premium:** no ve anuncios (`isPremium` en `src/App.jsx`).
- **Quitar:** el usuario puede ocultar el anuncio en esa sesión.

## Cómo se gestiona

1. **Vender (manual):** contacto directo con la tienda y tarifa mensual fija. Sin tarifas por clic.
2. **Cobrar:** factura mensual por transferencia, o por Stripe más adelante.
3. **Crear el anuncio:** una fila en `store_ads` (panel de Supabase). Campos: `store_id` (la tienda), `title` (máx. 60), `body` (máx. 140), `starts_at` y `ends_at`.
   - Los anuncios de otras tiendas no se pueden crear desde la app: solo el equipo, con el panel o `service_role`.
4. **Medir:** `store_ad_daily` guarda visualizaciones y clics por día y anuncio. Sin identidad de usuario.
5. **Informar:** al final de cada mes, un resumen por tienda con esos contadores.

## Migración y estado

- Migración: `supabase/migrations/011_store_ads.sql` (tablas, RLS y función `log_store_ad_event`).
- **Aún no aplicada en la base de datos.** Hay que ejecutarla en Supabase antes de que aparezcan anuncios reales.
- En modo demostración (sin Supabase) se muestra un anuncio de ejemplo.
- Limitación conocida: la función de contadores es pública y no limita el número de llamadas. Antes de tener muchos anunciantes, hay que añadir límites (por ejemplo, con una Edge Function).

## Pendiente antes de lanzar

- Precio, número de tiendas piloto y contrato mínimo (con asesoramiento legal).
- Carga real de tiendas desde la tabla `stores` (hoy `STORES` es de demostración), porque los anuncios solo aparecen para tiendas que están en la lista.
- Revisar la política de privacidad (RGPD) para decir que se cuentan visualizaciones y clics sin identificar al usuario.

## Reparto de anuncios (migración 014)

Cada visita a Descubrir o Cerca de ti pide **un** anuncio a la base de datos (`pick_store_ad`). Solo entran los activos, que no hayan llegado a su tope diario (`daily_cap`).

- **Modo `fair` (rotación justa, por defecto):** sale el anuncio con menos visualizaciones hoy.
- **Modo `paid` (por pago):** sale al azar, pero con más probabilidad el de mayor `weight` (1 a 10).

Cambiar de modo, cuando quieras, en el SQL Editor:

```sql
update public.app_settings set value = 'paid' where key = 'store_ad_mode';   -- por pago
update public.app_settings set value = 'fair' where key = 'store_ad_mode';   -- rotación justa
```

Para dar más peso a una tienda, cambia su `weight` en `store_ads` (por ejemplo, 5 frente a 1).
