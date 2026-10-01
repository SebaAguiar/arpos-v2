---
format: 1920x1080
duration: 45s
message: "Arcom no se detiene: cobra, factura y sincroniza aunque se caiga Internet."
arc: PAS → value-first (hook → promise → demo loop offline-first → value → CTA)
audience: dueños/as de comercios minoristas evaluando un POS local-first
music: warm confident tech underscore — subtle, low tempo, no lead synth (offline BGM local)
---

## Video direction

- **palette (frame.md)** — fondo arena #F6F1EA / paper #FDFCFA; jerarquía tinta #1F1A17; secundario piedra #6E635C; acento terracota #C75B39 **una vez por frame** (éxclusivamente en el spike `✱` del kicker, el estado CAE, el CTA o el underline del lockup — nunca decorativo); alerta #E2504B SOLO en Frame 5 (semántica: caída de señal). Canvas tinta #181515 únicamente en el Frame 9 (endcard).
- **motion grammar + reveal model** — eases long-tail (`power3` default, smooth sobre bouncy); **sin VO**: los cues temporales son los beats de texto/estado on-screen — cada elemento entra cuando su línea/estado aparece, nunca todo a t=0; el back ~50% del frame sigue recibiendo contenido. Holds: stillness preferida sobre mal motion (a lo sumo jitter sutil; sin breathing lazy, sin drift forzado). Un solo acento coral por frame.
- **rhythm / held-frame allocation** — F1 flash tenso (golpe solo) · F2 construye y suelta · F3–F7 demo loop con surface constante y un solo elemento vivo por frame (badge, chip de estado, contador) · F5 y F6 son deliberadamente casi-estáticos (la pieza móvil única es el badge) · F9 hold largo final. Los reveals se reparten sobre el beat, no front-load.
- **negative list** — nada de glassmorphism, gradientes "AI" (púrpura/azul), scrollbars, cursores reales, chrome de navegador ni texturas ajenas al pack; ambos failure modes prohibidos: slideshow (front-load y congelar) y screensaver (todo flotando independiente).
- **caption-band** — contenido planificado en el top ~83%; el band inferior (~17%) queda limpio incluso sin captions (consistencia de borde inferior).
- **type** — tokens de `frame.md` por rol (display / body / mono); nunca raw family ni px. Fuentes locales Inter + JetBrains Mono.

---

## Frame 1 — Se corta internet

- scene: Kinetic type sobre canvas arena — la frase golpea sola, luego se resuelve en la promesa
- voiceover: "Se corta internet."
- duration: 3s
- transition_in: cut
- poster: 2s
- status: built
- src: compositions/frames/01-hook.html
- type: hook
- persuasion: Pain validation
- beat: tension
- blueprint: kinetic-type-beats
- asset_candidates: assets/brand/grid-construction.svg — texture de marca sobre el canvas arena
- focal: (typography — la línea es el hero; textura como background)
- roles: grid-construction = background (dim ~40%)
- sfx: impact-bass-2

Reproduce: hook flash posture — una línea sola golpea el frame en un slam directo (sin build, sin token-swap).
Scene 1 (0.0–0.4s): canvas arena asienta; la textura grid-construction llena el fondo (dim ~40%); kicker `✱ ARCOM` mono pop en el top-left (→ `spring-pop-entrance`). Centered, texture full-bleed, 3 depth layers (texture + type).
Scene 2 (0.4–1.4s): "Se corta internet." golpea dead-center — un solo slam, sin fade ni roll (→ `kinetic-beat-slam`), display 800 tinta, la línea ocupa el top ~70% sola. El spike `✱` coral del kicker es el único acento del frame.
Scene 3 (1.4–3.0s): HOLD de tensión — la línea lee en silencio contra la textura; a lo sumo jitter sutil en la texture (→ `sine-wave-loop`, low-amplitude). El silencio sostiene el miedo hasta el cut a F2. Centered, línea ≥ 40% del canvas.

