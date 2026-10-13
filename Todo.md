# Hoja de ruta de Hábitos

Estado revisado el 8 de octubre de 2026. Este documento refleja el punto actual de la app: lo marcado como implementado describe la base existente; el resto es trabajo pendiente o ideas por decidir.

## Ya implementado

### Tareas y calendario

- [x] Separar obligaciones recurrentes del Castillo, tareas puntuales y misiones secundarias/hábitos.
- [x] Mostrar solo las obligaciones recurrentes que vencen hoy. Las tareas puntuales pendientes muestran su fecha límite y los días restantes.
- [x] Configurar recurrencias diarias, semanales o mensuales, con intervalos, días concretos y último día del mes.
- [x] Definir cuándo empieza una recurrencia, incluyendo mañana o el mes siguiente; las apariciones anteriores al inicio no generan fallos.
- [x] Ordenar por dificultad de forma predeterminada y también por vencimiento, estancia o ruta, según la lista.
- [x] Base del calendario mensual: consultar carga prevista y actividad pasada, y abrir el detalle del día para ver tareas, EXP y monedas. La presentación uniforme de las celdas y velas sigue pendiente.
- [x] Abrir el detalle de un día desde el mapa de Constancia.

### Progresión y recursos

- [x] Aplicar daño a las obligaciones incumplidas; las misiones secundarias no causan daño por fallar.
- [x] Añadir sellos de aplazamiento, pociones de vigor y congelaciones de racha a la tienda de recursos del sistema.
- [x] Permitir aplazar una obligación elegible hasta mañana sin encadenar aplazamientos sobre la misma aparición.
- [x] Mantener Hardcore: al llegar a 0 HP termina la expedición y se puede empezar otra desde nivel 1. También se puede jubilar el personaje manualmente desde el perfil. El reinicio de expedición conserva tareas, recompensas e historial global.
- [x] Añadir un reinicio total independiente para borrar los datos locales de prueba y empezar de cero; requiere confirmación y no altera el comportamiento de jubilar.
- [x] Añadir las rutas iniciales Cazavampiros, Tecnomancer y Fortaleza Interior, con actividades vinculadas, progreso por tramos y oficios equipables.
- [x] Desbloquear y equipar una pasiva asociada al oficio.
- [x] Mostrar las rutas disponibles en la vista del Cazador.

### Historial

- [x] Guardar en IndexedDB eventos de completado, fallo por vencimiento, recuperación tardía, progreso parcial, deshacer y aplazamiento.
- [x] Conservar el título y los datos relevantes de la tarea en cada evento; guardar la cantidad exacta alcanzada en tareas cuantitativas.
- [x] Incluir los eventos en las copias de seguridad.

## Pendiente: siguiente etapa

### 1. Mejoras de interfaz y gestión de tareas

- [x] En la vista del Cazador, ocultar el efecto mecánico de cada pasiva y mostrar solo un nombre sugerente; la recompensa bloqueada no se revela antes de desbloquearla.
- [x] En Hábitos, agrupar las actividades bajo su ruta visible y conservar el orden por dificultad dentro de cada grupo; las misiones sin ruta aparecen en “Otras misiones”.
- [x] Mantener celdas cuadradas de tamaño uniforme en el calendario y reservar espacio para seis velas pequeñas del mismo tamaño.
- [x] Cuando hay más de seis apariciones, mostrar por separado velas encendidas con el número de tareas cumplidas y velas apagadas con el número pendiente.
- [x] Abrir el detalle de una tarea desde su título y permitir editar sus campos o iniciar su eliminación.
- [x] Confirmar la eliminación archivando la tarea en lugar de borrar su registro; sus eventos, completados e historial se conservan.

### 2. Cerrar la base de historial y mostrar fallos recientes

- [ ] Completar el registro de eventos de incumplimiento: hoy un escudo/congelación puede evitar el daño sin dejar el evento de fallo correspondiente.
- [ ] Conectar el agregador de estadísticas por tarea con los eventos guardados. Debe poder obtener completados, fallos, recuperaciones tardías, progreso parcial, deshacer, aplazamientos, daño, EXP, monedas y fechas de actividad.
- [ ] Añadir una señal visible para obligaciones falladas recientemente, en particular las recurrentes del día anterior; evaluar una racha negativa sin confundirla con las rachas positivas existentes.
- [ ] Mantener las estadísticas históricas ocultas hasta que una recompensa o poder permita consultarlas, si se conserva esa decisión de diseño.

### 3. Primer encuentro con boss

