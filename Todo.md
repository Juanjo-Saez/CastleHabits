- Distribuir las tareas por responsabilidades (fregar, limpiar, etc) que si no se cumplen pierdes vida. Misiones secundarias (100 sentadillas, leer, etc) que dan dinero y exp pero no son obligatorias. 

- Hacer Lineas de Quest, o misiones completas estilo "Ponerme en forma" y que sea hacer mínimo 3 de las 5 opciones de ejercicio durante 1 mes seguido (permitiendo ciertos fallos). Así se pueden anidar ciertos habitos a ramas de misión. Incluso que desbloquee cuando subas de nivel en esa rama misiones más difíciles (rollo si haces 100 abdominales durante 5 días que evolucione a 150)

- Introducir secciones como si fuera un mapa en el que me muevo, y que en cada zona, el castillo, la forja, etc, haya un personaje que me habla y tiene dialogos aleatorios.

- Poner que cuando me muevo de un sitio a otro sale el mapa del Castlevania IV

- Modo Hardcore, si tu vida llega a 0, tu personaje "muere" y tienes que empezar de nuevo con otro de nivel 1, quizá que pueda heredar un trait o algo (Investigar idea de traits)

- Investigar opción de promocionar, como en los incremental, para que haya algo de "Endgame"

- Jobs, hacer posibles rutas que te den un oficio con una pasiva, por ejemplo, quiero aprender a programar mejor, hago una ruta de oficio tecnología, y en esa tengo tareas como 1 hora de cursos de programación al día, o 2 horas a la semana o cualquier cosa relacionada. Si lo cumplo durante X días y algún otro requisito, obtengo ese trabajo, y cada vez que haga una tarea relacionada con la tecnología ganaré un 10% más de experiencia mientras tenga ese job equipado

- Peleas con bosses, que quizá aparezcan tras realizar ciertas cosas, y no tengo claro cómo funcionarían, estaría bien que durante un tiempo te afectara mientras debes completar tareas, otras puede ser que te haga algún tipo de quizz, he pensado que estaría bien que te pregunte sobre lo que has estado realizando, teniendo estadísticas de cuantas veces has fallado una tarea, etc. Otra idea son bosses que ocurren si pasan ciertas cosas, si tareas de limpieza o sacar la basura las pospones varias veces puede aparecerte un encuentro con sukamon o algo en plan basurilla

- Cuando haya jugadores y amistades, igual darle tu job a otra gente ayudandoles en su mundo, no lo se.

- Que aparezca Bahamut y Squall

[14:58, 4/10/2026] Juanjo: Cambiar el formato de vision de tareas, quiero que se vea en distanta seccion las puntuales de las recurrentes.

Que se vean las tareas que tienes asignadas para hoy, no todas (en recurrentes, en puntuales igual sí está bien saber que debes hacerlo viendo cuando caduca, quiza que se vea en plan dias restantes:10, en lugar de vence el 10/10)

View de calendario mensual, así ves las tareas que vas a tener cada dia, Quizá poniendo velas pequeñas hasta que seab mas de 6 y ya sea una imagen de vela x7.

Al crear tarea recurrente poder poner cuándo entra en efecto, porque si ahora empiezo a crear tareas me sale que tengo que completarlas hoyy si no pierdo vida
[14:59, 4/10/2026] Juanjo: Poder poner tareas con mas tiempo, en plan, limpiar la nevera por dentro, cada dos meses, ahora mismo solo puedo poner el día x del mes (igual que si quiero poner una tarea que sea el dia 15 de cada mes, pero estamos a 12, igual poder poner que no entre en vigencia hasta el siguiente mes)
[15:00, 4/10/2026] Juanjo: Cambiar el diseño de Frecuencia. Me parece muy feo la forma en la que sale y las opciones son poco intuitivas, darle una huelta
[15:01, 4/10/2026] Juanjo: Quizá ponerlo tambien con botones de dia, semana, mes. No se, pero no me gusta como está
[15:02, 4/10/2026] Juanjo: Filtros de ordenación,  por dificultad el default
[15:03, 4/10/2026] Juanjo: Poner ya las rutas, quiero poder empezar la misión de Cazavampiros y que sea hacer ejercico, o la de Tecnomancer y que sea estudiar programación y desarrollar esta app, etc
[15:14, 4/10/2026] Juanjo: Que en el mapa de Constancia pueda clicar en el día para ver qué tareas hice, cuanta experiencia gane, dinero, etc.
[15:18, 4/10/2026] Juanjo: He pensadl también en poder ir desarrollando poderes y obteniendo objetos de los bosses con los que se lucha. De alguna manera poder inspeccionar objetos y que tengan misiones ocultas asociadas (una bola de adivinación que si la inspeccionas 10 veces te desbloquea algo). También objetos en plan cofres, que puedan dar dinero, pociones, defensa de racha, etc. Otra cosa serían maldiciones, bosses que no sean de lucha inmediata y preguntas, si no de efecto de zona y que mientras el boss está activo fallar una tarea suponga el doble de daño, otro que completarla te de menos experiencia, y que para superar al boss haya que hacer x tareas, o una tarea en concreto varios dias consecutivos.

