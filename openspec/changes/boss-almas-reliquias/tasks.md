# Tareas

## 1. Almas

- [ ] 1.1 Modelo de almas persistentes en el perfil (tipo, rango, fragmentos) y migración de versión de la base de datos.
- [ ] 1.2 Contador de piedad por boss: +1 % por victoria sin alma, máximo +20 %, reinicio al conseguir un alma.
- [ ] 1.3 Sorteo de alma con probabilidad base del boss y piedad aplicada.
- [ ] 1.4 Fragmentos por alma repetida y subida de rango (1 → 3 con 3 fragmentos).
- [ ] 1.5 Casillas equipadas por nivel de expedición (1 / 2 / 3 en niveles 5 / 10 / 20) y pantalla de equipar.
- [ ] 1.6 Aplicación de los efectos de alma según su rango (gancho para que cada boss registre su efecto).

## 2. Reliquias

- [ ] 2.1 Reliquias por expedición: se reinician al jubilarse o renacer.
- [ ] 2.2 Reliquia garantizada en la primera victoria, cuando el boss la indique.
- [ ] 2.3 Efectos de Rosario, Espejo de plata y Corazón, con sus modificadores en `lib/modifiers.ts`.

## 3. Bestiario

- [ ] 3.1 Mostrar la probabilidad del alma con el contador de piedad a partir de 20 victorias.

## 4. Validación

- [ ] 4.1 Tests en `tests/`: piedad (reinicio y tope), subida de rango, casillas por nivel, reinicio de reliquias al renacer y conservación de almas.
- [ ] 4.2 `npm test`, `npx tsc -b` y `npm run build`.
- [ ] 4.3 Comprobación en navegador con datos de prueba en IndexedDB.
