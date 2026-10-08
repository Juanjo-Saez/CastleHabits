# Cambio: Tareas, calendario y recurrencia

## Por qué

Crear tareas recurrentes hoy las hace exigibles de inmediato (riesgo de perder vida), la frecuencia es poco intuitiva y no permite periodos largos (p. ej. cada dos meses). La lista mezcla puntuales y recurrentes y muestra más de lo que toca hoy.

## Qué cambia

- **Lista de hoy**: muestra solo las tareas que deben cumplirse hoy. Las futuras solo se consultan en el calendario.
- **Secciones separadas** para tareas puntuales y recurrentes.
- **Puntuales**: mostrar días restantes (p. ej. "10 días") además de la fecha de vencimiento.
- **Fecha de inicio** opcional en recurrentes, por defecto hoy. Antes de esa fecha la tarea no aparece como pendiente ni cuenta como fallo.
- **Selector de frecuencia** rediseñado: Día / Semana / Mes + intervalo ("cada N") + días concretos (días de la semana o día del mes). Debe permitir "cada 2 meses" y "día 15 de cada mes".
- **Ordenación**: por dificultad (por defecto), fecha de vencimiento, obligaciones primero y zona/ruta.
- **Calendario mensual**:
  - Días futuros: carga prevista con velas (hasta 6 velas pequeñas; 7 o más como indicador "vela x7").
  - Días pasados: resumen de actividad (tareas hechas, EXP, monedas, etc.).
  - Al pulsar un día se abre su detalle. Esto cubre también el detalle de días en el mapa de Constancia.

## Fuera de alcance

- Rutas, misiones y oficios (cambio `routes-missions-jobs`).
- Mundo/mapa, tienda y bosses.

## Decisiones tomadas

- Las recurrentes futuras no aparecen en la lista de hoy.
- El calendario combina carga futura y resumen de días pasados.
- Fecha de inicio opcional con valor por defecto hoy.

## Impacto

- `Item` necesita fecha de inicio de recurrencia.
- `recurrence.ts` debe respetar inicio e intervalos mensuales.
- El cálculo de penalizaciones debe ignorar apariciones previas al inicio.
- Los datos del resumen diario salen de `completions` e `itemEvents`.
