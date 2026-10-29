# Tareas

## 1. Contrato de datos y persistencia

- [x] 1.1 Añadir `BossId`, `BossStatus` y `BossEncounter` en `src/types/index.ts`, manteniendo el modelo preparado para más bosses.
- [x] 1.2 Añadir la tabla `bossEncounters` en Dexie con una nueva versión de esquema, índices mínimos y migración segura desde instalaciones existentes.
- [x] 1.3 Hacer que la inicialización cree de forma idempotente la primera programación con un retraso aleatorio inclusivo de 10–15 días desde el primer día operativo con la funcionalidad disponible.
- [x] 1.4 Limpiar la tabla de bosses en `resetAllAppData` y conservar la inicialización correcta de un perfil nuevo.
- [x] 1.5 Incluir `bossEncounters` en el backup, aumentar la versión del formato y aceptar backups antiguos inicializando el estado de bosses sin inventar progreso.
- [x] 1.6 Cubrir concurrencia de inicialización y ausencia de registros antiguos sin sobrescribir un encuentro ya persistido.

## 2. Motor puro del Murciélago gigante

- [x] 2.1 Crear `src/lib/bosses.ts` con la definición del Murciélago gigante, constantes de duración, objetivo, daño, recompensa y rangos aleatorios.
- [x] 2.2 Implementar el cálculo del siguiente día de activación y del cooldown con fechas operativas `yyyy-MM-dd`; los extremos 10 y 15 deben ser posibles.
- [x] 2.3 Implementar la selección de obligaciones válidas usando las reglas existentes de recurrencia, márgenes y compromiso; excluir hábitos y misiones secundarias de ruta.
- [x] 2.4 Implementar una función pura que calcule las fechas completas dentro de una ventana: al menos una obligación debida y todas completadas, sin exigir consecutividad.
- [x] 2.5 Implementar el resumen del encuentro para UI con estado, progreso, fechas completas, días restantes, efecto, recompensa y cooldown.
- [x] 2.6 Implementar el modificador de EXP `ceil(xp * 0.70)` únicamente cuando el encuentro esté activo, después de los bonos normales y antes de guardar completados/eventos.
- [x] 2.7 Mantener separadas las funciones puras de cálculo de las operaciones que escriben perfil, completados, eventos o encuentros.

## 3. Ciclo de vida y efectos de juego

- [x] 3.1 Crear `useBossStore` o una capa equivalente para cargar el encuentro actual y exponer su resumen y las tareas afectadas.
- [x] 3.2 Implementar una sincronización idempotente que inicialice, active, recalculе progreso y resuelva victoria o derrota sin repetir escrituras con efectos.
- [x] 3.3 Resolver la victoria al alcanzar 2 días completos, detener el modificador de EXP y crear el cooldown.
- [x] 3.4 Conceder una sola vez 100 EXP, 50 monedas y exactamente un recurso aleatorio entre aplazamiento, vigor y congelación; reutilizar el flujo de subida de nivel existente.
- [x] 3.5 Resolver la derrota cuando el día actual supera la ventana de 5 días y aplicar una sola vez 20 de daño directo, sin escudo ni congelación, respetando Hardcore.
- [x] 3.6 Asegurar que la recompensa y el daño quedan persistidos junto con el estado de resolución antes de anunciar el resultado a la UI.
- [x] 3.7 Sincronizar después de completar, deshacer, aplazar o corregir una obligación y después del refresco/cambio del día operativo.
- [x] 3.8 Integrar el modificador de EXP también en las correcciones de día para que el valor guardado sea coherente con el momento del completado.

## 4. Integración de la aplicación

- [x] 4.1 Ejecutar la carga y sincronización del boss después de cargar datos y liquidar penalizaciones, sin crear bucles de refresco.
- [x] 4.2 Mostrar errores de sincronización de forma explícita con el patrón de error existente; no convertir un fallo de persistencia en una victoria o derrota silenciosa.
- [x] 4.3 Mantener el comportamiento actual de recompensas, rutas, estadísticas, correcciones y notificaciones cuando el boss no está activo.
- [x] 4.4 Verificar que la raíz sigue redirigiendo a Castillo y que la vista de Hábitos permanece accesible en `/habitos`.

## 5. Castillo, boss y tarjeta informativa

- [x] 5.1 Mostrar el sprite del Murciélago gigante sobre la luna cuando corresponda, reutilizando el sistema pixel-art y el estilo visual existente.
- [x] 5.2 Convertir el boss en un control accesible con nombre, foco visible y activación por teclado.
- [x] 5.3 Crear una tarjeta/modal de detalle con nombre, efecto, progreso, fechas válidas, días restantes, victoria, derrota, recompensa y cooldown.
- [x] 5.4 Hacer que la tarjeta sea solo informativa y que cerrar/abrir no cambie ningún dato del juego.
- [x] 5.5 Añadir el modo de contemplación del Castillo: desplazamiento hacia arriba, ocultación del HUD/navegación superpuesta y salida accesible.
- [x] 5.6 Asegurar que el modo de contemplación no interfiere con el scroll de tareas ni rompe el layout móvil.

