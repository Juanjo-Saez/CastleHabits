# Cambio: rediseño visual del Castillo y climas diarios

## Resumen

El Castillo dejará de mostrarse como una silueta abstracta y pasará a tener una
escena gótica original, más definida y reconocible, inspirada en la composición
de la referencia aportada: una fortaleza alta y asimétrica, con torre central,
agujas, murallas, ventanas iluminadas y una luna grande detrás de las torres.

La escena tendrá varios estados atmosféricos que cambiarán una vez por día
operativo y permanecerán estables durante ese día. El clima será una capa de
presentación sin efectos sobre tareas, EXP, vida, bosses ni progresión.

La referencia se utilizará para orientar la composición, el contraste y la
atmósfera. La implementación será una interpretación original con geometría,
colores y recursos propios; no se copiarán literalmente los píxeles, personajes
ni assets de la imagen.

## Motivación

La silueta actual de `CastleSilhouette` comunica una ambientación gótica, pero
sus formas se perciben demasiado uniformes y oscuras. Además, la luna, la
tormenta y el castillo no pertenecen todavía a una escena visual con reglas
claras de profundidad.

El rediseño debe:

- hacer que el castillo sea el foco visual de la pantalla;
- conservar la navegación vertical entre tareas, parada intermedia y cielo;
- proporcionar una composición clara tanto en móvil como en escritorio;
- crear capas reutilizables para luna, cielo, castillo, niebla, lluvia y bosses;
- permitir añadir eventos visuales futuros sin duplicar la estructura;
- mantener la lectura y la interacción de las tareas sin que el fondo las tape.

## Dirección artística

### Composición base

La escena seguirá esta jerarquía visual:

1. cielo y gradiente atmosférico;
2. estrellas, nubes y luna;
3. siluetas lejanas con menor contraste;
4. castillo principal con torre central dominante;
5. murallas, ventanas y detalles de primer plano;
6. niebla o lluvia delante del castillo cuando el clima lo requiera.

El castillo tendrá:

- una torre central más alta y fácilmente identificable;
- torres laterales asimétricas con agujas y tejados diferenciados;
- una muralla principal y una puerta visible;
- ventanas cálidas y escasas para crear puntos de contraste;
- profundidad mediante al menos una capa lejana y una capa principal;
- una base de terreno o niebla que evite que la silueta parezca flotando.

La luna será una pieza atmosférica situada detrás del tejado y de las torres
principales, pero siempre visible por encima de la masa dominante del castillo.
Conservará su tamaño base de `112×112 px`; la escena se adaptará mediante
posición y recorte, no deformando la luna.

### Climas diarios

El catálogo inicial será deliberadamente pequeño y extensible:

- `clear`: cielo despejado, estrellas y luna normal;
- `clouded`: nubes altas que reducen parcialmente las estrellas;
- `fog`: niebla en capas bajas y profundidad reducida;
- `rain`: lluvia diagonal sutil, con reflejos sobre el castillo;
- `storm`: cielo más pesado, flashes ocasionales y lluvia más marcada;
- `eclipse`: estado raro con disco oscurecido y halo tenue.

`eclipse` es una propuesta adicional para dar variedad sin convertir cada día
en una escena de boss. Podrá retirarse del primer incremento si la complejidad
visual resulta excesiva.

Distribución inicial propuesta:

| Clima | Peso |
|---|---:|
| Despejado | 45 % |
| Nublado | 20 % |
| Niebla | 15 % |
| Lluvia | 12 % |
| Tormenta | 6 % |
| Eclipse | 2 % |

Los pesos serán datos configurables, no condiciones repartidas por los
componentes visuales.

### Bosses

Cuando exista un encuentro activo, la escena normal quedará sobrescrita por el
estado visual del boss:

- luna roja;
- tormenta persistente;
- relámpagos del encuentro;
- boss anclado al mismo punto visual que la luna;
- clima diario oculto o atenuado mientras dure el encuentro.

La sobrescritura será únicamente visual. No cambiará la activación, duración,
daño, recompensas ni progreso del boss.

## Determinación del clima

- El clima se elegirá una vez por día operativo, usando el mismo corte de las
  02:00 que el resto de la aplicación.
- La selección será determinista: recargar, navegar o volver al Castillo durante
  el mismo día mostrará el mismo clima.
