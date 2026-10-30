# Cambio: entrada cinematográfica de bosses

## Resumen

Cuando un boss pase a estar activo por primera vez, el Castillo debe presentar su
aparición como una escena breve en el cielo: la aplicación llevará al jugador hasta
`BossSky`, atenuará el cielo, mostrará relámpagos y hará aparecer al boss antes de
dejar disponibles sus detalles y objetivos.

La presentación será una capa de interfaz, no una nueva regla del combate. El motor
seguirá resolviendo activaciones, progreso, victorias y derrotas como hasta ahora.
La marca de que una escena ya se ha visto se guardará fuera del perfil y de la base
de datos del juego, igual que los avisos actuales de bosses, para no contaminar
backups ni cambiar el dominio.

## Motivación

Actualmente el boss puede aparecer en `BossSky` y anunciarse mediante un diálogo,
pero la transición no comunica que acaba de llegar al Castillo. El jugador puede
encontrarse directamente con un sprite estático sin contexto visual ni orientación
hacia el cielo.

Este cambio debe:

- hacer reconocible el momento exacto de la aparición;
- llevar al jugador a la zona donde se ve el boss, incluso si estaba consultando
  las tareas;
- conservar el acceso inmediato al objetivo y al diálogo de detalles;
- evitar que una recarga, StrictMode o una nueva renderización repitan la escena;
- seguir siendo usable sin animación, sin depender de audio y con lectores de pantalla.

## Comportamiento

### Cuándo se dispara

- Solo se presenta el encuentro activo actual; un boss `scheduled` o `cooldown` no
  dispara una escena.
- La escena se identifica mediante un token estable del encuentro, basado en su
  identidad y estado activo, siguiendo el patrón de `bossMarker`.
- Un encuentro activo cuya escena ya se haya completado u omitido no vuelve a
  reproducirse al recargar, cambiar de ruta o entrar de nuevo en `/tareas`.
- La presentación se evalúa cuando `ChoresPage` ya tiene cargados los encuentros,
  las tareas y el perfil.
- Si el resumen diario, otro diálogo de boss o una pantalla bloqueante está abierta,
  la escena se pospone hasta que pueda mostrarse sin solaparse.
- Los avisos de resultado de un boss resuelto se mantienen; solo se sustituye el
  aviso introductorio activo que duplicaría la nueva cinemática.

### Secuencia visual

1. La página desplaza suavemente el contenedor principal hasta `BossSky`. Con
   movimiento reducido, el desplazamiento es instantáneo.
2. El cielo entra en modo de aparición: se atenúa el fondo y se muestra una señal
   visual breve de inminencia.
3. Se reproducen varios relámpagos cortos, sin bloquear la interacción durante más
   tiempo del estrictamente necesario.
4. El sprite del boss aparece con una transición de opacidad y escala, centrado en
   la luna.
5. Se muestra el nombre del boss, una frase de amenaza y una indicación de que se
   puede abrir su encuentro.
6. El jugador puede:
   - continuar y dejar la escena en su estado final;
   - omitir la animación y ver inmediatamente el estado final;
   - abrir los detalles del boss desde el sprite o el botón de amenaza.
7. Al terminar o saltar la escena se guarda la marca local y el cielo queda en su
   estado normal, con el boss visible e interactivo.

La escena no debe impedir completar tareas una vez que el estado final sea visible.
No se añadirán sonidos en este change; se podrá estudiar como mejora independiente.

### Cielo durante el encuentro

- Mientras exista un boss activo, la luna del fondo adoptará un tono rojo sangre
  inspirado en el estilo gótico de Castlevania.
- La luna debe conservar una capa superior a `CastleSilhouette`, mantener sus
  dimensiones originales y quedar claramente por encima de la silueta del castillo
  en los viewports habituales.
- Los relámpagos no terminan cuando concluye la entrada: el cielo mantiene una
  tormenta intermitente durante todo el encuentro activo y la desactiva al resolverlo.
- La tormenta se presenta tanto en la escena del cielo como en el fondo global sin
  bloquear controles ni modificar el estado del combate.
- Con movimiento reducido se conserva la luna roja, pero se desactivan los destellos y
  las animaciones de relámpagos.

### Movimiento reducido y accesibilidad

- Con `prefers-reduced-motion: reduce`, no se ejecutan desplazamientos suaves,
  escalados, destellos ni relámpagos animados: se muestra directamente el estado
  final de la aparición.
- La información del boss debe existir como texto accesible, no solo como sprite o
  efecto visual.
- Los controles tendrán nombres accesibles, foco visible y funcionamiento completo
  con teclado.
