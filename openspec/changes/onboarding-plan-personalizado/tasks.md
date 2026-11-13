# Tareas — Onboarding accesible y planes personalizados

## Planificador opcional

- [x] Definir los seis ámbitos, las actividades iniciales, sus tipos de registro y dificultad.
- [x] Implementar el formulario para priorizar hasta tres objetivos y seleccionar días disponibles.
- [x] Implementar recomendaciones locales y deterministas, limitadas a tres actividades.
- [x] Permitir editar, retirar y añadir actividades antes de confirmar.
- [x] Guardar solo la selección confirmada como hábitos voluntarios con recurrencia editable y sin ruta asignada.
- [x] Mantener el planificador accesible desde Perfil y ofrecerlo al terminar el tutorial.

## Tutorial de inicio interactivo

- [x] Sustituir el onboarding automático de objetivos por el tutorial guiado de primer uso.
- [x] Crear la demo interactiva de Tareas: abrir creación, elegir Pergamino, añadir el ejemplo y completarlo.
- [x] Mantener la tarea y su finalización en estado temporal de interfaz, sin llamadas de persistencia.
- [x] Mostrar una vista previa de EXP, nivel y monedas con las reglas actuales, sin modificar el perfil.
- [x] Permitir crear un pergamino real desde la conclusión, abriendo el formulario sin enviarlo.
- [x] Confirmar el abandono en cualquier paso y permitir reiniciar desde Perfil.
- [x] Inicializar solo instalaciones nuevas con el tutorial pendiente y clasificar las bases existentes sin marcador como antiguas.
- [x] Dar foco a cada paso, resaltar controles, limitar el foco al diálogo y respetar `prefers-reduced-motion`.

## Validación

- [x] Añadir una prueba de la vista previa de recompensas, incluida la subida de nivel y la inmutabilidad del perfil de origen.
- [x] Ejecutar `npm test`, `npm run build` y ESLint enfocado.
- [x] Validar en navegador el flujo completo y comprobar que la tarea/recompensa simuladas no aparecen en los datos reales.
- [x] Validar la salida confirmada, repetir el tutorial desde Perfil y abrir el planificador desde ambos puntos.
- [x] Comprobar que «Crear mi primer pergamino» abre el formulario real sin guardar la tarea.
- [ ] Completar el recorrido solo con teclado y validarlo con lector de pantalla y en vistas móvil/escritorio.

El lint global conserva un fallo preexistente en `src/components/NumberField.tsx:27`
(`react-hooks/set-state-in-effect`); no forma parte de este cambio.
