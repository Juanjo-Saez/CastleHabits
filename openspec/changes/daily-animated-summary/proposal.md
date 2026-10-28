# Cambio: Resumen diario animado y celebración de nivel

## Por qué

Al volver a la aplicación no hay una recapitulación narrativa del día que acaba de terminar. El jugador debe consultar varias pantallas para entender qué completó, qué obligaciones fallaron, qué recursos ganó o perdió y cómo avanzó. La subida de nivel actual es un aviso breve que no explica el cambio ni sus mejoras.

El resumen debe convertir esos datos existentes en un cierre diario atractivo, sin conceder recompensas ni aplicar penalizaciones al mostrarlo o reproducirlo.

## Experiencia y diseño

- Al completar la carga inicial y el cierre de penalizaciones, presentar automáticamente el resumen de ayer la primera vez que se abre la aplicación en el día operativo actual. El día operativo cambia a las 02:00, igual que `todayKey()`.
- Si han pasado varios días sin abrir la aplicación, presentar únicamente el resumen de ayer. No abrir una secuencia ni reproducir resúmenes antiguos.
- Usar una pantalla modal de alto impacto, adaptada al ancho móvil y coherente con el grimorio gótico de la app: fondo oscuro, marco ornamental dorado, tipografía de fantasía para títulos, tipografía pixel para cifras y acentos de sangre solo para daño o penalizaciones. No añadir una estética genérica de dashboard.
- Estructura narrativa propuesta:
  1. **Apertura**: fecha y frase breve que sitúe el cierre del día.
  2. **Crónica**: actividades cumplidas y obligaciones incumplidas; indicar claramente las obligaciones que causaron daño y distinguir los fallos protegidos.
  3. **Balance**: EXP y oro netos ganados/perdidos si hay eventos que acrediten esas pérdidas; vida perdida y estado final de vida. No presentar compras como pérdida del resumen ni inventar penalizaciones.
  4. **Progreso**: rachas y progreso de rutas al cierre del día, además de nivel anterior → nivel alcanzado y las mejoras asociadas si hubo subida.
  5. **Cierre**: botón para continuar y acceso a la corrección de ayer.
- Animar la entrada del panel, el llenado de barras y los contadores en una secuencia breve y con jerarquía visual. Las barras deben comunicar valores reales (por ejemplo, EXP hacia el siguiente nivel y vida), tener texto equivalente y no depender solo del color.
- Incluir un botón visible **Saltar animación** que complete inmediatamente la secuencia sin cerrar el resumen. El cierre y el botón de saltar deben ser utilizables con teclado y lector de pantalla.
- Respetar `prefers-reduced-motion`: mostrar el estado final sin movimiento. El resumen debe seguir siendo completo y legible si el sonido no puede reproducirse.
- Reutilizar o ampliar el sonido existente solo como efecto de presentación. No iniciar audio en bucle ni exigir sonido para entender el resultado.
- Desde Crónicas, añadir un acceso persistente a **Resumen de ayer** que permite volver a abrirlo y reproducir la presentación aunque ya se haya mostrado automáticamente. El acceso manual no modifica la marca de presentación automática.
- Tras corregir ayer, volver a abrir el acceso debe mostrar los datos recalculados, sin etiquetas, avisos o secciones que distingan una corrección.

## Comportamiento y datos

- Crear una función pura de resumen por fecha operativa, separada de la UI y de las funciones que conceden recompensas o aplican daño.
- Usar `Completion` para actividades completadas y sus `xpEarned`/`coinsEarned`; usar `ItemEvent` para fallos, daño, protecciones y cualquier penalización explícitamente registrada. Agrupar eventos por fecha de actividad/fecha de cierre, no por el instante de edición.
- Respetar ventanas de recurrencia: asociar el fallo a la fecha en que cerró la ventana y contar una aparición como completada una sola vez. Las tareas archivadas deben seguir apareciendo si tienen historial relevante.
- No inferir pérdidas de EXP u oro a partir de un fallo: actualmente el fallo aplica daño, no una penalización de EXP/oro. Mostrar esos conceptos solo si existen eventos explícitos que los registren.
- No presentar el estado actual del perfil como si fuera el estado de ayer. Persistir un snapshot diario informativo de nivel/EXP, vida, rachas y rutas al cerrar el día, identificándolo por fecha y expedición. El snapshot no es una fuente para conceder efectos de juego.
- La corrección de ayer debe recalcular los hechos del resumen y actualizar de forma coherente cualquier snapshot derivado que dependa de la fecha corregida. Los snapshots previos a esta función no contienen historia suficiente: no inventar deltas históricos; mostrar solo hitos verificables y el estado disponible.
- Persistir de forma local la fecha operativa cuyo resumen se mostró automáticamente, separada del progreso del juego y del formato de backup. Abrir/reproducir manualmente no cambia esa fecha. La presentación debe quedar marcada de forma idempotente para no reaparecer al navegar, recargar o cruzar un refresco del día.
- La consulta/reproducción no puede escribir completados, eventos de juego, perfil, EXP, oro, vida, rachas ni rutas. Solo puede persistir la marca de presentación automática.