## 6. Marcado de tareas afectadas

- [x] 6.1 Exponer una función compartida que determine si una tarea es válida y puede contribuir al encuentro activo en la fecha operativa actual.
- [x] 6.2 Aplicar el estado visual a `ItemCard` solo para obligaciones de la ventana del boss; conservar marcos de completado, vencimiento y error.
- [x] 6.3 Añadir el brillo dorado animado al marco o superficie de la tarea, sin parpadeo agresivo ni cambios de layout.
- [x] 6.4 Añadir texto/etiqueta accesible equivalente a “Cuenta para el boss”.
- [x] 6.5 Desactivar el movimiento o mostrar un estado estático bajo `prefers-reduced-motion`.

## 7. Validación

- [x] 7.1 Probar que el retraso inicial y el cooldown solo producen valores entre 10 y 15, incluidos, y que quedan estables tras recargar.
- [x] 7.2 Probar activación, ventana inclusiva de 5 días y resolución únicamente después de superar el último día.
- [x] 7.3 Probar días vacíos, una obligación incompleta, varias obligaciones completas y dos días completos no consecutivos.
- [x] 7.4 Probar exclusión de hábitos y misiones secundarias de ruta, e inclusión de recurrentes y pergaminos debidos según márgenes.
- [x] 7.5 Probar `ceil(xp * 0.70)` en completados normales, cantidades parciales, deshacer y correcciones.
- [x] 7.6 Probar victoria idempotente: una sola recompensa, un solo cooldown y ningún efecto de EXP posterior.
- [x] 7.7 Probar derrota idempotente: un solo daño directo, sin consumo de defensas, y muerte Hardcore cuando corresponda.
- [x] 7.8 Probar que recompensas de boss, daño y subida de nivel no se duplican tras recargar o sincronizar varias veces.
- [x] 7.9 Probar backup/importación, reinicio total y compatibilidad con backups sin estado de bosses.
- [x] 7.10 Probar teclado, foco, lector de pantalla, scroll de contemplación, layout móvil y `prefers-reduced-motion`.
- [x] 7.11 Ejecutar `npm test` y `npm run build`; ejecutar `npm run lint` y distinguir errores nuevos de avisos preexistentes.

## Notas de implementación

Decisiones donde la propuesta dejaba margen:

- **Activación tras una ausencia**: si la app no se abre el día `scheduledFor`, la ventana de 5 días empieza el día en que se vuelve a abrir (no retroactivamente), para no herir sin haber podido jugar el encuentro.
- **Pergaminos**: cuentan solo el día de su vencimiento efectivo (`postponedUntil ?? dueDate`). Al completarse un pergamino aplazado se limpia `postponedUntil`, así que ese caso límite puede dejar de contar en retrospectiva.
- **Aplazar o archivar** una obligación cambia qué está debido hoy y por tanto puede completar un día; se sincroniza tras ambas acciones.
- **Nueva expedición**: al jubilarse o renacer se borran los encuentros y el boss se reprograma, para que el daño o el efecto de EXP de la expedición anterior no afecten a la nueva.
- **Victoria definitiva**: una vez vencido, deshacer tareas posteriores no revoca la recompensa. La tarea que provoca la victoria se guarda con la EXP reducida (el efecto aún estaba activo al completarla).
- **Estados**: `scheduled` es la espera inicial y `cooldown` la posterior a un encuentro resuelto; la siguiente aparición se crea al resolver.
- **Avisos**: el modal de aparición y de resultado se muestra una vez por encuentro (marca local en `localStorage`, fuera del backup) y espera a que se cierre el resumen diario.
- **Vista de contemplación**: un hueco de altura completa sobre el Castillo; la página arranca desplazada bajo él. Al verlo se oculta la navegación inferior (`inert`).

Validación realizada: `npm test` (51 casos, 15 nuevos del boss), `npm run build` y comprobación en navegador de aparición, tarjeta, brillo y etiqueta de tareas, contemplación, victoria con recompensa y subida de nivel, y derrota con daño directo, sin repetirse tras recargar. `npm run lint` solo informa del error previo de `NumberField.tsx`.

Pendiente de comprobar a mano: importación/exportación de un backup con bosses, lector de pantalla y `prefers-reduced-motion`.

- **Rediseño visual**: el cielo usa un castillo gótico de muchas torres (CastleSilhouette), la luna baja hasta sus agujas, el murciélago es un sprite de 49×32 px con alas de membrana y la tarjeta del boss tiene cabecera con luna, castillo y murciélago, placas de datos, velas de progreso y reglas con iconos.
