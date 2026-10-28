# Tareas

## 1. Contrato de datos y resumen puro

- [x] 1.1 Hechos históricos: completados y recompensas (`Completion`), fallos, daño y protecciones (`ItemEvent`), y rachas y rutas, que se recalculan a la fecha del resumen con `streakEndingOn` y `recomputeRoute`. Solo es estado "actual" lo que no se puede deducir: nivel, EXP y vida, que guarda el snapshot.
- [x] 1.2 Tipos `DaySnapshot` y `LevelUpInfo` en `types`; el resumen (`DailySummary`) vive en `lib/dailySummary.ts` y no tiene funciones que muten el juego.
- [x] 1.3 Dexie v5 añade `daySnapshots` (clave `date`) sin tocar las demás tablas. Se vacía en `resetAllAppData` y al importar un backup (no viaja en el backup).
- [x] 1.4 `buildDailySummary` es una función pura que solo lee.
- [x] 1.5 Corte de las 02:00 con `yesterdayKey()`, ventanas de margen vía `penaltyDate` y filtro por expedición. Un fallo solo cuenta con daño o protección registrados: el marcador de recuperación tardía (daño 0 sin protección) no es un fallo del día.
- [x] 1.6 `settleDayPenalties` guarda el snapshot al cerrar ayer. Perfiles que ya habían liquidado ayer antes de esta versión reconstruyen el nivel y la EXP quitando la de hoy; su vida es la actual.
- [x] 1.7 `planDayCorrection` devuelve el snapshot ajustado (`reconcileSnapshot`) y `saveDayCorrection` lo guarda en la misma transacción que perfil, completados y eventos.

## 2. Presentación automática idempotente

- [x] 2.1 Marca local en `localStorage` (`lib/summaryMarker.ts`), fuera del perfil y del backup.
- [x] 2.2 `App.tsx` llama a `presentIfDue()` tras cargar y liquidar ayer. Un guardián evita repeticiones por refrescos, StrictMode o cambio de ruta.
- [x] 2.3 Solo se resume ayer. Con el personaje caído, o si ayer pertenece a una expedición anterior, no hay resumen. Los errores abren el modal con el mensaje y no marcan el día como mostrado.
- [x] 2.4 Diálogo con foco inicial y restaurado, Tab atrapado, Escape y botón Continuar.
- [x] 2.5 Decisión: los días sin nada que contar (sin actividades, fallos ni hitos) no abren el resumen solos; siguen disponibles a mano.

## 3. Interfaz y animación

- [x] 3.1 `DailySummaryModal` con `cv-panel` dorado, tipografías y paleta de la app; diseñado para móvil.
- [x] 3.2 Secciones Crónica, Balance y Progreso con estados vacíos.
- [x] 3.3 Secuencia por etapas (apertura, crónica, balance, progreso), contadores y barras animados. **Saltar animación** pasa al estado final sin cerrar; al terminar se ofrece **Repetir animación**.
- [x] 3.4 `prefers-reduced-motion` muestra el estado final. Todo el contenido está en el DOM desde el principio, con resumen accesible, barras con `role="progressbar"` y cifras con texto para lectores.
- [x] 3.5 Sonidos sintetizados (apertura, oro, daño, subida de nivel). Saltar o reducir movimiento los silencia y un fallo de audio se ignora.
- [x] 3.6 Botón "Corregir ayer" que cierra el resumen y abre `/calendario?date=ayer`.

## 4. Consulta manual y correcciones

- [x] 4.1 Panel "Resumen de ayer" en Crónicas.
- [x] 4.2 `openManual()` lee siempre la base de datos en el momento de abrir.
- [x] 4.3 Repetir y consultar no escribe nada; solo el modo automático guarda la marca.
- [x] 4.4 El resumen no contiene marcas ni textos de edición.

## 5. Celebración de nivel

- [x] 5.1 `justLeveledUp` pasa de un número a `LevelUpInfo` (nivel anterior y nuevo, vida máxima ganada). Varias subidas seguidas se fusionan desde el nivel inicial. Las subidas por corrección también la activan.
- [x] 5.2 Tarjeta flotante con rayos, "Nivel A → B", mejoras (vida máxima, vida restaurada, nuevo rango) y botón Continuar. No bloquea la navegación y se cierra sola a los 9 s.
- [x] 5.3 El resumen de ayer integra el hito en Progreso y la tarjeta se oculta mientras está abierto.
- [x] 5.4 `HP_PER_LEVEL` sustituye al 5 fijo; fórmulas y recompensas sin cambios.

## 6. Validación

- [x] 6.1 `tests/dailySummary.test.mjs` cubre el corte de las 02:00, varios días sin entrar y la marca idempotente. La carga y el no repetirse tras recargar se comprobaron en el navegador, porque el almacén usa IndexedDB y no hay un doble para pruebas.
- [x] 6.2 Pruebas de día sin actividad, fallo con daño y protegido, archivadas, recuperación tardía, cantidad parcial y otra expedición.
- [x] 6.3 Prueba de corrección de ayer: se recalculan actividad, daño, EXP, vida y snapshot, y desmarcar devuelve el resumen original.
- [x] 6.4 Invariante: el resumen con entradas congeladas es idempotente. En el navegador, abrir, saltar, cerrar y recargar dejó perfil, completados, eventos y objetos idénticos.
- [x] 6.5 Comprobado en navegador: móvil de 390 px, movimiento reducido, foco y Tab, Escape, y acceso a "Corregir ayer".
- [x] 6.6 `npm test` (36 casos) y `npm run build` correctos. `npm run lint` solo informa del error que ya tenía `NumberField.tsx`.