## Ampliación de la celebración de nivel

- Mantener una celebración dedicada, visualmente coherente con el resumen, que muestre nivel anterior, nivel nuevo y mejoras efectivamente concedidas (por ejemplo, aumento de vida máxima y recuperación aplicada).
- En la subida ocurrida ayer, integrar la celebración en la sección de progreso del resumen para evitar una segunda celebración duplicada.
- Para subidas ocurridas durante el día actual, conservar una celebración independiente y mejorarla sin bloquear los controles ni ocultar la navegación.
- Separar los datos del hito de la orden de reproducir la animación; no reutilizar la animación como disparador de recompensas.

## Fuera de alcance

- Crear nuevas penalizaciones o cambiar las reglas de EXP, monedas, daño, rachas, rutas o Hardcore.
- Consultar cualquier fecha distinta de ayer desde el resumen.
- Añadir ajustes de usuario para desactivar individualmente animaciones o sonido.
- Cambiar la fórmula de nivel, las reglas de corrección o el formato de backup existente.

## Decisiones tomadas

- El día mostrado es siempre ayer según el corte operativo de las 02:00.
- Los días sin actividades, fallos ni hitos no abren el resumen automáticamente, pero se pueden consultar desde Crónicas.
- Rachas y rutas se recalculan a la fecha del resumen. El snapshot solo guarda nivel, EXP y vida al cierre; perfiles anteriores a esta función lo reconstruyen quitando la EXP de hoy, con la vida actual.
- El snapshot no viaja en el backup: al importar uno se descartan y el resumen no muestra el estado del personaje hasta el siguiente cierre.
- No existen penalizaciones de EXP u oro por fallar (solo daño), así que el resumen no muestra ese apartado.
- El resumen automático aparece una sola vez por día operativo; el acceso manual permite reproducirlo ilimitadamente.
- El resumen es una vista derivada. Animar, saltar o consultar no ejecuta lógica de progresión.
- Las correcciones de ayer cambian el resumen consultado; no se mantiene una copia visual obsoleta ni se señala que hubo una edición.
- Motion reducido y fallo/bloqueo de audio degradan la presentación a su estado final, sin impedir la consulta.
- La marca de “mostrado automáticamente” es una preferencia local de interfaz, no un dato de gameplay ni de backup.

## Impacto previsto

- `App.tsx`: coordinar elegibilidad y presentación tras cargar datos y liquidar penalizaciones, evitando repeticiones por refresco o navegación.
- `StatsPage.tsx`: añadir el acceso manual y alimentar el mismo componente de resumen con datos frescos.
- `lib/calendar.ts` y `lib/stats.ts` o un módulo puro nuevo: reutilizar las reglas de fecha, cierre de ventanas, actividad y eventos para un resumen por fecha.
- `db/database.ts` y tipos: añadir almacenamiento mínimo para snapshots diarios informativos y migrar Dexie sin perder datos.
- `usePlayerStore.ts` / `LevelUpCelebration.tsx`: conservar el nivel anterior y las mejoras verificables; coordinar celebración actual con resumen de ayer.
- `DayDetail.tsx` / `DayCorrection.tsx`: no cambiar el flujo existente; ofrecer desde el resumen un enlace directo al detalle/corrección de ayer.
- CSS y accesibilidad: animaciones propias del resumen, estado final para “saltar” y `prefers-reduced-motion`.

## Criterios de aceptación

1. El primer acceso del día operativo muestra como máximo el resumen de ayer, incluso tras varios días sin abrir la app.
2. El corte de las 02:00 se aplica a elegibilidad, selección de fecha y eventos representados.
3. La presentación incluye actividad, pendientes, EXP/oro, daño y sus causas, racha, rutas y nivel/mejoras cuando los datos lo permitan.
4. Consultar, repetir o saltar la presentación no cambia ningún recurso ni estado de juego.
5. El acceso manual vuelve a leer los datos y refleja una corrección de ayer sin tratamiento especial.
6. La celebración distingue nivel anterior/nuevo y mejoras, y no se duplica con el resumen de ayer.
7. El contenido es usable sin sonido, con movimiento reducido y mediante teclado; los controles no quedan bloqueados por la animación.