narrativeRole: Abre con el miedo en lenguaje de resultado (se apaga el negocio), sin nombrar producto ni features.
keyMessage: la interrupción de servicio es el enemigo — el resto del video lo vence.

## Frame 2 — La promesa

- scene: La frase del hero se construye palabra a palabra; el mark de Arcom aparece en el último beat
- voiceover: "Tu negocio no se detiene. Tu sistema tampoco."
- duration: 4s
- transition_in: crossfade
- poster: 2.5s
- status: built
- src: compositions/frames/02-promise.html
- type: product_intro
- persuasion: Future pacing
- beat: relief + control
- blueprint: kinetic-type-beats
- asset_candidates: assets/brand/mark.svg — mark Arcom color, ensamblaje en el beat final
- focal: mark.svg (supporting — aparece en el beat final sobre la tipografía)
- roles: mark = supporting (cutout pequeño, final beat)
- sfx: chime

Adapt: keep the statement-build signature; sin token-swap — las dos oraciones del hero construyen en secuencia y el bark de Arcom aterriza al final como payoff del beat.
Scene 1 (0.0–0.5s): canvas arena asienta; kicker `✱ Tu sistema` mono pop (→ `spring-pop-entrance`). Centered, type-only, 2–3 depth layers.
Scene 2 (0.5–2.2s): "Tu negocio no se detiene." se construye palabra a palabra (→ `dynamic-content-sequencing`), display tinta, centered. Sin front-load: cada palabra entra en su beat.
Scene 3 (2.2–3.4s): "Tu sistema tampoco." entra como segunda firma bajo la primera, y sobre ella la mark.svg pop-in ensambla (→ `spring-pop-entrance`) — coral aparece aquí, el único acento del frame; chime al aterrizar. Stack editorial centered, jerarquía tamaño tinta + mark.
Scene 4 (3.4–4.0s): HOLD — ambas líneas + mark leen; sin breathing, a lo sumo jitter sutil (→ `sine-wave-loop`). Hasta el crossfade a F3.

narrativeRole: El valor aterriza en el beat 2 (regla del reverse iceberg): la promesa del sistema que acompaña al negocio.
keyMessage: Arcom sigue de pie cuando el resto se detiene.

## Frame 3 — Cobro en vivo

- scene: Ventana del POS real (captura light) como hero; recorrido carrito → pago con movimiento medido sobre la placa
- voiceover: "Un cobro en segundos — sin esperar a la nube."
- duration: 6.5s
- transition_in: zoom-through
- poster: 3s
- status: built
- src: compositions/frames/03-sale.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: ease + control
- blueprint: device-surface-showcase
- asset_candidates: assets/screens/pos-light.png — POS real, catálogo + carrito (vista principal)
- focal: pos-light.png (cutout — la surface hero del beat)
- roles: pos-light = cutout (surface hero, ~60% del frame)
- sfx: click-soft, chime

Reproduce: static-tour signature — la surface hero sostiene todo el beat; el recorrido carrito → pago ocurre DENTRO de la misma placa (sin swap de surface), con highlights medidos.
Scene 1 (0.0–1.2s): el surface pos-light.png asienta como hero — coastea a su posición y settlea en power3 (→ `spring-pop-entrance`, long-tail) sobre canvas arena; kicker `✱ Cobro en vivo` top-left (→ `spring-pop-entrance`). Surface-left editorial (layout del sketch): surface grande izquierda (left 4.2cqw, top 16cqh, w 72cqw, h 72cqh), kicker arriba, columna chrome editorial derecha (left 80cqw, w 16cqw). 3 depth layers (canvas + surface + chrome/kicker).
Scene 2 (1.2–3.2s): el recorrido carrito → pago ocurre DENTRO del surface: un producto se agrega al carrito (mini highlight sobre la placa, click-soft), el total del carrito hace count-up y settlea (→ `counting-dynamic-scale`, value-scaled counter). La línea "Un cobro en segundos" se revela en el chrome, palabra por palabra (→ `dynamic-content-sequencing`).
Scene 3 (3.2–5.2s): el recorrido carrito → pago avanza DENTRO del mismo screenshot pos-light.png (sin swap de surface — el drawer de pago/medios se destaca con highlight sobre la placa real, nunca se cambia a otro screenshot); el total settlea final, chime al confirmar. La frase "sin esperar a la nube" entra bajo el headline (→ `dynamic-content-sequencing`), mono piedra.
Scene 4 (5.2–6.5s): HOLD — surface + chrome leen firmes; sin drift, jitter mínimo (→ `sine-wave-loop`). Cede al crossfade con todo quieto.

