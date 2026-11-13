# Cambio: Onboarding accesible y planes personalizados

**Estado: implementación realizada; quedan comprobaciones manuales de accesibilidad y visuales.**

## Por qué

La aplicación combina seguimiento de actividades con mecánicas de juego y
nombres de fantasía. Una persona nueva puede no saber dónde crear una tarea,
cómo registrar que la ha terminado ni cómo interpretar EXP y monedas. El inicio
debe enseñar ese recorrido principal de forma visual e interactiva sin alterar
los datos reales ni imponer la temática.

## Alcance confirmado

- En una instalación nueva, ofrecer un tutorial guiado con pasos, controles
  resaltados y una demostración interactiva del flujo de crear y completar un
  pergamino.
- Mantener el planificador de hábitos por objetivos como función opcional,
  ofrecida al terminar el tutorial y accesible desde Perfil; no será el
  onboarding automático.
- Permitir elegir hasta tres objetivos prioritarios.
- Crear recomendaciones mediante un catálogo local de actividades y reglas
  deterministas. No se usará IA ni un servicio remoto. La persona podrá editar
  las sugerencias y añadir actividades propias.
- Proponer como máximo tres actividades iniciales. La frecuencia y los días
  sugeridos se podrán revisar y cambiar antes de guardar.
- No guardar un plan persistente: al confirmar, guardar las actividades
  elegidas como misiones secundarias editables. Las respuestas del formulario
  solo se necesitan para construir la propuesta y no se conservan como un
  perfil de objetivos.
- Las actividades generadas serán voluntarias: no causarán daño por fallo, no
  otorgarán pasivas propias ni iniciarán una ruta del sistema de progresión.
  La interfaz explicará esta diferencia antes de confirmar.
- La demostración usará el ejemplo fijo «Leer 10 páginas», con dificultad
  fácil y vencimiento hoy. La persona recorrerá los controles de la demo, que
  imita la interfaz de Tareas.
- La tarea y el estado de finalización vivirán solo en estado temporal de la
  interfaz. El tutorial no escribirá en IndexedDB, no completará tareas reales
  ni concederá EXP o monedas.
- Mostrar una vista previa de EXP, nivel y monedas calculada con las reglas de
  recompensa actuales, identificada como simulación.
- El tutorial se podrá cerrar con confirmación en cualquier paso y reiniciar
  desde Perfil; salir no conservará el avance de la demostración.
- Al terminar, ofrecer crear un pergamino real (abriendo el formulario sin
  enviarlo), preparar un plan de hábitos o volver a la aplicación.
- Mostrar el onboarding automáticamente solo en instalaciones nuevas sin datos
  previos. No interrumpir a perfiles existentes, incluso si todavía no tienen
  actividades. El estado de onboarding se guardará localmente.
- Priorizar nombres funcionales en navegación, estancias, rutas y flujos
  principales; el lore será secundario u opcional. Los nombres visibles podrán
  cambiar, pero se conservarán los identificadores internos de rutas y datos
  existentes.
- Aplicar criterios de accesibilidad al onboarding y a las superficies que se
  modifiquen: claridad del texto, contraste, teclado y foco visible, lectores
  de pantalla, movimiento reducido y que la información no dependa solo del
  color.

## Flujo implementado

1. **Empezar:** explicar que el recorrido es una demostración aislada.
2. **Encontrar Tareas:** resaltar la navegación de la demo.
3. **Abrir creación:** resaltar «+ Nueva» y elegir «Pergamino».
4. **Añadir:** mostrar «Leer 10 páginas», dificultad fácil y vencimiento hoy;
   la persona pulsa «Añadir».
5. **Completar:** resaltar el control de finalización de la tarjeta de demo.
6. **Ver recompensas:** comparar el HUD anterior y el posterior usando la
   fórmula real, sin persistir ningún cambio.
7. **Elegir siguiente paso:** abrir el formulario real de tarea, preparar un
   plan de hábitos o cerrar.

El tutorial aparece como capa modal sobre la aplicación, la deja inerte y
presenta una interfaz de práctica con controles propios y estado en memoria.
Cada paso enfoca su encabezado y la acción requerida; Escape o «Salir» pide
confirmación. El planificador conserva su propio recorrido y almacenamiento de
actividades confirmadas.

## Requisitos y criterios de aceptación

### Onboarding de primera sesión

- Una instalación nueva puede completar o saltar el onboarding sin perder los
  datos que haya creado.
- Una instalación que ya contiene datos de la versión anterior no recibe el
  onboarding automáticamente.