- Los relámpagos no deben generar destellos rápidos o repetidos que puedan resultar
  problemáticos; se limitarán a pocos cambios de brillo claramente separados.
- El contenedor de la aparición usará una región viva con anuncios breves, sin
  repetir todo el contenido del diálogo para lectores de pantalla.

### Persistencia de la presentación

- Se añadirá un marcador local específico para entradas cinematográficas, separado
  del marcador de avisos de resultado.
- El marcador tendrá un límite de entradas para no crecer indefinidamente.
- Fallos de `localStorage` no deben impedir jugar: la escena podrá repetirse en esa
  sesión, pero no se perderá ni modificará ningún dato del encuentro.
- No se añadirá una migración de Dexie ni un campo de presentación a `BossEncounter`.
  La escena es una preferencia de interfaz y no forma parte del estado de combate ni
  debe viajar en los backups.

## Alcance técnico

- Crear un helper de marcador para entradas cinematográficas, reutilizando la misma
  estrategia defensiva de `src/lib/bossMarker.ts`.
- Añadir un orquestador de presentación en la pantalla de tareas que:
  - detecte el encuentro activo no presentado;
  - coordine el desplazamiento a `BossSky`;
  - espere a que la escena termine o sea omitida;
  - marque el token una sola vez;
  - no compita con `BossAnnouncement` ni con el resumen diario.
- Ampliar `BossSky` o extraer un componente de entrada para representar:
  - estado inicial;
  - relámpagos;
  - aparición del sprite;
  - estado final;
  - controles de omisión y continuación.
- Añadir clases CSS específicas para la escena y los relámpagos, respetando la
  media query global de movimiento reducido.
- Reutilizar `BossSprite`, `BOSSES`, el diálogo existente y el desplazamiento del
  cielo; no duplicar nombres, recompensas ni objetivos.
- Mantener el boss visible y pulsable tras la escena para abrir `BossDialog`.
- Cubrir la lógica idempotente y los estados de accesibilidad con tests y una
  comprobación visual en navegador.

## Criterios de aceptación

1. Un boss activo nuevo lleva automáticamente al usuario al cielo cuando está en
   `/tareas`.
2. La escena muestra atenuación, relámpagos y aparición del boss antes de quedar
   en estado final.
3. El boss y su control de detalles siguen siendo utilizables al terminar la escena.
4. Recargar, cambiar de ruta y volver a tareas no repite una entrada ya vista.
5. Omitir la animación marca la entrada y no altera el encuentro ni el perfil.
6. Un boss programado o un resultado ya resuelto no abre una entrada cinematográfica.
7. El aviso introductorio anterior no aparece además de la cinemática.
8. Con movimiento reducido se ve el mismo contenido final sin animaciones ni
   destellos.
9. Mientras el boss está activo, la luna es roja y los relámpagos siguen visibles de
   forma intermitente hasta la resolución del encuentro.
10. La luna se mantiene por delante del castillo.
11. Si el almacenamiento local falla, la aplicación continúa funcionando y no se
   pierden datos del juego.
12. Tests, TypeScript, build y lint focalizado pasan; la comprobación visual cubre
    móvil, teclado y movimiento reducido.

## Fuera de alcance

- Cambiar la lógica de activación, duración, objetivo, daño o recompensas de bosses.
- Rediseñar por completo `CastleSilhouette` o el Castillo.
- Añadir el Murciélago dorado.
- Añadir audio, música o vibración háptica.
- Crear animaciones únicas para cada boss; todos usarán la misma infraestructura y
  podrán aportar su sprite y texto ya existentes.
- Cambiar la semántica de los avisos de victoria, derrota o revancha salvo para
  evitar el duplicado del aviso introductorio activo.

## Riesgos y decisiones

- **Doble anuncio:** `BossAnnouncement` y la cinemática comparten el mismo encuentro.
  La implementación debe dejar un único punto de entrada para la presentación activa
  y conservar solo el aviso de resultado cuando proceda.
- **Estado inicial de la aplicación:** si ya existe un boss activo al instalar este
  change, se tratará como una entrada pendiente en el primer uso compatible; tras
  completarla quedará marcada como vista.
- **Contenedor de scroll:** el desplazamiento debe usar el scroller real de
  `ChoresPage`, no `window`, porque la aplicación utiliza una columna con scroll
  propio y snap points.
- **Persistencia local:** borrar los datos del navegador puede hacer que una escena
  vuelva a aparecer, pero nunca puede duplicar recompensas, daño ni cambios del
  encuentro.
