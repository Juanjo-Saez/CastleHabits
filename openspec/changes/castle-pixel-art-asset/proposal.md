# Cambio: sustituir el Castillo por el asset pixel-art autorizado

## Resumen

El Castillo actual basado en SVG no alcanza la calidad visual buscada. Este
cambio sustituye el asset recortado anterior por la composición completa
pixel-art autorizada más recientemente por el usuario:

- Referencia de la escena:
  [`art/references/castle-scene-reference.png`](../../../art/references/castle-scene-reference.png)

La referencia incluye cielo, nubes, montañas, Castillo y suelo. La composición
completa se usa como fondo; la luna de la aplicación continúa independiente y
se superpone para conservar sus estados y movimiento. Los efectos dinámicos del
clima y de los bosses siguen siendo capas de la app.

La segunda imagen se guarda únicamente como referencia para una futura pantalla
de carga:

- Referencia de loading:
  [`art/references/loading-reference.png`](../../../art/references/loading-reference.png)

La pantalla de carga queda fuera del alcance de este cambio.

Las referencias viven fuera de `public/` porque Workbox precachea todos los PNG
publicados: dentro de `public/` se descargarían (~570 KB) en cada instalación
de la PWA aunque la app no las use.

## Decisiones confirmadas

- **Composición**: usar la imagen completa como fondo; no extraer ni enmascarar
  el Castillo, el cielo, las nubes o las montañas.
- **Luna**: sigue siendo independiente, se superpone a la imagen y conserva los
  estados normal, sangre y eclipse.
- **Clima y bosses**: se mantienen las capas dinámicas de lluvia, niebla,
  nubes, eclipse y tormenta/relámpagos sobre la composición estática.
- **Responsive**: cubrir el contenedor sin deformar la imagen y favorecer el
  torreón con el foco horizontal al 55 %; en móvil se permite recortar los
  extremos de la composición.

Este cambio sustituye la silueta SVG creada en `castle-visual-redesign`; los
climas diarios de ese cambio se conservan sin modificaciones.

## Motivación

La escena generada con geometría SVG resulta demasiado abstracta y oscura en
comparación con la dirección pixel-art deseada. El asset autorizado ofrece una
silueta, una escala de detalle y una composición de fortaleza más adecuadas
para el tono gótico de la aplicación.

El objetivo no es convertir toda la imagen en un fondo rígido. El castillo debe
ser una capa visual reutilizable, mientras que la luna, el clima y los efectos
de bosses deben seguir siendo capas independientes.

## Dirección visual

La composición completa —incluyendo su cielo, nubes, montañas, Castillo y
suelo— constituye el fondo estático. La nueva referencia no incluye luna; la
luna renderizada por la aplicación se mantiene como capa independiente para
conservar su movimiento responsive, los estados de luna de sangre y eclipse, y
la alineación con el boss en `BossSky`.

## Tratamiento del asset

La referencia nueva se conserva sin modificar. El asset WebP lossless es una
conversión píxel a píxel de la imagen completa, sin máscaras ni recortes previos.

| Dato | Valor |
|---|---|
| Dimensiones | `1367×768`, igual que la referencia |
| Formato | WebP lossless |
| Enfoque horizontal | `55%` |
| Asset runtime | `src/assets/castle-scene.webp` |
| Referencia original | `art/references/castle-scene-reference.png` |

## Arquitectura de capas

La escena final tendrá esta prioridad visual:

1. color/gradiente base y la composición completa como fondo;
2. nubes dinámicas y efectos de clima;
3. luna independiente superpuesta al fondo;
4. tormenta, relámpagos y sprites del boss;
5. contenido de la interfaz por encima de toda la escena.

El asset no debe capturar clics, teclado ni scroll. La luna y el boss conservarán
sus anclas compartidas entre `Backdrop` y `BossSky`.

## Responsive

- Mantener la relación de aspecto original mediante `object-fit: cover`.
- Usar `image-rendering: pixelated` para preservar el aspecto pixel-art.
- En móvil priorizar el torreón central con `object-position: 55% center`;
  el recorte de los laterales es intencionado.
- En escritorio mostrar la mayor parte posible de la composición completa.
- No escalar ni deformar la luna para ajustarla al tamaño del castillo.
- Validar como mínimo `390×844`, `768×1024`, `1024×768` y `1440×900`.

## Clima y bosses

El cambio solo altera la presentación:

- el clima diario seguirá siendo determinista y no afectará al gameplay;
- la luna roja seguirá apareciendo cuando haya un boss activo;
- los relámpagos del boss permanecerán activos durante todo el encuentro;
- la tormenta, la lluvia, la niebla y el eclipse no deben ocultar por completo
  la puerta ni el boss;
- ninguna recompensa, daño, progreso o persistencia de encuentros cambiará.

## Accesibilidad

- La imagen del castillo será decorativa y tendrá `aria-hidden`.
- El estado textual del clima seguirá siendo accesible.
- `prefers-reduced-motion` debe mantener el castillo visible y detener los
  desplazamientos, flashes y animaciones no esenciales.
- Los botones de boss y retorno seguirán siendo accesibles por teclado.

## Fuera de este cambio

- Implementar la pantalla de carga.
- Animar la pantalla de carga de la segunda referencia.
- Añadir audio o música.
- Cambiar la lógica de bosses, tareas, progresión, vida, EXP u oro.
- Crear una nueva luna incrustada dentro del asset del castillo.

## Criterios de aceptación

1. La escena usa como fondo la composición pixel-art completa autorizada.
2. La luna de la aplicación continúa siendo una capa independiente y móvil
   superpuesta a la composición.
3. La luna de sangre, el eclipse y la alineación del boss siguen funcionando.
4. El asset lossless conserva la imagen de referencia sin cambios de píxeles.
5. La puerta, la fortaleza y el boss siguen siendo legibles en los viewports
   objetivo.
6. La escena no captura eventos ni rompe la navegación vertical.
7. Los seis climas diarios siguen funcionando sobre la nueva escena.
8. `prefers-reduced-motion` mantiene la composición y elimina animaciones.
9. La segunda referencia queda guardada, documentada y sin uso en runtime.
