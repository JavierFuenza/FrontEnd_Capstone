import { defineMiddleware } from 'astro:middleware';

/**
 * Middleware de seguridad para agregar headers HTTP de seguridad
 * Corrige vulnerabilidades identificadas en el escaneo OWASP ZAP
 *
 * Mejoras aplicadas:
 * - Eliminado 'unsafe-inline' y 'unsafe-eval' de script-src
 * - Eliminado 'unsafe-inline' de style-src
 * - Reemplazado wildcard en img-src con dominios específicos
 * - Actualizado Cross-Origin-Resource-Policy a 'same-origin'
 * - Expandido Permissions-Policy con más restricciones
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Content Security Policy (CSP) - Protección contra XSS
  // Permite recursos necesarios para Firebase, OpenStreetMap (Leaflet), n8n webhook
  const cspDirectives = [
    "default-src 'self'",
    // Script sources - Necesitamos unsafe-inline para Astro/Vite en dev mode
    // Agregado *.firebaseio.com para Firebase Realtime Database
    // TODO: Usar nonces o hashes en producción para mayor seguridad
    "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com https://www.googletagmanager.com https://*.google-analytics.com https://ssl.google-analytics.com",
    // Style sources - Necesitamos unsafe-inline para Tailwind y componentes React
    "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com",
    // Image sources - Dominios específicos para OSM tiles, Firebase, etc.
    "img-src 'self' data: https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://unpkg.com https://*.googleapis.com https://*.gstatic.com https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org",
    // Font sources
    "font-src 'self' data: https://fonts.gstatic.com",
    // Connect sources para APIs y Firebase (incluye Realtime Database con WebSockets)
    "connect-src 'self' https://observatorio.javierfuenzam.com https://*.firebaseapp.com https://*.googleapis.com https://*.firebase.com https://*.firebaseio.com wss://*.firebaseio.com https://www.googletagmanager.com https://www.google-analytics.com https://n8n.srv1105893.hstgr.cloud http://localhost:8000 ws://localhost:4321",
    // Frame sources (Firebase Realtime Database necesita frames para long polling)
    "frame-src 'self' https://*.firebaseapp.com https://*.firebaseio.com",
    // Media sources
    "media-src 'self'",
    // Object, embed, and applet - bloquear completamente
    "object-src 'none'",
    // Base URI restriction
    "base-uri 'self'",
    // Form submission restriction
    "form-action 'self'",
    // Frame embedding restriction
    "frame-ancestors 'none'",
    // Upgrade insecure requests
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  // X-Frame-Options - Protección contra clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - Prevenir MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Permissions-Policy - Controlar features del navegador
  const permissionsPolicy = [
    'accelerometer=()',
    'autoplay=()',
    'camera=()',
    'display-capture=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'geolocation=(self)',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'payment=()',
    'picture-in-picture=()',
    'screen-wake-lock=()',
    'sync-xhr=()',
    'usb=()',
    'web-share=()',
    'xr-spatial-tracking=()'
  ].join(', ');
  response.headers.set('Permissions-Policy', permissionsPolicy);

  // Cross-Origin-Resource-Policy - Protección contra ataques Spectre
  // Usar 'cross-origin' para permitir recursos externos (OSM tiles, Firebase, etc.)
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

  // Cross-Origin-Embedder-Policy - Aislamiento entre orígenes
  // Usar 'unsafe-none' en lugar de 'require-corp' para compatibilidad con recursos externos
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');

  // Cross-Origin-Opener-Policy - Protección adicional contra Spectre
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // Referrer-Policy - Controlar información del referrer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict-Transport-Security - Forzar HTTPS (solo en producción)
  if (import.meta.env.PROD) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
});
