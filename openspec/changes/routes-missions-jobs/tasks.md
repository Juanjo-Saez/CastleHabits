# Tareas

## 1. Modelo de datos
- [x] 1.1 Tipos `RouteId`, `RouteProgress` y estado de rutas en `PlayerProfile` (nivel y ventana por ruta, oficio equipado, recarga del escudo).
- [x] 1.2 `routeId` en `Item`.
- [x] 1.3 Sin nueva versión de Dexie: el estado vive en el perfil y los perfiles antiguos se normalizan al cargar.
- [x] 1.4 Backup: viaja en `profile` e `items`, sin cambios de formato.

## 2. Rutas y tramos
- [x] 2.1 Definición de rutas con actividades iniciales (`lib/routes.ts`).
- [x] 2.2 Regla de tramo: ventana de 30 días con días buenos (mínimo de actividades distintas por día).
- [x] 2.3 Evaluación determinista: sube de nivel al lograr los días buenos y reinicia la ventana si caduca.
- [x] 2.4 Los tramos posteriores exigen más actividades por día y más días buenos.
- [x] 2.5 Panel de rutas en el perfil con progreso del tramo.
- [x] 2.6 Rutas Vampire Hunter, Technomancer y Castle Within; al iniciarlas crean sus actividades como misiones secundarias.
- [x] 2.7 Selector de ruta en los formularios y orden por ruta.

## 3. Oficios y pasivas
- [x] 3.1 El nivel 1 se desbloquea al completar el primer tramo.
- [x] 3.2 Pasiva: 10 % en nivel 1, +5 % por nivel, tope 30 % (nivel 5).
- [x] 3.3 Equipar y desequipar; solo un oficio activo a la vez.
- [x] 3.4 Vampire Hunter: descuento en recursos del sistema y recompensas propias.
- [x] 3.5 Technomancer: EXP extra en toda completación.
- [x] 3.6 Castle Within: vida máxima extra y escudo que absorbe 1 fallo y se recarga 15 días después de gastarse.
- [x] 3.7 Al morir en Hardcore se reinician rutas, oficio y escudo; las estadísticas históricas se conservan.

## 4. Validación
- [x] 4.1 Comprobaciones con scripts temporales (34 casos): niveles, reinicio de ventana, tope, pasivas y escudo.
- [x] 4.2 Probado en el navegador: iniciar ruta, desbloqueo, equipar y descuento en tienda.
- [x] 4.3 `npm run lint` y `npm run build` correctos.
