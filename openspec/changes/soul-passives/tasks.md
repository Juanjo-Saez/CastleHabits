# Tareas — Pasivas runtime de Almas

## Contrato y catálogo

- [x] Definir el identificador tipado de cada pasiva.
- [x] Asociar las Almas implementadas a su pasiva y descripción.
- [x] Exponer resolución pura de Almas equipadas y rango activo.
- [x] Rechazar silenciosamente entradas no obtenidas u obsoletas sin mutar el perfil.

## Integraciones por pasiva

- [ ] Murciélago: bono de EXP al cerrar todas las obligaciones del día.
- [ ] Slogra: bono de monedas al quinto cumplimiento diario.
- [ ] Gaibon: aplazamiento gratuito semanal con registro idempotente.
- [ ] Legion: moneda adicional para tareas triviales.
- [ ] Frankenstein: bono de EXP para la primera tarea de cada zona.
- [ ] Succubus: primera poción diaria con curación reforzada.
- [ ] Death: segunda oportunidad única por expedición.
- [ ] Medusa: congelación gratuita con periodo de siete días.

## Persistencia y correcciones

- [ ] Definir el registro mínimo necesario para efectos consumibles sin
      contadores manuales duplicados.
- [ ] Garantizar que equipar o desequipar no reescribe días cerrados.
- [ ] Hacer que las correcciones de ayer recalculen efectos derivados sin
      duplicar recompensas ni consumos.

## Verificación

- [x] Tests del catálogo, equipamiento, rangos y entradas obsoletas.
- [ ] Tests unitarios por pasiva y rango.
- [ ] Tests de idempotencia y corrección de ayer para efectos consumibles.
- [ ] Validación visual del panel de Almas con descripciones reales.
- [x] Ejecutar tests, TypeScript, build y lint.