También podrían ser bosses que cuando pierdes contra ellos te maldicen y mientras estes maldito ganes la mitad de oro o cosas así,  y para quitarte la maldicion necesites gastar mucho dinero en una sacerdotisa o algo
[15:19, 4/10/2026] Juanjo: Rediseñar catalago de objetos y tienda
[19:05, 4/10/2026] Juanjo: Ruta de mejora personal donde poner lo de la psicologa

- Poner una muestra en rojo de tarea fallada el día anterior o algo, y puede que racha negativa

## Estadísticas internas y bosses

- Registrar eventos históricos por tarea en IndexedDB, sin mostrarlos todavía en la interfaz.
- Cada evento conserva `itemId`, título de la tarea en ese momento, tipo, compromiso, fecha prevista y fecha real.
- Estados registrados: completada, fallida por superar la fecha límite, recuperación tardía, progreso parcial, deshecha y pospuesta.
- Una tarea completada tarde cuenta como un fallo y una recuperación; deshacer una completación no cuenta como fallo.
- El progreso cuantitativo se guarda con la cantidad exacta alcanzada. Empezar una tarea cuantitativa y dejarla a medias no cuenta como fallo.
- Los fallos se generan al superar la fecha límite. Las obligaciones recurrentes generan un evento por cada aparición incumplida.
- Las estadísticas globales sobreviven al Hardcore y a la muerte del personaje. El reinicio solo afecta a la progresión de la expedición.
- Las estadísticas permanecerán ocultas hasta desbloquear una reliquia, poder o recompensa que permita consultarlas.
- El agregador interno podrá producir por tarea: completadas, fallos, recuperaciones tardías, progreso parcial, deshacer, posponer, daño, EXP, monedas y fechas de actividad.
- Los bosses podrán consultar estadísticas de obligaciones y misiones secundarias, con ventanas distintas según boss y dificultad: expedición, últimos 7 días, desde el último encuentro o historial completo.
- Preguntas posibles: fallos de una tarea, mejor racha, daño recibido, última recuperación tardía, progreso exacto y tarea más completada.
- La primera partida real comenzará con este esquema de eventos; no se prioriza migrar datos de prueba actuales.
- Añadir sellos de aplazamiento como recurso de la expedición: 1 sello mueve una obligación de hoy a mañana.
- No se permite encadenar aplazamientos sobre la misma aparición. Las tareas cuantitativas conservan el progreso acumulado.
- Paquetes iniciales en tienda: 1 sello por 5 monedas, 3 por 12 y 5 por 18.
- Un aplazamiento antes de vencer evita el fallo; completar en la nueva fecha cuenta como completado normal.
- Los sellos se reinician al morir en Hardcore; futuras reliquias o traits podrán permitir heredar o abaratar sellos.
- Catálogo inicial de recursos del sistema: sellos de aplazamiento, pociones de vigor y congelaciones de racha.
- La poción cuesta 15 monedas, recupera 10 HP y no puede usarse con la vitalidad completa.
- La congelación cuesta 20 monedas y se consume automáticamente al procesar una aparición fallida, evitando daño y aumento de racha.
- Las recompensas personalizadas del usuario siguen separadas de los recursos funcionales del sistema.
- Recursos futuros candidatos: llaves de boss, pergaminos para revelar estadísticas y reliquias con efectos permanentes.

## Hoja de ruta organizada

Esta sección organiza las ideas anteriores sin sustituirlas. El texto original y las notas fechadas se conservan arriba como registro de origen.

### 0. Base de progresión ya implementada

- Separar obligaciones, que pueden causar daño si vencen, de misiones secundarias, que dan EXP y monedas sin penalización por incumplimiento.
- Guardar eventos históricos por tarea y obtener estadísticas internas para futuras consultas, incluyendo uso por bosses.
- Incluir aplazamientos, pociones de vigor y congelaciones de racha como recursos funcionales de la expedición.
- Mantener Hardcore: morir al llegar a 0 HP termina la expedición y el reinicio crea un personaje de nivel 1. Las estadísticas históricas sobreviven.

### 1. Tareas, calendario y recurrencia

- Separar visualmente las tareas puntuales de las recurrentes.
- En recurrentes, mostrar las tareas asignadas para hoy, no todas las tareas futuras. Mantener una vista de calendario para consultar las apariciones de otros días.
- En puntuales, mostrar el tiempo restante en días, además de indicar claramente cuándo vencen.
- Añadir filtros de ordenación; ordenar por dificultad de forma predeterminada.
- Rediseñar el control de frecuencia para que sea intuitivo, con opciones fáciles de distinguir como día, semana y mes.
- Permitir recurrencias espaciadas, por ejemplo cada dos meses, y seleccionar días concretos del mes.
- Permitir definir la fecha de inicio/entrada en vigor de una recurrencia, incluido empezar el mes siguiente aunque el día elegido de este mes aún no haya llegado.
- Evitar que una tarea recurrente recién creada se considere incumplida antes de su fecha de inicio.
- Añadir una vista de calendario mensual que muestre las tareas previstas cada día. Representar hasta seis apariciones con velas pequeñas y agrupar siete o más con un indicador de siete velas.
- Al abrir un día del calendario de Constancia, mostrar las tareas realizadas y las recompensas obtenidas ese día: EXP, monedas y otros datos pertinentes.

