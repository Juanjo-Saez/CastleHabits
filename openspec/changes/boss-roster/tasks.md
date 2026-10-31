# Tareas

## Fase 2: motor general, Slogra y Gaibon, efectos y maldiciones básicas

### 1. Motor y datos

- [x] 1.1 `BossDefinition` con objetivo (`days` o `hits`), efectos de entorno, daño y maldición de derrota, premio base, tabla de objetos, enfriamiento, peso y disparador opcional.
- [x] 1.2 `BossEncounter` ampliado: `goal`, `rewards`, `curse`, ids `enc:<sequence>` y `bossId` provisional mientras está pendiente.
- [x] 1.3 Meta calibrada por la carga real (`dailyLoad`, `bossGoal`) y fijada al activarse.
- [x] 1.4 Progreso por golpes derivado de los completados (`hitProgress`, `splitBars`): todas las tareas golpean, un completado por tarea y día, daño por dificultad.
- [x] 1.5 Selección del siguiente boss (`pickBoss`, `reactiveBoss`): sorteo ponderado sin repetir el último y gancho de disparadores.
- [x] 1.6 Migración de los premios antiguos (`migrateEncounter`) y programación de un encuentro nuevo si el último está resuelto sin sucesor.

### 2. Premios

- [x] 2.1 Sorteo independiente por objeto, con consuelo si no sale ninguno y multiplicador por nivel (`rollRewards`).
- [x] 2.2 Agua bendita en el perfil y bolsa de oro en el motor.
- [x] 2.3 El resultado guarda lo concedido para el aviso y el futuro bestiario.

### 3. Efectos y maldiciones

- [x] 3.1 Efectos de entorno `xpPercent` y `potionPercent`.
- [x] 3.2 Catálogo de maldiciones leves (Lanza clavada, Pesadez, Avaricia, Silencio, Veneno, Encanto, Sombra) con máximo de dos y renovación.
- [x] 3.3 Modificadores centralizados (`lib/modifiers.ts`): EXP, oro, pociones y aplazar; aplicados al completar, al corregir un día y al usar una poción.
- [x] 3.4 Daño diario de las maldiciones, idempotente y sin llegar a matar.
- [x] 3.5 Curas: agua bendita y sacerdotisa; panel de Maldiciones en el Perfil y chips en el Castillo.

### 4. Bestiario (datos)

- [x] 4.1 Los encuentros resueltos se conservan al jubilarse; los pendientes se reprograman.
- [x] 4.2 `bestiaryOf` calcula victorias, derrotas y primera victoria por boss.

### 5. Slogra y Gaibon

- [x] 5.1 Definición y balance: vida por carga real, dos barras 55/45, derrota con 15 de daño y Lanza clavada.
- [x] 5.2 Sprites de Slogra y Gaibon y escena compuesta para el cielo, la tarjeta y el banner.
- [x] 5.3 Interfaz general de bosses: banner con barras, tarjeta con vida y daño por dificultad, aviso de resultado con premios y maldición, golpe visual y marca «Boss» en las tareas.

### 6. Validación

- [x] 6.1 `npm test` (68 casos): meta por carga, golpes, barras, victoria y derrota, premios, maldiciones, modificadores, migración, bestiario, desbloqueos, mecánica, selección, disparadores y renacer.
- [x] 6.2 `npm run build` correcto; `npm run lint` solo informa del error previo de `NumberField.tsx`.
- [x] 6.3 Comprobado en navegador: migración de un encuentro antiguo, aparición de Slogra y Gaibon, golpes al cumplir tareas, curas con agua bendita y sacerdotisa, y renacer conservando el bestiario.

### 7. Bestiario (pantalla)

- [x] 7.1 Panel «Bestiario» en el Perfil: silueta y «???» sin victorias; página con mecánica, efectos, derrota y recompensa al nivel actual con 1 victoria.
- [x] 7.2 Probabilidades de objetos con 5 victorias; historia y versión élite con 10; probabilidad base del alma con 20.
- [x] 7.3 Cada bloque bloqueado indica las victorias que faltan; las derrotas y la primera victoria siempre se muestran.

## Trabajo pendiente

Lo que queda se reparte en changes propios, listados en [proposal.md](./proposal.md#changes-derivados):

- [x] `boss-almas-reliquias`: almas, piedad, reliquias y contador de piedad del bestiario.
- [ ] `boss-premios-elite`: élite, látigo y títulos.
- [x] `boss-maldiciones-graves`: petrificación, amnesia, cadenas, penitencia y revancha.
- [x] [boss-legion](../boss-legion/tasks.md): cáscara, núcleo, bolsa de oro y daño por fallo ×1,5.
- [x] [boss-frankenstein](../boss-frankenstein/tasks.md): piezas por zona, remiendos de Igor, Relámpagos y Costuras.
- [x] [boss-succubus](../boss-succubus/tasks.md): robo inicial de vida, recuperación por tareas, Niebla de rosas y Encanto.
- [x] [boss-death](../boss-death/tasks.md): hoces por incumplimientos, apuesta, Cielo sin luna y Hoz de Death.
- [ ] Un change por boss pendiente, en el orden del proposal: Cerbero, Hidra/Escila, Doppelgänger, Sukamon y Drácula.
