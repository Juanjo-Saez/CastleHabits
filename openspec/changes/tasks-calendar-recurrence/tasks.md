# Tareas

## 1. Modelo y lógica de recurrencia
- [x] 1.1 Añadir fecha de inicio (`startDate`) a `Item`, por defecto hoy.
- [x] 1.2 Hacer que `recurrence.ts` ignore apariciones anteriores al inicio.
- [x] 1.3 Soportar intervalos (cada N días/semanas/meses) y día concreto del mes (incluye "último día").
- [x] 1.4 Excluir apariciones previas al inicio del cálculo de fallos y daño.
- [x] 1.5 Actualizar backup para incluir el nuevo campo e importar datos antiguos.

## 2. Formulario de frecuencia
- [x] 2.1 Sustituir el selector actual por Día / Semana / Mes con intervalo.
- [x] 2.2 Añadir selección de días de la semana y día del mes.
- [x] 2.3 Añadir selector de fecha de inicio (con atajos Hoy, Mañana y Mes próximo).
- [x] 2.4 Mostrar un resumen legible de la frecuencia elegida.

## 3. Lista de tareas
- [x] 3.1 Separar secciones de puntuales y recurrentes.
- [x] 3.2 Mostrar solo las recurrentes que tocan hoy.
- [x] 3.3 Mostrar días restantes en las puntuales.
- [x] 3.4 Añadir ordenación (dificultad por defecto, vencimiento, estancia). Las misiones secundarias se ordenan por dificultad.
  - Nota: "obligaciones primero" no se ofrece porque las listas ya están separadas por compromiso; las rutas se añadirán al orden en `routes-missions-jobs`.

## 4. Calendario mensual
- [x] 4.1 Calcular apariciones previstas por día.
- [x] 4.2 Dibujar velas (máx. 6) y el indicador de 7 o más.
- [x] 4.3 Mostrar resumen de días pasados.
- [x] 4.4 Detalle del día: tareas, EXP, monedas.
- [x] 4.5 Enlazar el mismo detalle desde el mapa de Constancia.

## 5. Validación
- [x] 5.1 Comprobaciones de recurrencia, calendario, orden y penalizaciones ejecutadas con scripts temporales (el repositorio aún no tiene test runner).
- [x] 5.2 `npm run lint` y `npm run build` correctos.