narrativeRole: Primera prueba visual: el producto funciona, y es la UI real del POS (theme claro Ruta C).
keyMessage: velocidad de cobro local, sin depender de la conexión.

## Frame 4 — Factura ARCA

- scene: El cobro se convierte en comprobante fiscal: ticket mock diseñado (FACTURA B, punto de venta + número, CAE, QR, total). La pieza animada: el estado del comprobante pasa de "emitiendo" a "CAE emitido" (status theater)
- voiceover: "Cada venta, su comprobante. CAE en tiempo real."
- duration: 6s
- transition_in: crossfade
- poster: 4s
- status: built
- src: compositions/frames/04-arca.html
- type: feature_showcase
- persuasion: Authority by association (fiscal compliance)
- beat: confidence + legitimacy
- blueprint: agent-progress-theater
- asset_candidates: (comprobante fiscal mock diseñado en la composición con campos ARCA reales — CAE, QR, punto de venta, CUIT; no existe screenshot, no inventar asset)
- focal: (mock del ticket diseñado en composición — sin asset de captura)
- roles: mock-ticket = cutout (construido en composición; no hay screenshot real de CAE en repos)
- sfx: riser, chime

Override rationale: el storyboard decía device-surface-showcase, pero la escena es exactamente el blueprint agent-progress-theater — un trigger corto ("emitir") le da el frame a la máquina, que trabaja visiblemente (spinner + status swap), y el receipt llega como card cuyas filas cascadan y CAMBIAN DE ESTADO (pendiente → CAE emitido). No es una surface que muestra un flujo; es trabajo fiscal performed in front of the viewer.
Adapt: sin prompt typed — el trigger es el click del botón "Emitir"; la máquina hace: loader + status couplet → ticket cascade → badge flip. Los campos fiscales (CUIT, punto de venta, n.º, CAE, QR, importe+IVA) se marcan como filas del recibo.
Scene 1 (0.0–1.0s): kicker `✱ Facturación ARCA` mono top-left; sobre canvas arena, el botón "Emitir comprobante" (pill) se presiona con un click (→ `press-release-spring`, un solo igniting click; el cursor NO se queda — la UI se performa sola). Centered, ~40% del frame, 3 depth layers.
Scene 2 (1.0–2.8s): WORKING STATE — loader lockup centered: spinner coral + label "Solicitando CAE…" con status couplet que swapea ("Conectando…" → "Solicitando CAE…" → "Emitiendo…") (→ `discrete-text-sequence`, in-place token cycle); dots pulse bajo el spinner. El riser sfx corre bajo este beat.
Scene 3 (2.8–4.6s): el ticket FACTURA B asciende como card: filas que pop-in secuencial (CUIT, punto de venta + n.º, CAE 8 dígitos, QR, importe + IVA) — cada fila llega en su beat, no todo junto (→ `dynamic-content-sequencing`, stagger de filas). El QR se dibuja a sí mismo (→ `svg-path-draw`).
Scene 4 (4.6–6.0s): STATE MUTATION — el badge del estado flipea de "emitiendo" (outline) a "CAE emitido" (solid coral + check draw) (→ `svg-path-draw` check + `spring-pop-entrance`); chime al caer el CAE; HOLD final con jitter mínimo. Cede al crossfade con el comprobante legible.

