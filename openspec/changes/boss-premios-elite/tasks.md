# Tareas

## 1. Élite

- [ ] 1.1 Desbloqueo a las 10 victorias, derivado de `bestiaryOf`.
- [ ] 1.2 Sorteo de élite (1/10) en cada aparición una vez desbloqueada, guardado en el encuentro.
- [ ] 1.3 Efectos de élite: meta ×1,25, efecto de entorno extra, probabilidades ×1,5 y reliquia rara (1 %).
- [ ] 1.4 Aviso de élite al aparecer en el banner y la tarjeta.

## 2. Látigo

- [ ] 2.1 Consumible látigo en `lib/modifiers.ts` (EXP ×1,5 el resto del día).
- [ ] 2.2 Uso desde el Perfil o el Castillo y sorteo en las tablas de premios.

## 3. Títulos y cosméticos

- [ ] 3.1 Títulos permanentes por primera victoria y por hitos (1, 5 y 20 victorias).
- [ ] 3.2 Cosmético de maestro cazador a las 50 victorias.
- [ ] 3.3 Muestra de títulos y cosméticos en la página de cada boss del bestiario.

## 4. Validación

- [ ] 4.1 Tests en `tests/`: umbral de élite, sorteo 1/10, multiplicadores, látigo y títulos por hitos.
- [ ] 4.2 `npm test`, `npx tsc -b` y `npm run build`.
- [ ] 4.3 Comprobación en navegador con datos de prueba en IndexedDB.