- [ ] Diseñar e implementar un boss inicial que use eventos reales y tenga una condición clara de activación, progreso, victoria y derrota.
- [ ] Empezar con un formato acotado: por ejemplo, completar un conjunto de tareas durante un periodo o responder una pregunta verificable sobre el historial.
- [ ] Definir qué ventanas de estadísticas puede consultar cada encuentro: expedición, últimos siete días, desde el encuentro anterior o historial completo.
- [ ] Añadir como siguientes variantes los efectos de zona (por ejemplo, daño aumentado o EXP reducida), las maldiciones y una forma de eliminarlas.
- [ ] Explorar encuentros activados por patrones repetidos, como aplazar varias veces tareas de limpieza.

### 4. Ampliar rutas, misiones y oficios

- [ ] Convertir las rutas iniciales en líneas de misiones más flexibles: ramas, tareas anidadas y objetivos combinados, como completar 3 de 5 actividades durante un mes con fallos permitidos.
- [ ] Permitir objetivos que evolucionen al progresar, por ejemplo aumentar una meta de ejercicio tras completar varios tramos.
- [ ] Desarrollar las rutas Cazavampiros, Tecnomancer y Mejora personal con objetivos y actividades concretas; incluir las sesiones con la psicóloga en Mejora personal.
- [ ] Definir mejor cómo se asignan tareas existentes a una ruta y cómo se relaciona la actividad con la obtención de cada oficio.
- [ ] Permitir rutas bloqueadas con requisitos de desbloqueo claros y rutas secretas cuyo requisito o existencia no se revele hasta descubrirlas.
- [ ] En la vista del Cazador, diferenciar visualmente rutas disponibles, bloqueadas y descubiertas secretas; mostrar requisitos solo cuando corresponda sin revelar contenido oculto.

### 5. Catálogo, objetos y poderes

- [ ] Rediseñar la presentación del catálogo y la tienda, conservando la separación entre recursos funcionales y recompensas personalizadas.
- [ ] Añadir objetos obtenidos de bosses, poderes y reliquias con efectos persistentes.
- [ ] Explorar objetos inspeccionables con objetivos ocultos, cofres y recompensas como monedas, pociones o defensas de racha.
- [ ] Valorar llaves de boss y objetos que permitan revelar estadísticas.

## Visión a largo plazo

### Mundo y ambientación

- [ ] Crear un mapa con zonas visitables, como el castillo y la forja, con personajes y diálogos variables.
- [ ] Diseñar una transición entre zonas inspirada en mapas de aventuras clásicos, con arte propio o assets con licencia adecuada.
- [ ] Decidir cómo incorporar a Bahamut y Squall como personajes o referencias dentro del mundo.

### Hardcore y progresión de largo plazo

- [ ] Diseñar traits heredables y decidir qué parte de la progresión puede conservarse tras una muerte.
- [ ] Explorar una mecánica de promoción/prestigio que dé objetivos de endgame y recompensas persistentes.
- [ ] Definir cómo interactúan promoción, traits y reliquias con el reinicio de expedición; el historial global ya sobrevive a la muerte.

### Funciones sociales

- [ ] Cuando existan cuentas, jugadores y amistades, explorar prestar o compartir temporalmente un oficio para ayudar en el mundo de otra persona.
- [ ] Definir permisos, duración, beneficios y límites antes de construir funciones entre jugadores.

## Decisiones abiertas

- ¿Con qué continuamos primero: las mejoras de interfaz y gestión de tareas, cerrar estadísticas y crear el primer boss, o profundizar las misiones ramificadas de las rutas?
- Para las tareas de una ruta en Hábitos, ¿te basta con encabezados/grupos plegables por ruta o quieres además filtros para mostrar una ruta concreta?
- Al eliminar una tarea, ¿debería desaparecer de inmediato aunque tenga historial, o archivarse por defecto dejando una acción explícita de borrado definitivo?
- En el calendario con más de seis apariciones, ¿el contador de velas apagadas debe contar todas las pendientes del día o solo las que aún no se han completado?
- Para el primer boss, ¿prefieres un desafío de tareas durante varios días o una pregunta basada en el historial? Se pueden añadir ambos formatos más adelante.
- ¿Quieres mantener las estadísticas ocultas hasta desbloquear una reliquia/poder, o debería existir una vista básica desde el principio?
- ¿Las rutas de inicio actuales son las adecuadas y qué actividades concretas quieres asociar a cada una? ¿Qué requisitos te gustaría usar para bloquear o esconder rutas?
- ¿Bahamut y Squall deben aparecer literalmente o prefieres personajes originales inspirados en esos arquetipos?