# Tareas — asset pixel-art del Castillo

## Referencias y preparación

- [x] 1.1 Confirmar que `art/references/castle-reference.png` es la referencia
      autorizada y conservarla sin modificaciones.
- [x] 1.2 Confirmar que `art/references/loading-reference.png` queda reservada
      para la futura pantalla de carga y no se importa en runtime.
- [x] 1.3 Preparar una versión derivada del Castillo sin cielo ni luna
      incrustada, manteniendo la fortaleza, la muralla, el suelo y los píxeles.
- [x] 1.4 Revisar los bordes de la extracción para eliminar halos sin
      rediseñar la silueta.
- [x] 1.5 Documentar dimensiones, relación de aspecto, punto de apoyo inferior
      y colores de transparencia del asset derivado.
- [x] 1.6 Mover las referencias fuera de `public/` para que Workbox no las
      precachee en la PWA.

## Integración de la escena

- [x] 2.1 Sustituir la geometría SVG actual por el asset pixel-art preparado.
- [x] 2.2 Mantener una capa de castillo decorativa que no intercepte eventos.
- [x] 2.3 Aplicar `image-rendering: pixelated` y evitar interpolación borrosa.
- [x] 2.4 Mantener el castillo dentro del sistema de proporción y recorte de la
      escena sin deformarlo.
- [x] 2.5 Eliminar cualquier luna, halo o cielo duplicado procedente del asset.
- [x] 2.6 Prolongar el suelo a los lados en pantallas más anchas que el asset y
      añadir un contraluz que recorte la silueta contra el cielo nocturno.

## Luna independiente

- [x] 3.1 Mantener la luna actual como elemento separado del castillo.
- [x] 3.2 Ajustar el ancla para que la luna quede visible por encima de las
      torres en móvil y escritorio (se mantiene su posición actual).
- [x] 3.3 Mantener el tamaño base de `112×112 px`.
- [x] 3.4 Verificar luna normal, luna de sangre y eclipse.
- [x] 3.5 Mantener la misma posición relativa entre `Backdrop` y `BossSky`.

## Clima y bosses

- [x] 4.1 Conservar los seis estados de clima diarios sobre el nuevo asset.
- [x] 4.2 Evitar que niebla, lluvia o tormenta oculten completamente la puerta.
- [x] 4.3 Mantener la sobrescritura visual de boss activo.
- [x] 4.4 Verificar luna de sangre, tormenta persistente y relámpagos durante
      todo el encuentro.
- [x] 4.5 Confirmar que el cambio no modifica stores ni datos de gameplay.

## Responsive y accesibilidad

- [x] 5.1 Validar `390×844`.
- [x] 5.2 Validar `768×1024`.
- [x] 5.3 Validar `1024×768`.
- [x] 5.4 Validar `1440×900`.
- [x] 5.5 Validar teclado, foco, botón del boss y retorno a tareas.
- [x] 5.6 Validar `prefers-reduced-motion`.
- [x] 5.7 Confirmar que el texto del clima sigue siendo accesible y no
      depende únicamente de la imagen.

## Tests y cierre

- [x] 6.1 Añadir o actualizar tests de la presencia y configuración del asset.
- [x] 6.2 Mantener los tests de clima, bosses y navegación existentes.
- [x] 6.3 Ejecutar `npm test`.
- [x] 6.4 Ejecutar `npx tsc -b`.
- [x] 6.5 Ejecutar `npm run build`.
- [x] 6.6 Ejecutar ESLint focalizado y `git diff --check`.
- [x] 6.7 Realizar validación visual final y documentar cualquier recorte
      intencionado.

## Fuera de alcance

- [x] 7.1 No implementar todavía la pantalla de carga basada en
      `loading-reference.png`.
- [x] 7.2 No añadir todavía animaciones de entrada de la aplicación.
