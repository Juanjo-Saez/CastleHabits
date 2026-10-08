# Cambio: Rutas, misiones y oficios

## Por qué

Las tareas son independientes. Se quieren metas de largo plazo agrupadas por tema (ejercicio, programación, mejora personal) con progreso propio y recompensas, y oficios con pasivas.

## Qué cambia

- **Rutas** temáticas que agrupan tareas existentes. Rutas iniciales:
  - Cazavampiros: ejercicio.
  - Tecnomancer: estudiar programación y desarrollar esta app.
  - Mejora personal: incluye las sesiones con la psicóloga.
- **Misiones de ruta** con reglas por periodo, por ejemplo "al menos 3 de 5 actividades durante un mes" con un número configurable de fallos permitidos.
- **Progreso** de cada ruta calculado por periodos con reglas; superar una misión desbloquea una más difícil (por ejemplo 100 a 150 abdominales).
- **Oficios**: se obtienen al cumplir una ruta de oficio y se pueden equipar. La pasiva escala con el nivel del oficio (por ejemplo, el oficio de tecnología da más EXP en tareas de la ruta Tecnomancer).
- Las tareas pueden asociarse a una ruta (también usado por la ordenación zona/ruta).

## Fuera de alcance

- Bosses, tienda y objetos.
- Compartir oficios entre jugadores.
- Mapa y transiciones del mundo.

## Decisiones tomadas

- El progreso se mide por periodos con reglas, no por EXP acumulada.
- El bono del oficio crece con su nivel.

## Pendiente de definir

- Fórmula exacta de nivel y bono por nivel del oficio.
- Si superar una misión de ruta da recompensas extra de monedas/EXP.
- Qué pasa con el oficio equipado al morir en Hardcore.

## Impacto

- Nuevas tablas de rutas, misiones y oficios en Dexie (nueva versión de BD).
- `Item` necesita referencia a ruta.
- Cálculo de EXP debe aplicar el bono del oficio equipado.
- Backup debe incluir las nuevas tablas.
- Depende de `tasks-calendar-recurrence` para fechas de inicio y apariciones.
