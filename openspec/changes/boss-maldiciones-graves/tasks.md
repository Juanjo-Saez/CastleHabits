# Tareas

## 1. Modelo

- [x] 1.1 Maldiciones graves en el catálogo de `lib/curses.ts`, con tipo `grave` y sin fecha de caducidad.
- [x] 1.2 Modificadores de Petrificación (rachas, congelaciones), Amnesia (estadísticas históricas) y Cadenas (aplazar y fallo doble) en `lib/modifiers.ts`.

## 2. Curas

- [x] 2.1 Agua bendita cura también las graves.
- [x] 2.2 Penitencia: contador de 3 días con todas las obligaciones cumplidas, con reinicio si falla un día.
- [x] 2.3 Revancha: enganche para que cada boss quite su maldición al vencerlo.

## 3. Interfaz

- [x] 3.1 Panel de maldiciones en el Perfil con la diferencia entre leves (con días) y graves (hasta curar).
- [x] 3.2 Chip de maldición grave en el Castillo.

## 4. Validación

- [x] 4.1 Tests en `tests/`: efectos de cada grave, límite de dos, renovación, penitencia y revancha.
- [x] 4.2 `npm test`, `npx tsc -b` y `npm run build`.
- [x] 4.3 Comprobación en navegador con datos de prueba en IndexedDB.