### 2. Rutas, misiones y oficios

- Crear rutas temáticas que agrupen hábitos y tareas bajo una meta mayor, por ejemplo Cazavampiros para el ejercicio, Tecnomancer para estudiar programación y desarrollar esta aplicación, y Mejora personal para incluir actividades como las sesiones con la psicóloga.
- Permitir anidar hábitos y tareas en ramas de una ruta.
- Definir misiones de largo plazo mediante objetivos combinados, como completar al menos tres de cinco actividades de ejercicio durante un mes, con una cantidad configurable de fallos permitidos.
- Dar nivel o progreso a cada rama y desbloquear objetivos más difíciles al avanzar; por ejemplo, evolucionar de 100 abdominales durante cinco días a una meta superior.
- Implementar rutas de oficio (Jobs): completar tareas relacionadas durante un periodo y cumplir otros requisitos para obtener el oficio.
- Permitir equipar un oficio y aplicar su pasiva mientras esté equipado; ejemplo inicial: el oficio de tecnología otorga un 10 % más de EXP en tareas relacionadas.

### 3. Mundo, navegación y ambientación

- Crear un mapa con zonas como el castillo y la forja, y permitir desplazarse entre ellas.
- Asociar personajes a las zonas y ofrecerles diálogos aleatorios.
- Mostrar una transición de mapa al viajar entre zonas, inspirada en el mapa de Castlevania IV.
- Incorporar a Bahamut y Squall como personajes o contenido del mundo.

### 4. Catálogo, tienda, objetos y poderes

- Rediseñar la presentación del catálogo de objetos y de la tienda.
- Mantener separadas las recompensas personalizadas de los recursos funcionales del sistema.
- Incorporar objetos obtenidos de bosses y permitir desarrollar poderes asociados a la progresión.
- Permitir inspeccionar objetos y descubrir misiones ocultas; ejemplo: inspeccionar una bola de adivinación diez veces para desbloquear algo.
- Añadir cofres con posibles recompensas como monedas, pociones o defensas de racha.
- Explorar llaves de boss, pergaminos que revelen estadísticas y reliquias con efectos permanentes.

### 5. Bosses, desafíos y maldiciones

- Diseñar encuentros de boss que puedan activarse por hitos, por una combinación de eventos o por repetir una conducta; ejemplo: posponer varias veces tareas de limpieza o sacar la basura puede invocar un boss temático como Sukamon.
- Probar varios formatos de encuentro: efectos activos durante un periodo, objetivos de completar cierto número de tareas, mantener una racha concreta o responder preguntas basadas en el historial real de tareas.
- Usar las estadísticas históricas para preguntas sobre fallos, rachas, daño, recuperaciones tardías, cantidades alcanzadas y tareas más completadas.
- Diseñar bosses de zona cuyos efectos alteren temporalmente las reglas; ejemplos: duplicar el daño de los fallos o reducir la EXP de las tareas completadas.
- Definir cómo se supera cada efecto de zona, por ejemplo completando varias tareas o una tarea específica durante varios días seguidos.
- Explorar consecuencias por perder un encuentro, como recibir una maldición que reduzca a la mitad las monedas obtenidas.
- Permitir eliminar ciertas maldiciones mediante un coste alto, por ejemplo pagando a una sacerdotisa.

### 6. Hardcore y progresión de largo plazo

- Investigar traits heredables al morir y decidir qué parte de la progresión puede conservar un nuevo personaje.
- Definir si algún trait o reliquia permite heredar sellos de aplazamiento o reducir su coste.
- Investigar una mecánica de promoción/prestigio, habitual en juegos incrementales, que dé un objetivo de endgame y recompensas persistentes.
- Determinar cómo encajan promoción, traits, reliquias y estadísticas históricas con el reinicio de una expedición Hardcore.

### 7. Funciones sociales, para más adelante

- Cuando existan jugadores y amistades, explorar compartir o prestar un oficio para ayudar en el mundo de otra persona.
- Definir permisos, duración, beneficios y límites antes de implementar la ayuda entre mundos.

### Decisiones por confirmar

- ¿La primera prioridad después de la base actual es mejorar tareas/calendario o empezar por las rutas Cazavampiros y Tecnomancer?
- ¿Las tareas recurrentes deben aparecer en la lista diaria solo cuando vencen hoy, dejando las futuras exclusivamente en el calendario?
- ¿El calendario debe mostrar exclusivamente carga prevista o también días pasados con el resumen de actividad, EXP y monedas?
- ¿El 10 % de bonificación del oficio es un valor fijo inicial o quieres que dependa del nivel del oficio?
- ¿La promoción debe reiniciar el nivel del personaje, la expedición completa o solo algunas ramas, y qué debería conservar?
- ¿La transición entre zonas debe usar una estética propia inspirada en Castlevania IV, o tienes assets concretos que debamos integrar?