narrativeRole: El pedido clave del usuario: la facturación electrónica ARCA como parte fundamental del flujo. Muestra que cada venta genera su respaldo fiscal legítimo con CAE en tiempo real — el valor de cumplimiento que un POS barato no da.
keyMessage: vender en Arcom es facturar: comprobante con CAE automático en cada cobro.

## Frame 5 — Se cae la señal

- scene: Misma superficie; el indicador/bandera offline aparece ANIMADO sobre la placa (única pieza en movimiento de este frame). Micro-estado del comprobante: pasa a "cola de reintento"
- voiceover: "Cae la señal. La caja sigue. El comprobante espera — ARCA reintenta."
- duration: 6s
- transition_in: crossfade
- poster: 5s
- status: built
- src: compositions/frames/05-offline.html
- type: feature_showcase
- persuasion: Friction reduction
- beat: tension → control
- blueprint: device-surface-showcase
- asset_candidates: assets/screens/pos-offline-light.png — POS real con indicador offline; assets/brand/mark-mono-ink.svg — microestado del badge
- focal: pos-offline-light.png (cutout — surface hero, misma posición que F3)
- roles: pos-offline-light = cutout (surface hero, ~60%); mark-mono-ink = supporting (badge de estado sobre la placa)
- sfx: glitch-3, error