- Completar o salir del tutorial impide que vuelva a aparecer automáticamente;
  el Perfil mantiene acciones para repetir el tutorial y abrir el planificador.

### Recomendación de actividades

- El formulario ofrece los seis ámbitos confirmados y permite priorizar hasta
  tres.
- El recomendador es local y determinista: la misma selección y disponibilidad
  producen las mismas sugerencias.
- El primer resultado contiene como máximo tres actividades y permite editar
  título, frecuencia y días antes de guardarlo.
- Se pueden añadir actividades propias o descartar cualquier sugerencia.
- Cancelar o salir antes de confirmar no crea actividades.
- Confirmar crea únicamente las actividades elegidas, como misiones
  secundarias, sin asignarlas a una ruta ni modificar el progreso del personaje.
- Las actividades guardadas se pueden editar o archivar con los flujos
  existentes.

### Tutorial y recompensas

- El recorrido permite crear y completar el pergamino de práctica mediante
  controles guiados e interactivos.
- La tarea, la finalización y la vista previa de recompensas no realizan
  escrituras en IndexedDB ni cambian el perfil real.
- La vista previa calcula EXP y monedas con las reglas actuales y aclara que
  no se han concedido.
- Se puede salir desde cualquier paso tras confirmar; el tutorial puede
  reiniciarse desde Perfil.
- Al finalizar se puede abrir el formulario real de pergamino o continuar al
  planificador de hábitos. Ninguno se envía sin una acción explícita.

### Nombres y accesibilidad

- Los textos visibles de navegación, estancias, rutas y flujos afectados usan
  nombres orientados a su función; el lore no es necesario para entender una
  acción.
- Los cambios de nombre no alteran identificadores internos, datos guardados
  ni compatibilidad de copias de seguridad.
- Todo el flujo puede completarse con teclado, mantiene foco visible y expone
  etiquetas, encabezados, estados y errores a tecnologías de asistencia.
- El contenido conserva contraste suficiente, no depende solo del color e
  identifica y respeta `prefers-reduced-motion`.

## Compatibilidad y datos

- Reutilizar la persistencia local existente; no añadir cuentas, API ni
  servicios remotos.
- Guardar el estado del tutorial de forma que las instalaciones antiguas no se
  confundan con una instalación nueva. La base local nueva inicia el estado
  pendiente; un marcador ausente en una base existente se considera antigua.
- Persistir las actividades confirmadas como elementos normales de tipo hábito
  y compromiso secundario, con su recurrencia editable.
- No añadir un identificador de plan ni cambiar el formato de las actividades
  salvo que la implementación lo requiera y se justifique en una nueva revisión
  del alcance.
- Conservar los `RouteId` y todos los datos históricos. Cambiar etiquetas no
  debe migrar ni reiniciar progreso.

## Decisiones de implementación

- El catálogo ofrece una sugerencia editable por ámbito; las propuestas de
  bienestar son actividades cotidianas no médicas. Las recomendaciones son
  deterministas, de dificultad fácil y con registro binario o por cantidad.
- La disponibilidad se elige por días de la semana. Cada sugerencia empieza
  una vez por semana en uno de esos días; si hay más objetivos que días, los
  días se reutilizan. Se puede ajustar la frecuencia y los días antes de
  guardar y posteriormente desde la edición habitual.
- Se priorizan etiquetas funcionales visibles («Hábitos», «Tareas»,
  «Progreso», nombres funcionales de rutas y espacios) y se conservan los
  identificadores históricos.
- El estado de primera ejecución se inicializa como tutorial pendiente solo al
  crear una base local nueva. Los valores pendientes de versiones previas
  también se redirigen al nuevo tutorial; una base preexistente sin marcador se
  clasifica como antigua.
- La demo interactiva mantiene todo su estado en React y nunca llama a los
  flujos de creación o finalización persistentes.
- La implementación mejora foco, etiquetas y estados accesibles y respeta
  movimiento reducido mediante los estilos globales existentes. No se declara
  conformidad WCAG 2.2 AA: las pruebas manuales de lector de pantalla,
  contraste y teclado siguen pendientes.

## Fuera de alcance

- Interpretación de texto libre mediante IA o cualquier servicio remoto.
- Crear un motor de rutas personalizadas con niveles, pasivas, recompensas o
  ventanas de progresión propias.
- Convertir las actividades del plan en obligaciones que causen daño.
- Rediseñar integralmente todas las pantallas o certificar la accesibilidad de
  cada superficie existente no afectada por este cambio.
- Cambiar la economía, las reglas de EXP/vida, los bosses o la progresión de
  las rutas actuales.
