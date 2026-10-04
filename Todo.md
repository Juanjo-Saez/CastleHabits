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