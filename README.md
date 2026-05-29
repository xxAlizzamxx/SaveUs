# AuraGuard

Prototipo funcional de app de seguridad personal para web.

## Funcionalidades reales

| Módulo | Qué hace |
|--------|----------|
| **GPS** | Ubicación en tiempo real con `navigator.geolocation` + geocodificación inversa (OpenStreetMap) |
| **Grabación** | Cámara y micrófono reales con `getUserMedia` + `MediaRecorder` |
| **Evidencia** | Archivos guardados en IndexedDB — reproducir, descargar y eliminar |
| **Alertas SOS** | Notificaciones del navegador + WhatsApp/SMS con enlace de Google Maps |
| **Camino seguro** | Mapa OpenStreetMap (Leaflet) con ruta GPS trazada en vivo |
| **Detección IA** | Análisis de nivel de audio en tiempo real; alerta automática si supera umbral |
| **Contactos** | CRUD persistente en IndexedDB |

## Permisos necesarios

Al abrir la app, el navegador pedirá:

- **Ubicación** — para mapa, alertas y camino seguro
- **Cámara y micrófono** — para grabación de evidencia
- **Notificaciones** — para alertas SOS

## Ejecutar

```bash
npm install
npm run dev
```

Abre http://localhost:5173 — funciona mejor en **Chrome/Edge** y en **HTTPS o localhost**.

## Flujo de prueba

1. Permite ubicación, cámara, micrófono y notificaciones.
2. **Inicio** → activa Modo seguro (inicia GPS + grabación).
3. **Grabación** → verifica la vista previa de cámara en vivo.
4. **Camino seguro** → Iniciar rastreo y camina unos metros; la ruta se dibuja en el mapa.
5. **Detección IA** → Iniciar monitoreo; haz ruido fuerte cerca del micrófono para activar alerta.
6. **Evidencia** → configura PIN, reproduce y descarga tus grabaciones.
7. **SOS** → abre WhatsApp/SMS con tu ubicación real a los contactos.

## Stack

React 19 · TypeScript · Vite · Leaflet · Framer Motion · IndexedDB
