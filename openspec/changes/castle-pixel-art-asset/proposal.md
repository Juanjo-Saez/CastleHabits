# Cambio: sustituir el Castillo por el asset pixel-art autorizado

## Resumen

El Castillo actual basado en SVG no alcanza la calidad visual buscada. Este
cambio sustituirá esa silueta por una interpretación basada en el asset
pixel-art autorizado por el usuario:

- Referencia del Castillo:
  [`art/references/castle-reference.png`](../../../art/references/castle-reference.png)

La imagen de referencia contiene cielo, luna, castillo y suelo en una única
composición. La implementación debe separar la fortaleza de los elementos
atmosféricos para que la luna siga siendo un ente independiente y pueda
moverse, cambiar a luna de sangre durante los bosses y mostrar el eclipse sin
editar el castillo.

La segunda imagen se guarda únicamente como referencia para una futura pantalla
de carga:

- Referencia de loading:
  [`art/references/loading-reference.png`](../../../art/references/loading-reference.png)

La pantalla de carga queda fuera del alcance de este cambio.

Las referencias viven fuera de `public/` porque Workbox precachea todos los PNG
publicados: dentro de `public/` se descargarían (~570 KB) en cada instalación
de la PWA aunque la app no las use.

## Decisiones confirmadas

- **Cielo**: se recortan solo el castillo y el suelo. El cielo naranja, las
  nubes y las montañas de la referencia se descartan; el cielo, el clima y los
  bosses siguen siendo los de la app.
- **Luna**: mantiene su posición actual (arriba a la derecha de la columna de
  la app), su tamaño de `112×112 px` y sus estados normal, sangre y eclipse.
- **Móvil**: el castillo conserva su altura y recorta los laterales centrándose
  en la torre central; no se reduce para mostrar la imagen completa.

Este cambio sustituye la silueta SVG creada en `castle-visual-redesign`; los
climas diarios de ese change se conservan sin modificaciones.

## Motivación

La escena generada con geometría SVG resulta demasiado abstracta y oscura en
comparación con la dirección pixel-art deseada. El asset autorizado ofrece una
silueta, una escala de detalle y una composición de fortaleza más adecuadas
para el tono gótico de la aplicación.

El objetivo no es convertir toda la imagen en un fondo rígido. El castillo debe
ser una capa visual reutilizable, mientras que la luna, el clima y los efectos
de bosses deben seguir siendo capas independientes.

## Dirección visual

La composición debe conservar la lectura principal de la referencia:

- fortaleza central alta y estrecha;
- torres, agujas y tejados irregulares;
- suelo oscuro en primer plano;
- contraste fuerte entre la fortaleza y el cielo;
- estética pixel-art sin suavizado borroso.

La luna de la referencia se considera una guía de posición, no parte del asset
final del castillo. La luna renderizada por la aplicación continuará usando el
componente/capa existente para conservar:

- movimiento o reposicionamiento responsive;
- luna normal, luna de sangre y eclipse;
- profundidad detrás del castillo;
- alineación con el boss en `BossSky`.

## Tratamiento del asset

La primera imagen se conservará sin modificar como referencia original. Para la
escena se preparará una capa derivada del castillo:

1. retirar o enmascarar el cielo y la luna incrustados;
2. conservar la fortaleza, la muralla, el suelo y los detalles pixel-art;
3. exportar una imagen con transparencia o una máscara equivalente;
4. preservar la resolución y la paleta pixel-art;
5. evitar filtros de interpolación que suavicen los píxeles.

Si la extracción automática deja halos alrededor de las torres, se permitirá
una limpieza manual limitada de bordes y colores, sin redibujar el diseño.

### Asset derivado

`scripts/extract-castle.py` regenera `src/assets/castle.png` desde la referencia
de forma reproducible (`pip install pillow numpy`):

- clasifica como cielo las nubes cálidas, la luna (disco explícito, sin tocar
  la aguja y la torreta azules que pasan por delante), el degradado morado
  plano y los jirones de nube magenta;
- conserva solo la piedra conectada al suelo y rellena huecos de ruido JPEG,
  respetando las aberturas reales por las que se veía el cielo;
- sustituye el tinte naranja que sangra en los bordes por el color de la piedra
  vecina;
- cuantiza a una paleta indexada de 160 colores más un índice transparente, lo
  que limpia el ruido JPEG y deja el asset en ~50 KB.

| Dato | Valor |
|---|---|
| Dimensiones | `738×414`, igual que la referencia |
| Formato | PNG indexado, transparencia binaria |
| Horizonte (inicio del suelo) | fila `341` |
| Eje de la torre central | columna `408` (55,28 %) |
| Zona opaca sobre el horizonte | columnas `270–548` |

Estos valores viven en `src/lib/castleArt.ts` y llegan al CSS como variables
(`--castle-focus`, `--castle-ground`), sin duplicarse en la hoja de estilos.

## Arquitectura de capas

La escena final tendrá esta prioridad visual:

1. gradiente y cielo base;
2. estrellas y nubes;
3. luna independiente;
4. capa del castillo pixel-art;
5. clima delante del castillo cuando corresponda;
6. tormenta y efectos persistentes del boss;
7. contenido de la interfaz por encima de toda la escena.

El asset no debe capturar clics, teclado ni scroll. La luna y el boss conservarán
sus anclas compartidas entre `Backdrop` y `BossSky`.

## Responsive

- Mantener la relación de aspecto original del asset.
- Usar `image-rendering: pixelated` o equivalente.
- En móvil priorizar la torre central, la puerta y la parte superior de la
  fortaleza.
- En escritorio mostrar más anchura del suelo y de las estructuras laterales.
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

1. La escena usa el asset pixel-art autorizado como base visual del Castillo.
2. El castillo se muestra sin la luna incrustada de la referencia.
3. La luna de la aplicación continúa siendo una capa independiente y móvil.
4. La luna de sangre, el eclipse y la alineación del boss siguen funcionando.
5. La imagen conserva sus píxeles sin blur ni interpolación visible.
6. La puerta, la fortaleza y el boss siguen siendo legibles en los viewports
   objetivo.
7. La escena no captura eventos ni rompe la navegación vertical.
8. Los seis climas diarios siguen funcionando sobre la nueva escena.
9. `prefers-reduced-motion` mantiene la composición y elimina animaciones.
10. La segunda referencia queda guardada, documentada y sin uso en runtime.
