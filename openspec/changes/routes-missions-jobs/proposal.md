# Cambio: Rutas, misiones y oficios

## Por qué

Las tareas son independientes. Se quieren metas de largo plazo agrupadas por tema (ejercicio, programación, mejora personal) con progreso propio y recompensas, y oficios con pasivas.

## Qué cambia

- **Rutas** temáticas que agrupan tareas existentes. Rutas iniciales:
  - Vampire Hunter: ejercicio. Pasiva: descuento en la tienda.
  - Technomancer: estudiar programación y desarrollar esta app. Pasiva: EXP extra.
  - Castle Within: mejora personal, incluida la psicóloga. Pasiva: vida máxima extra y escudo.
- **Tramos**: cada ruta es una sucesión de tramos. Un tramo se cumple al lograr 20 días buenos dentro de una ventana de 30 días; un día es bueno si se completan al menos N actividades distintas de la ruta. Los tramos posteriores exigen más actividades por día y más días buenos (hasta 25). Si la ventana termina sin lograrlo, el tramo se reinicia sin castigo.
- **Nivel de la pasiva**: cada tramo completado sube un nivel (máximo 5). El primero la desbloquea.
- **Oficios**: solo uno equipado a la vez. Efecto: 10 % en el nivel 1 y +5 % por nivel, hasta 30 %.
  - Vampire Hunter: precios de la tienda (recursos del sistema y recompensas propias) más baratos.
  - Technomancer: más EXP en todas las completaciones.
  - Castle Within: más vida máxima y un escudo que absorbe 1 fallo y se recarga 15 días después de gastarse.
- Las actividades iniciales de cada ruta se crean como misiones secundarias al iniciarla; las tareas vinculadas conservan su tipo.
- Al morir en Hardcore se reinician rutas, oficio y escudo; las estadísticas históricas se conservan.

## Fuera de alcance

- Bosses, tienda y objetos.
- Compartir oficios entre jugadores.
- Mapa y transiciones del mundo.

## Decisiones tomadas

- El progreso se mide por periodos con reglas (días buenos en una ventana), no por EXP acumulada.
- El bono del oficio crece con su nivel: 10 %, 15 %, 20 %, 25 % y 30 %.
- Un solo oficio equipado a la vez.
- El descuento de tienda redondea a favor del jugador (hacia abajo) con un mínimo de 1 moneda.
- El escudo se recarga 15 días después del fallo que absorbió y actúa antes que las congelaciones de racha.

## Pendiente de definir

- Recompensas extra (monedas/EXP) al completar un tramo.
- Qué hacer cuando una ruta llega al nivel 5 (por ejemplo, tramos de mantenimiento).
- Aviso o celebración al subir de nivel una pasiva.
- Edición y archivado de actividades de ruta desde la interfaz.

## Impacto

- Nuevo estado de rutas, oficio equipado y escudo en el perfil del jugador (sin nueva versión de la base de datos).
- `Item` necesita referencia a ruta.
- El cálculo de EXP aplica el bono del oficio equipado.
- Backup: sin cambios de formato.
- Depende de `tasks-calendar-recurrence` para fechas de inicio y apariciones.
