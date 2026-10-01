---
workflow: product-launch-video
flow: automation
storyboard: yes
message: "Arcom no se detiene: cobra, factura y sincroniza aunque se caiga Internet."
destination: landing-embed
aspect: 1920x1080
language: es
audience: Dueños/as de comercio minorista evaluando un POS local-first.
length: 45s
angle: demo-showcase
narration: no
---

## Intent

Redo del video de la landing de Arcom (sección "45 segundos para entender por
qué Arcom no se detiene"). Un único video **1920×1080, ~45s, en bucle/embed**,
que reemplaza a los dos archivos actuales (`arcom-demo.mp4` + `arcom-promo.mp4`,
ambos con la UI vieja indigo pre-Ruta C — **no se reutilizan**). Sin voz en off;
solo BGM sutil (mood: warm/confiable, tech-light). Tono Ruta C: cálido, artesanal,
confiable — arena de fondo, tinta para jerarquía, terracota como acento.

## Assets

- apps/marketing-landing/public/screenshots/pos-light.png — POS real, guarda principal (carrito + catálogo): base de la escena core.
- apps/marketing-landing/public/screenshots/pos-offline-light.png — POS real con indicador offline: prueba del ángulo "no se detiene".
- apps/marketing-landing/public/screenshots/pos-sync-light.png — POS real con indicador de sync: base de la escena de sincronización.
- apps/marketing-landing/public/screenshots/payment-dialog-light.png — diálogo de medios de pago: cierre de cobro.
- apps/marketing-landing/public/screenshots/dashboard-light.png — dashboard con métricas: escena de reporte/cierre.
- apps/marketing-landing/public/screenshots/products-light.png — catálogo de productos: escena de catálogo.
- apps/marketing-landing/public/screenshots/reports-light.png — reportes: soporte de la escena de cierre.
- docs/branding/proposal/assets/route-c/lockup-horizontal.svg — lockup principal (fondo claro).
- docs/branding/proposal/assets/route-c/lockup-horizontal-negative.svg — lockup para cartones oscuros/tinta.
- docs/branding/proposal/assets/route-c/mark.svg + mark-mono-ink.svg + mark-mono-white.svg — marks.
- docs/branding/proposal/assets/route-c/grid-construction.svg — grid de marca para fondos/patrones.
- docs/branding/proposal/assets/route-c/app-icon.svg — icono de app (mock de escritorio/launcher).

## Customizations

- **Pantallas reales como base dentro de frames diseñados** (doctrina show-it-as-is):
  las capturas del POS nuevo (`*​-light.png`) se hostean en escenas de marca Ruta C con
  movimiento (punch/pan/settle y reveals), nunca rebuild del UI completo. Una sola
  pieza por escena se anima por encima de la captura (indicador offline, badge de sync,
  total del ticket) medida sobre la placa.
- **Paleta y lockups reales de Ruta C** (docs/branding/proposal/assets/route-c/): arena
  #F6F1EA / paper #FDFCFA de fondo, tinta #1F1A17 para jerarquía, terracota #C75B39 de
  acento, piedra #6E635C para secundario. Alerta #E2504B solo semántica (offline/stock),
  nunca decorativa.
- **BGM sutil** sin VO (mood warm-tech). Sin captions (sin narración, embed corto).
- **Entregable único:** render 1920×1080 ≈45s que reemplaza `arcom-demo.mp4`; se retira
  `arcom-promo.mp4` del VideoDemoSection y se ajusta si hace falta el poster.

## Notes

- Tipografía del sistema de la landing: **Inter** (400–800). La composición debe usar
  Inter (local o bundled en el proyecto).
- El heading de la sección fija el ángulo: "45 segundos para entender por qué Arcom
  no se detiene" → mensaje = offline-first / local-first / resiliencia.
- Dominios a mostrar (orden sugerido): apertura con promesa → POS cobrando en vivo →
  se cae Internet (sigue vendiendo) → factura fiscal ok → sync al volver → cierre con
  lockup + CTA.
- Los videos actuales (indigo viejo) se eliminan; el poster `pos-light.png` queda como
  está.
- El proyecto es versión del repo (videos/arcom-landing-demo/) para mantenerlo.
  El MP4 final se copia a apps/marketing-landing/public/videos/arcom-demo.mp4.