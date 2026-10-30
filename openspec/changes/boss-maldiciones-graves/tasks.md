# Tareas

## 1. Modelo

- [ ] 1.1 Maldiciones graves en el catálogo de `lib/curses.ts`, con tipo `grave` y sin fecha de caducidad.
- [ ] 1.2 Modificadores de Petrificación (rachas, congelaciones), Amnesia (estadísticas históricas) y Cadenas (aplazar y fallo doble) en `lib/modifiers.ts`.

## 2. Curas

- [ ] 2.1 Agua bendita cura también las graves.
- [ ] 2.2 Penitencia: contador de 3 días con todas las obligaciones cumplidas, con reinicio si falla un día.
- [ ] 2.3 Revancha: enganche para que cada boss quite su maldición al vencerlo.

## 3. Interfaz

- [ ] 3.1 Panel de maldiciones en el Perfil con la diferencia entre leves (con días) y graves (hasta curar).
- [ ] 3.2 Chip de maldición grave en el Castillo.

## 4. Validación

- [ ] 4.1 Tests en `tests/`: efectos de cada grave, límite de dos, renovación, penitencia y revancha.
- [ ] 4.2 `npm test`, `npx tsc -b` y `npm run build`.
- [ ] 4.3 Comprobación en navegador con datos de prueba en IndexedDB.
