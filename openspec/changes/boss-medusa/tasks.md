# Tareas — Medusa

## Diseño y datos

- [x] Confirmar el balance de la ventana, meta mínima/máxima y daño de derrota.
- [x] Añadir `medusa` a `BossId`, al catálogo de almas y al Bestiario.
- [x] Añadir la definición de Medusa con el disparador de racha de 14 días.
- [x] Actualizar `boss-roster` para sustituir Petrificación por Amnesia en Medusa.

## Motor de estatuas

- [x] Añadir el objetivo `statues` o una abstracción equivalente sin contadores manuales.
- [x] Implementar la selección determinista de 1–3 obligaciones por día.
- [x] Derivar estatuas rotas, estatuas pendientes y curación de Medusa desde
      completados y eventos reales.
- [x] Fijar la meta al activar el encuentro usando la carga diaria.
- [x] Resolver la victoria y la derrota al cierre de la ventana de forma idempotente.
- [x] Integrar el daño doble solo en fallos de estatuas no rotas.
- [x] Hacer que las correcciones de ayer recalculen el resultado sin duplicar daño,
      curación ni eventos.

## Mirada y Amnesia

- [x] Generalizar el bloqueo de congelaciones y escudos a cualquier boss con el efecto
      `disableFreeze`.
- [x] Configurar `defeatCurse: 'amnesia'` y `revengeCurse: 'amnesia'`.
- [x] Verificar que curar Amnesia restaura la visibilidad si permanece el Espejo.
- [x] Verificar que una revancha elimina Amnesia sin consumir el Espejo.

## Interfaz

- [x] Añadir sprite y escena de Medusa.
- [x] Mostrar estatuas seleccionadas, rotas y pendientes en la tarjeta y el diálogo.
- [x] Explicar Mirada, la meta, la curación de estatuas y Amnesia en el Bestiario.
- [x] Mostrar la maldición y las recompensas en el resultado del encuentro.

## Verificación

- [x] Añadir tests del disparador de racha y de su evaluación al terminar el
      enfriamiento.
- [x] Añadir tests de selección determinista y progreso de estatuas.
- [x] Añadir tests de curación por estatuas sin romper y de daño doble localizado.
- [x] Añadir tests de victoria, derrota, Amnesia y revancha.
- [x] Añadir un test de corrección de ayer que cambie una estatua de rota a pendiente
      y confirme que el daño/evento se recalcula una sola vez.
- [x] Añadir tests de idempotencia de la resolución.
- [x] Ejecutar tests, TypeScript, build, lint focalizado y comprobación visual.

## Fuera de este change

- La pasiva runtime del Alma de Medusa queda pendiente de un change transversal para
  pasivas de almas equipadas; el catálogo ya contiene su descripción.
