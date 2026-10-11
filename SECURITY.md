# Seguridad de ManaMatch

ManaMatch maneja datos sensibles: ubicación aproximada, fotos, chats y posibles menores.
Este documento recoge qué está hecho y qué falta antes de abrir la app al público.

> **Regla de oro:** el servidor nunca se fía de la app. Todo lo que la app comprueba
> (edad, filtros del chat, bloqueos, límites) es solo comodidad para el usuario y debe
> repetirse en el servidor, porque cualquiera puede saltarse el código del navegador.

## Estado actual (versión sin servidor)

### Hecho

- [x] **Cabeceras de seguridad HTTP** (`security-headers.js`). Al compilar se genera `dist/_headers`
  para Netlify / Cloudflare Pages, y `npm run preview` las aplica para probarlas en local.
  - Política de contenido (CSP): solo se ejecuta código propio y solo se conecta a los servicios listados.
  - HTTPS obligatorio (HSTS), sin incrustación en otras webs, sin detección de tipo, permisos del navegador limitados.
- [x] **Dependencias mínimas**: solo React en producción; `npm audit` sin vulnerabilidades.
- [x] **Fotos**: solo imágenes, máximo 10 MB, redimensionadas a 320 px; al redibujarlas se eliminan los
  metadatos EXIF, incluida la ubicación GPS de la foto.
- [x] **Datos guardados en el dispositivo**: se validan al cargar (una foto manipulada o un juego inválido se descartan).
- [x] **Borrar mis datos de este dispositivo** desde el perfil.
- [x] **Ubicación difusa**: solo rangos de distancia; el radar no revela posiciones reales.
- [x] **Moderación del chat** (insinuaciones, contenido sexual, datos de contacto) y **límite de velocidad** (5 mensajes / 10 s).
- [x] **Denunciar y bloquear**, código de conducta y aviso de seguridad en cada chat.
- [x] El texto de los usuarios nunca se inserta como HTML (React lo escapa; no usar `dangerouslySetInnerHTML`).

### Pendiente al montar el servidor (imprescindible)

- [ ] **Autenticación** con un proveedor (Supabase Auth, Firebase Auth…): inicio con Google/Apple o enlace por email,
  verificación de email y límite de intentos. Nunca un sistema de contraseñas propio.
- [ ] **Permisos por usuario en la base de datos** (ver `supabase/schema.sql`): cada usuario solo lee perfiles públicos,
  edita el suyo y lee los chats en los que participa.
- [ ] **Ubicación en el servidor**: guardar coordenadas solo en el servidor y devolver a la app únicamente el rango
  de distancia. Nunca enviar coordenadas de otros usuarios, aunque la app no las muestre.
- [ ] **Repetir en el servidor** la moderación del chat, los límites de velocidad, la validación de textos y los bloqueos.
  Para el chat, usar además un modelo de moderación (el filtro de palabras se puede esquivar).
- [ ] **Fotos en el servidor**: volver a quitar EXIF, moderar imágenes, enlaces no adivinables y tamaño máximo.
- [ ] **Edad**: verificación real con un proveedor externo para el chat 1 contra 1 (la casilla "tengo 18" no basta).
- [ ] **Límites de uso** por cuenta e IP (likes, mensajes, denuncias, registros), más estrictos en cuentas nuevas.
- [ ] **Secretos solo en el servidor**: ninguna clave privada en el código de la app (todo lo que va en la app es público).
- [ ] **Panel de moderación** con verificación en dos pasos y registro de quién consulta cada denuncia.

### Pendiente antes del lanzamiento público

- [ ] Auditoría de seguridad (pentest) por profesionales.
- [ ] Copias de seguridad automáticas y prueba de restauración.
- [ ] Alertas: picos de inicios de sesión fallidos, denuncias masivas, errores del servidor.
- [ ] Dependabot (o similar) activado y `npm audit` en cada despliegue.
- [ ] RGPD: política de privacidad, datos mínimos, borrado de cuenta desde la app, registro de tratamientos y
  procedimiento para notificar una brecha a la AEPD en 72 horas.
- [ ] Correo de contacto de seguridad publicado en `/.well-known/security.txt`.

## Cómo comprobar las cabeceras en local

```bash
npm run build
npm run preview
```

Abre la URL que muestra la consola. Si algo deja de cargar, la consola del navegador mostrará
"Refused to load…" con el dominio bloqueado: añádelo a la lista correspondiente de `security-headers.js`.
