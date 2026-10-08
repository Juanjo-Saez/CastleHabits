# Tareas

## 1. Modelo de datos
- [ ] 1.1 Definir tipos `Route`, `RouteMission` y `Job`.
- [ ] 1.2 Añadir referencia a ruta en `Item`.
- [ ] 1.3 Nueva versión de Dexie con las tablas y migración.
- [ ] 1.4 Actualizar backup (exportar e importar).

## 2. Rutas y misiones
- [ ] 2.1 Crear y editar rutas y asignarles tareas.
- [ ] 2.2 Definir misiones con periodo, actividades requeridas y fallos permitidos.
- [ ] 2.3 Evaluar progreso de la misión a partir de `completions`/`itemEvents`.
- [ ] 2.4 Desbloquear la siguiente misión al superar la anterior.
- [ ] 2.5 Pantalla de rutas con progreso.
- [ ] 2.6 Rutas iniciales: Cazavampiros, Tecnomancer, Mejora personal.

## 3. Oficios
- [ ] 3.1 Definir requisitos para obtener un oficio.
- [ ] 3.2 Nivel del oficio y fórmula del bono.
- [ ] 3.3 Equipar y desequipar oficio.
- [ ] 3.4 Aplicar el bono en la EXP de tareas de la ruta relacionada.

## 4. Validación
- [ ] 4.1 Pruebas de evaluación de misiones (3 de 5, fallos permitidos).
- [ ] 4.2 Pruebas del bono por nivel del oficio.
- [ ] 4.3 `npm run lint` y `npm run build` correctos.
