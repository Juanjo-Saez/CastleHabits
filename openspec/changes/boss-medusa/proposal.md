# Cambio: Medusa — Estatuas y olvido

## Resumen

Implementar el encuentro de Medusa como el siguiente boss del plantel. Medusa aparece
como respuesta a una racha excepcionalmente larga y convierte las obligaciones de la
ventana en estatuas que deben romperse con completados reales. Si el jugador pierde,
recibe Amnesia: una maldición grave que oculta temporalmente el histórico aunque tenga
el Espejo de plata.

Este change actualiza la propuesta antigua de `boss-roster`, que asignaba Petrificación
a Medusa. La Petrificación seguirá existiendo como maldición grave disponible para otro
boss futuro; Medusa será la fuente de Amnesia.

## Comportamiento

### Activación

- Medusa se activa de forma reactiva cuando al menos una tarea recurrente activa alcanza
  una racha de 14 días cerrados consecutivos.
- Los pergaminos puntuales no generan el disparador.
- El disparador se evalúa al terminar el enfriamiento, como el resto de bosses reactivos.
- La racha que provoca la aparición no se borra al comenzar el encuentro.

### Combate: estatuas

- La ventana dura 5 días operativos.
- Cada mañana se seleccionan entre 1 y 3 obligaciones debidas ese día como estatuas.
  Si hay menos de 3 obligaciones, se seleccionan las disponibles.
- La selección debe ser determinista para una aparición y un día concretos; así las
  correcciones de ayer no cambian de forma arbitraria qué tarea era una estatua.
- Completar una obligación convertida en estatua rompe esa estatua y suma un golpe.
- Una estatua que llega sin romper al cierre del día cura una unidad de progreso de
  Medusa y hace que el fallo de esa obligación cause el doble de daño.
- La meta total de estatuas se fija al activar el boss:
  `clamp(round(cargaDiaria × 2), 4, 14)`.
- El progreso se deriva de las obligaciones, completados y eventos reales; no se guarda
  un contador manual de estatuas rotas.
- Medusa se vence cuando el progreso neto alcanza la meta. Si termina la ventana sin
  alcanzarla, derrota al jugador.

### Entorno y derrota

- **Mirada:** las congelaciones de racha y el escudo no protegen los fallos durante la
  ventana de Medusa.
- La derrota causa 20 de daño directo, respetando la regla Hardcore de no matar por
  efectos indirectos.
- La derrota aplica **Amnesia** como maldición grave permanente hasta curarla o vencer a
  Medusa en una revancha.
- Vencer a Medusa en una revancha elimina Amnesia inmediatamente y reinicia cualquier
  progreso de Penitencia asociado.
- Amnesia no destruye ni consume el Espejo de plata. Mientras Amnesia esté activa,
  sobrescribe temporalmente el efecto del Espejo; al curarla, el histórico vuelve a
  estar visible si el Espejo sigue en la expedición.

### Recompensas

- EXP base: 140.
- Oro base: 80.
- Congelación de racha: 55 %.
- Agua bendita: 25 %.
- Sello de aplazamiento: 25 %.
- Poción de vigor: 20 %.
- Probabilidad base del alma: 2,5 %.
- El alma de Medusa describe la pasiva prevista en el catálogo compartido:
  una congelación de racha gratuita cada 7 días. La infraestructura general para
  activar pasivas de almas equipadas queda fuera de este change si todavía no existe
  cuando se implemente.

## Alcance técnico

- Añadir `medusa` a `BossId` y al catálogo de almas.
- Añadir la definición de Medusa al catálogo de bosses, con objetivo de estatuas,
  disparador de racha, recompensas, `defeatCurse: amnesia` y
  `revengeCurse: amnesia`.
- Añadir un objetivo `statues` o una abstracción equivalente que permita:
  - fijar la meta al activar el encuentro;
  - derivar las estatuas de cada día de forma estable;
  - calcular roturas y curaciones al corregir completados;
  - reutilizar el cálculo en la tarjeta, el diálogo y la resolución del boss.
- Generalizar el bloqueo de congelaciones y escudos para consultar el efecto activo del
  boss, en lugar de comprobar únicamente `bossId === 'death'`.
- Integrar el multiplicador de daño doble solo para obligaciones que fueron estatuas y
  no se rompieron, sin duplicar daños al reevaluar ayer.
- Mostrar estatuas, progreso neto, Mirada y Amnesia en el banner, diálogo, resultado y
  Bestiario.
- Añadir sprite y escena de Medusa siguiendo el patrón de los bosses existentes.

## Fuera de alcance

- Implementar la pasiva funcional del alma de Medusa si el sistema de pasivas equipadas
  todavía no está operativo.
- Cambiar la semántica general de Amnesia, del Espejo de plata o de las demás
  maldiciones graves.
- Implementar Petrificación para otro boss.
- Implementar Cerbero, Hidra/Escila, Doppelgänger, Sukamon o Drácula.

## Decisiones de diseño

- Medusa usa Amnesia, no Petrificación, porque es el boss avanzado que puede anular
  temporalmente el desbloqueo histórico del Espejo.
- El Espejo sigue siendo una reliquia de expedición y nunca se rompe al recibir
  Amnesia.
- El progreso de estatuas se reconstruye desde datos reales para conservar la
  corrección de ayer y la idempotencia del motor.

