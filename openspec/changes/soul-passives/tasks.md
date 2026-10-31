# Tareas — Pasivas runtime de Almas

## Contrato y catálogo

- [x] Definir el identificador tipado de cada pasiva.
- [x] Asociar las Almas implementadas a su pasiva y descripción.
- [x] Exponer resolución pura de Almas equipadas y rango activo.
- [x] Rechazar silenciosamente entradas no obtenidas u obsoletas sin mutar el perfil.
- [x] Pedir el loadout al entrar en un nuevo día y bloquearlo hasta las 02:00.
- [x] Persistir el loadout fijado en el snapshot diario para correcciones.
- [x] Añadir un registro persistente de activaciones con clave idempotente,
      rango y loadout de la fecha; incluirlo en migraciones y copias de seguridad.
- [x] Añadir reconciliación acotada por expedición y fuente para replays y
      correcciones.

## Integraciones por pasiva

- [x] Murciélago: bono de EXP del 5/10/15 % al cerrar todas las obligaciones
      del día según rango, con corrección e idempotencia.
- [x] Slogra: bono de 5/10/15 monedas al quinto cumplimiento diario según rango,
      con corrección e idempotencia.
- [x] Gaibon: aplazamiento gratuito con enfriamiento móvil de 7/5/3 días según
      rango, registrado en transacción idempotente.
- [x] Legion: moneda adicional para tareas triviales.
- [x] Frankenstein: bono de EXP para la primera tarea de cada zona, con escala +20/+30/+40 % por rango y cobertura de tareas booleanas, cuantitativas y correcciones históricas.
- [x] Succubus: primera poción diaria con curación 2×/3×/4× según rango,
      respetando maldiciones, vida máxima e idempotencia.
- [ ] Death: segunda oportunidad única por expedición.
- [ ] Medusa: congelación gratuita con periodo de siete días.

## Persistencia y correcciones

- [x] Definir el registro mínimo necesario para efectos consumibles sin
      contadores manuales duplicados.
- [x] Garantizar que equipar o desequipar no reescribe días cerrados.
- [x] Hacer que las correcciones de ayer recalculen efectos derivados sin
      duplicar recompensas ni consumos.
- [ ] Integrar y probar la reconciliación del registro con cada pasiva consumible.

## Verificación

- [x] Tests del catálogo, equipamiento, rangos y entradas obsoletas.
- [ ] Tests unitarios por pasiva y rango; pendiente Death y Medusa.
- [ ] Tests de idempotencia y corrección de ayer para Death y Medusa.
- [ ] Validación visual del panel de Almas con descripciones reales.
- [x] Ejecutar tests, TypeScript, build y lint.