Adapt: keep the surface-hero signature; en vez de screens cycling, la surface se queda quieta y UN solo elemento vivo la atraviesa — el badge/bandera offline animado aparece sobre la placa (el micro-estado de la cola pasa a "cola de reintento").
Scene 1 (0.0–1.0s): la surface pos-offline-light.png asienta en la misma posición que F3 (continuidad espacial deliberada); canvas arena; kicker `✱ Se cae la señal` mono top-left (→ `spring-pop-entrance`). Surface-left editorial (layout del sketch: surface izquierda w 72cqw, kicker arriba, columna chrome derecha).
Scene 2 (1.0–2.4s): el badge/bandera offline aparece ANIMADO sobre la surface — flash-in con glitch sutil (→ `discrete-text-sequence` hard-cut + `glitch-3`), el mark-mono-ink + "MODO OFFLINE" como chip coral de alerta (alerta #E2504B SOLO aquí, semántico); el error sfx da el toque negativo breve. El resto de la surface NO se mueve (tensión sostenida).
Scene 3 (2.4–4.6s): micro-estado del comprobante: un chip secundario sobre la placa muestra "comprobante → cola de reintento" (→ `discrete-text-sequence`, in-place token swap de "enviado" → "en cola"); la línea "La caja sigue." revela palabra por palabra (→ `dynamic-content-sequencing`). El contraste del badge vivo contra la surface congelada ES el mensaje.
Scene 4 (4.6–6.0s): HOLD de control — la surface sigue firme, el badge lee; jitter mínimo (→ `sine-wave-loop`). Cede al crossfade con la tensión ya resuelta.

handoff_in: surface `.screen` (POS) entra en left 4.2cqw · top 16cqh · w 72cqw · h 72cqh · scale 1 · opacity 1 · motion static (settled: el surface NUNCA se mueve en este frame — solo el badge y el chrome animan). Mismo rect que F3.
handoff_out: surface `.screen` (POS) sale en el MISMO rect (left 4.2cqw · top 16cqh · w 72cqw · h 72cqh · scale 1 · opacity 1 · static). Cruza a F6, donde solo cambia el contenido (pos-offline → pos-sync).

narrativeRole: El corazón del ángulo "no se detiene": la caída de red no interrumpe la venta ni el respaldo fiscal (cola de reintento ARCA con backoff, voucher local primero).
keyMessage: vender y reservar su factura sin conexión — alerta #E2504B solo aquí (semántico, nunca decorativo).

## Frame 6 — Vuelve internet

- scene: La superficie del POS con el estado de sync; badge de sincronización animado resolviendo a "al día". Los comprobantes en cola cierran su CAE
- voiceover: "Vuelve internet — ventas y facturas sincronizan solas."
- duration: 5.5s
- transition_in: crossfade
- poster: 6.5s
- status: built
- src: compositions/frames/06-sync.html
- type: feature_showcase
- persuasion: Risk reversal
- beat: relief + ease
- blueprint: device-surface-showcase
- asset_candidates: assets/screens/pos-sync-light.png — POS real con sincronización en 2º plano
- focal: pos-sync-light.png (cutout — surface hero, misma posición)
- roles: pos-sync-light = cutout (surface hero, ~60%)
- sfx: chime

Adapt: keep the surface-hero signature; el badge de sincronización gira/resuelve como única pieza viva sobre la surface quieta, y los comprobantes en cola cierran su CAE uno a uno como chips que se checkean sobre la placa.
Scene 1 (0.0–1.2s): surface pos-sync-light.png asienta en la misma posición del sketch (continuidad con F3/F5: left 4.2cqw, top 16cqh, w 72cqw, h 72cqh); kicker `✱ Vuelve internet` mono top-left (→ `spring-pop-entrance`). Surface-left editorial, columna chrome derecha.

handoff_in: surface `.screen` (POS) entra en left 4.2cqw · top 16cqh · w 72cqw · h 72cqh · scale 1 · opacity 1 · motion static (settled: el surface no se mueve en este frame — solo badge y chrome animan). Mismo rect que F5 (par F5→F6: handoff_out de F5 = este handoff_in).
Scene 2 (1.2–3.0s): el badge sync se anima — spinner/loader sobre el indicador de la placa que reza "Sincronizando…" con puntos que pulsan (→ `svg-icon-enrichment`, spinner-live + `discrete-text-sequence` para el label); la surface queda quieta. La línea "ventas y facturas sincronizan solas" revela palabra a palabra (→ `dynamic-content-sequencing`).
Scene 3 (3.0–4.6s): micro-payoff de la cola fiscal: chips "en cola" sobre la placa flipean uno a uno a "CAE emitido" con check draw (→ `svg-path-draw` check + `spring-pop-entrance` stagger), cada uno en su beat; el badge del sketch resuelve a estado "al día" en verde status-success `#5DB872` (token de frame.md — estado OK, no decorativo; el coral del frame queda SOLO en el spike `✱` del kicker); chime al resolver. 
Scene 4 (4.6–5.5s): HOLD — superficie + badges leen; jitter mínimo (→ `sine-wave-loop`). Cede al crossfade con todo resuelto.

handoff_out: surface `.screen` (POS) en left 4.2cqw · top 16cqh · w 72cqw · h 72cqh · scale 1 · opacity 1 · motion static (settled al corte: sin drift, sin push — solo jitter microbio). El mismo slot surface cruza a F7 (mismo rect), donde el contenido cambia de POS a dashboard. (El par F5→F6 comparte este mismo handoff.)

narrativeRole: Cierra el loop offline → online: nada quedó pendiente. La tranquilidad de la empresa y la agilidad de la nube.
keyMessage: sincronización automática en 2º plano, sin intervención.

## Frame 7 — Cierre del día

- scene: Dashboard real como hero; métricas se destacan con reglas hairline y un count/settle medido. Contador de comprobantes emitidos como prueba de cierre fiscal
- voiceover: "Cierra el día igual: caja, reportes, inventario y facturas completas."
- duration: 4.5s
- transition_in: crossfade
- poster: 8s
- status: built
- src: compositions/frames/07-dashboard.html
- type: benefit_highlight
- persuasion: Value stacking
- beat: confidence + completeness
- blueprint: device-surface-showcase
- asset_candidates: assets/screens/dashboard-light.png — dashboard real con métricas de caja
- focal: dashboard-light.png (cutout — surface hero)
- roles: dashboard-light = cutout (surface hero, ~60%)
- sfx: ping, chime

Adapt: keep the surface-hero signature; en vez de screens cycling, la dashboard asienta y su DETALLE se destaca: las reglas hairline dibujan sobre métricas específicas (→ `svg-path-draw`) y el contador de comprobantes emitidos hace count-up y settlea (→ `counting-dynamic-scale`, value-scaled counter) como prueba de cierre fiscal.
Scene 1 (0.0–1.2s): dashboard-light.png asienta como hero (coastea y settlea en power3 long-tail, → `spring-pop-entrance`); kicker `✱ Cierre del día` mono top-left. Surface-left editorial (layout del sketch: surface izquierda w 72cqw, kicker arriba, columna chrome derecha).

handoff_in: surface `.screen` (dashboard) entra en el mismo rect que F5/F6 (left 4.2cqw · top 16cqh · w 72cqw · h 72cqh · scale 1 · opacity 1 · motion static de entrada con un settle breve al asentar).
Scene 2 (1.2–3.0s): las hairline rules se dibujan sobre los cards de métricas (caja, reportes, inventario, comprobantes) (→ `svg-path-draw`, staggers breves); el contador de "comprobantes emitidos" count-up y settlea (→ `counting-dynamic-scale`, value-scaled counter) con un ping al settle. La línea "Caja · reportes · inventario · facturas completas" entra por lista vertical (→ `dynamic-content-sequencing`, ~1 item por beat).
Scene 3 (3.0–4.5s): HOLD — dashboard completa con métricas destacadas; chime al terminar el count; jitter mínimo (→ `sine-wave-loop`). Cede al crossfade.

narrativeRole: Prueba de que el modo offline no pierde nada — incluida la trazabilidad fiscal: el cierre es completo.
keyMessage: nada se pierde, todo se registra y se factura.

## Frame 8 — El valor en números

- scene: Montaje grid: tres líneas de valor se ensamblan en cascada sobre arena
- voiceover: "< 5 ms de cobro local · 100 % autónomo en PC · listo en 3 minutos."
- duration: 4s
- transition_in: zoom-through
- poster: 9s
- status: built
- src: compositions/frames/08-value.html
- type: benefit_highlight
- persuasion: Statistical proof + Rule of three
- beat: trust + power
- blueprint: grid-card-assemble
- asset_candidates: (typography only — sin assets de contenido)
- focal: (typography — sin assets de contenido)
- roles: (none — typography only, sobre arena)
- sfx: ping

Adapt: keep the staggered vertical-list signature; en vez de cards, las TRES líneas de valor entran en cascada vertical (force-left stack editorial), cada una con su marker pop + count-up breve y settle — la lista ES la evidencia.
Scene 1 (0.0–0.8s): canvas arena asienta; kicker `✱ En números` mono top-left (→ `spring-pop-entrance`). Centered-left stack, type-only.
Scene 2 (0.8–1.9s): "< 5 ms" — primera línea count-up y settlea en display tinta con marker pop (→ `counting-dynamic-scale` value-scaled counter + `spring-pop-entrance`); el offset mono "de cobro local" se revela al lado (→ `dynamic-content-sequencing`).
Scene 3 (1.9–2.9s): "100 % autónomo" — segunda línea entra en cascade bajo la primera (marker pop + count/settle, → `spring-pop-entrance`); "en tu PC" se revela junto.
Scene 4 (2.9–3.7s): "Listo en 3 minutos" — tercera línea cierra la lista vertical (→ `spring-pop-entrance` stagger, última posición); ping final.
Scene 5 (3.7–4.0s): HOLD — las tres líneas co-residentes leen como stack editorial; jitter mínimo (→ `sine-wave-loop`). Cede al zoom-through hacia el endcard.

narrativeRole: Señala a la evidencia los tres números que la resumen; transición de salida del mundo demo al cierre de marca.
keyMessage: rápido, autónomo, cero configuración.

## Frame 9 — End card

- scene: Canvas tinta; lockup negativo ensambla; CTA + URL en kinetic type
- voiceover: "Empezar ahora — instalación en 3 minutos. arcom.com.ar"
- duration: 5.5s
- transition_in: crossfade
- poster: 13s
- status: built
- src: compositions/frames/09-endcard.html
- type: cta
- persuasion: Risk reversal + Scarcity (time to value)
- beat: motivation + peace of mind
- blueprint: logo-assemble-lockup
- asset_candidates: assets/brand/lockup-horizontal-negative.svg — lockup para canvas tinta; assets/brand/grid-construction.svg — texture
- focal: lockup-horizontal-negative.svg (cutout — hero del endcard)
- roles: lockup-neg = cutout (hero centered); grid-construction = background (dim ~30%, texture sobre tinta)
- sfx: impact-bass-1, chime

Reproduce: Brand_Outro settle-and-reveal — el lockup ensambla en lockstep y queda centered; CTA + URL kinetic bajo el lockup con HOLD final de marca.
Scene 1 (0.0–1.0s): canvas tinta #181515 asienta (el único frame sobre tinta); grid-construction como textura de fondo (dim ~30%); kicker `✱ Arcom` mono top-left (→ `spring-pop-entrance`). Centered, 3 depth layers.
Scene 2 (1.0–2.4s): el lockup negativo ensambla — el wordmark + mark se arman en lockstep (→ `logo-assemble-lockup` signature: elements assemble in place, spring-pop long-tail al settle, impact-bass-1); la marca queda centered. El spike coral del kicker es el único acento hasta el CTA.
Scene 3 (2.4–3.8s): se revela el CTA "Empezar ahora" (button pill, → `press-release-spring` entrance + chime) bajo el lockup — el único acento coral de placa del frame; la línea "Instalación en 3 minutos" se revela como supporting (→ `dynamic-content-sequencing`), mono piedra.
Scene 4 (3.8–5.5s): la URL `arcom.com.ar` se revela en mono bajo el CTA (→ `dynamic-content-sequencing`, per-word o per-glyph según ritmo); HOLD final de marca — todo quieto, jitter mínimo (→ `sine-wave-loop`). Cede al cierre del video.

narrativeRole: Cierre de marca que convierte la confianza en acción inmediata con promise de baja fricción.
keyMessage: empezar es rápido y sin riesgo — el tiempo hasta el valor es de 3 minutos.

---

## Notas de estilo y audio

- Sin VO ni captions: `voiceover` = líneas kinetic on-screen (blueprint kinetic-type para los beats de texto). No hay SCRIPT.md (narration: no).
- Fondo dominante: arena #F6F1EA / paper #FDFCFA; jerarquía tinta #1F1A17; acento terracota #C75B39 UNA vez por frame; alerta #E2504B solo en Frame 5 (semántica). Piedra #6E635C para secundario.
- Transiciones: cut (1) → crossfade (2) → zoom-through (entrar al mundo producto, 3) → crossfade (4–7) → zoom-through (salir del demo, 8) → crossfade (9).
- Frame 4 (factura ARCA): mock del comprobante en la composición — FACTURA B, CUIT, punto de venta + n.º, CAE 8 dígitos, QR, importe + IVA. El CAE aparece como status theater (estado pending → issued). Verificar formato de CAE contra `docs/context/` si está documentado; campos fiscales reales, sin fabricar datos de contribuyente ficticio más allá del demo.
- BGM: mood en frontmatter; resolución offline (motores locales / pista libre). Full-silent NO aplica (usuario eligió BGM sutil).
- Fuentes locales: Inter 400/700 + JetBrains Mono 400/700 en assets/fonts/ (bloque @font-face en frame.md).