- Se utilizará una semilla estable por instalación y la fecha operativa; no se
  añadirá un campo al perfil ni se alterará el estado de la expedición.
- Si el almacenamiento local no está disponible, se usará una semilla estable
  de sesión y se registrará el comportamiento sin bloquear la aplicación.
- El clima no concederá recursos, no causará daño y no modificará estadísticas.

## Responsive y navegación

La escena se implementará como una composición con proporción preservada,
centrada y recortada suavemente según el viewport:

- el castillo no se deformará por estirar el SVG o la ilustración;
- la torre central y la luna conservarán sus relaciones geométricas;
- en móvil se priorizarán torre central, luna y puerta;
- en escritorio se mostrará más anchura de las torres laterales y las capas
  lejanas;
- no se cambiarán las paradas de scroll ni el botón de retorno;
- el HUD y las tareas permanecerán en sus capas de interfaz actuales.

## Alcance técnico

- Evolucionar o sustituir `CastleSilhouette` por una geometría más definida,
  preferiblemente SVG/pixel-art generado desde código para conservar escalado y
  control de capas.
- Extraer un modelo de escena/clima reutilizable para que `Backdrop` y
  `BossSky` compartan anclas y proporciones.
- Añadir un selector determinista del clima diario en `src/lib`, separado de
  los stores de gameplay.
- Mantener `Backdrop` como fondo global y evitar que el clima capture eventos o
  bloquee controles.
- Mantener `BossSky` como capa interactiva y conectarlo a las mismas coordenadas
  de luna y castillo.
- Añadir clases CSS o componentes visuales para nubes, niebla, lluvia y
  relámpagos, todos compatibles con `prefers-reduced-motion`.
- No modificar la lógica de tareas, progresión, vida, recompensas ni bosses,
  salvo la lectura del encuentro activo para seleccionar la presentación visual.

## Accesibilidad

- Los efectos atmosféricos serán decorativos y usarán `aria-hidden`.
- Se proporcionará una descripción textual no intrusiva del clima cuando aporte
  contexto, sin crear anuncios repetitivos en cada render.
- `prefers-reduced-motion` conservará el clima y la composición, pero eliminará
  desplazamientos, gotas animadas, flashes y oscilaciones innecesarias.
- El contraste de tareas, botones, diálogos y textos no dependerá del estado del
  cielo.
- El teclado seguirá pudiendo abrir el boss, volver a tareas y utilizar todos los
  controles visibles.

## Criterios de aceptación

1. El castillo se reconoce como una fortaleza gótica definida, con torre central,
   agujas, muralla, puerta y ventanas visibles.
2. La composición recuerda a la referencia en atmósfera y jerarquía sin copiar
   literalmente sus assets o diseño.
3. La luna se mantiene detrás del castillo y claramente visible por encima de
   las torres principales en los viewports objetivo.
4. El mismo día operativo conserva el mismo clima después de recargar o navegar.
5. Existen al menos los estados despejado, nublado, niebla, lluvia, tormenta y
   eclipse, con pesos configurables.
6. El clima no modifica ningún dato de gameplay ni el resultado de tests de
   tareas, progresión o bosses.
7. Un boss activo sobrescribe visualmente el clima normal con luna roja y
   tormenta, manteniendo el boss alineado con la luna.
8. La navegación vertical, la parada intermedia y el retorno a tareas funcionan
   igual que antes.
9. La escena se mantiene legible en móvil y escritorio sin deformar el castillo
   ni encoger accidentalmente la luna.
10. `prefers-reduced-motion` elimina animaciones y flashes sin ocultar el
    contenido ni desactivar los controles.
11. La revisión visual cubre cielo despejado, niebla, lluvia, tormenta, boss
    activo y movimiento reducido.
12. Tests, TypeScript, build y lint focalizado pasan sin regresiones.

## Fuera de alcance

- Implementar el Murciélago dorado.
- Cambiar reglas, recompensas, activación o progreso de bosses.
- Añadir daño, EXP, oro o penalizaciones asociados al clima.
- Rediseñar las pantallas de tareas, calendario, perfil o Crónicas.
- Añadir audio, música o vibración.
- Copiar literalmente la imagen de referencia o incorporar assets sin licencia
  compatible y sin una decisión explícita de atribución.
