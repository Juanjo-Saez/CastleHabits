# Hoja de ruta de Hábitos

Estado revisado el 30 de octubre de 2026. Este documento refleja el punto actual de la app: lo marcado como implementado describe la base existente; el resto es trabajo pendiente o ideas por decidir.

## Ya implementado

### Tareas y calendario

- [x] Separar obligaciones recurrentes del Castillo, tareas puntuales y misiones secundarias/hábitos.
- [x] Mostrar solo las obligaciones recurrentes que vencen hoy. Las tareas puntuales pendientes muestran su fecha límite y los días restantes.
- [x] Configurar recurrencias diarias, semanales o mensuales, con intervalos, días concretos y último día del mes.
- [x] Usar zonas fijas con nombres góticos y mostrar sus equivalencias domésticas desde el icono de información.
- [x] Migrar los nombres antiguos de las estancias al nuevo catálogo de zonas sin perder las tareas existentes.
- [x] Definir cuándo empieza una recurrencia, incluyendo mañana o el mes siguiente; las apariciones anteriores al inicio no generan fallos.
- [x] Ordenar por dificultad de forma predeterminada y también por vencimiento o estancia en el Castillo.
- [x] Base del calendario mensual: consultar carga prevista y actividad pasada, y abrir el detalle del día para ver tareas, EXP y monedas, con celdas cuadradas uniformes y velas de tamaño estable.
- [x] Abrir el detalle de un día desde el mapa de Constancia.
- [x] Consultar el archivo de tareas desde Crónicas, con filtros de frecuencia y estancia, y opción para ocultar tareas vinculadas a rutas.
- [x] Al jubilarse o renacer, archivar las misiones vinculadas a rutas con su historial y crear fichas nuevas al iniciar la siguiente expedición.
- [x] Evitar que las misiones vinculadas a rutas se dupliquen al jubilarse o iniciar una nueva expedición.
- [x] Generar y publicar iconos PWA de 192 y 512 píxeles junto con el icono de la aplicación.

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

- [x] Añadir un archivo consultable de tareas activas y archivadas con frecuencia, próxima fecha, configuración y completados desplegables; filtrar por frecuencia.
- [x] Guardar en IndexedDB eventos de completado, fallo por vencimiento, recuperación tardía, progreso parcial, deshacer y aplazamiento.
- [x] Conservar el título y los datos relevantes de la tarea en cada evento; guardar la cantidad exacta alcanzada en tareas cuantitativas.
- [x] Incluir los eventos en las copias de seguridad.

## Fixes pendientes

### 1. Obligaciones con margen y completado

- [x] Si una obligación con margen se completa en cualquier día de su ventana, dejar de mostrar el resto de días de la ventana como completados o pendientes; la tarea sale de la lista diaria hasta su siguiente aparición pendiente. Ejemplo: peinar a la gata los martes y sábados, y que una vez completada no siga apareciendo.

### 2. Cambio de día a las 2:00

- [x] Cambiar el corte del día de las 00:00 a las 02:00, para que los registros hechos de madrugada cuenten como del día anterior.
- [x] Evaluar los fallos por vencimiento con ese mismo corte, para que una tarea no se marque como incumplida antes de las 02:00.
- [x] Aplicar el corte de forma uniforme a la lista diaria, al calendario, a las rachas, a los eventos guardados y a las notificaciones.

### 3. Vista de mañana en el Castillo

- [x] Añadir una sección en el Castillo, después de recordatorios, que muestre las tareas programadas para el día siguiente.
- [x] Presentarlas de forma visual para revisar lo que se está organizando para el día siguiente.

### 4. Tarjetas de recordatorios

- [x] Rediseñar las tarjetas de recordatorios para que el botón eliminar y el botón crear tarea no ocupen toda la caja. La tarea debe verse con claridad, en primer plano.

### 5. Fecha de fin por defecto en tareas puntuales

- [x] Al elegir una fecha de inicio, la fecha de vencimiento la sigue por defecto en lugar de quedarse en hoy, evitando el error de "no puede finalizar antes de empezar". El selector de vencimiento tampoco admite fechas anteriores al inicio.

## Pendiente: siguiente etapa

### 1. Mejoras de interfaz y gestión de tareas

- [x] En la vista del Cazador, ocultar el efecto mecánico de cada pasiva y mostrar solo un nombre sugerente; la recompensa bloqueada no se revela antes de desbloquearla.
- [x] En Hábitos, agrupar las actividades bajo su ruta visible, mantener el orden por dificultad y mostrar los grupos plegados inicialmente; las misiones sin ruta aparecen en “Hábitos”.
- [x] Mantener celdas cuadradas de tamaño uniforme en el calendario y reservar espacio para seis velas pequeñas del mismo tamaño.
- [x] Cuando hay más de seis apariciones, mostrar por separado velas encendidas con el número de tareas cumplidas y velas apagadas con el número pendiente.
- [x] Abrir el detalle de una tarea desde su título y permitir editar sus campos o iniciar su eliminación.
- [x] Confirmar la eliminación archivando la tarea en lugar de borrar su registro; sus eventos, completados e historial se conservan.
- [x] En el Castillo, añadir una parada intermedia al desplazarse hacia arriba desde las tareas para que la inercia no atraviese directamente la escena hasta el cielo despejado. Desde esa parada se podrá seguir desplazando hacia arriba para contemplar el cielo; conservar también el botón para volver a las tareas.
- [ ] Validar el gesto con scroll táctil e inercia en los móviles objetivo.

### 2. Cerrar la base de historial y mostrar fallos recientes

- [x] Completar el registro de eventos de incumplimiento: hoy un escudo/congelación puede evitar el daño sin dejar el evento de fallo correspondiente.
- [x] Conectar el agregador de estadísticas por tarea con los eventos guardados. Debe poder obtener completados, fallos, recuperaciones tardías, progreso parcial, deshacer, aplazamientos, daño, EXP, monedas y fechas de actividad.
- [x] Añadir una señal visible para obligaciones falladas recientemente, en particular las recurrentes del día anterior; evaluar una racha negativa sin confundirla con las rachas positivas existentes.
- [ ] Ocultar las estadísticas históricas hasta que una recompensa o poder permita consultarlas. Por ahora permanecen visibles en Crónicas; el bloqueo se añadirá al diseñar poderes.

### 3. Primer encuentro con boss

- [x] Diseñar e implementar un boss inicial que use eventos reales y tenga una condición clara de activación, progreso, victoria y derrota.
- [x] **Diseño acordado para el boss inicial (murciélago gigante):**
  - [x] Activarlo automáticamente tras un intervalo aleatorio de entre 10 y 15 días desde el inicio del punto de referencia.
  - [x] Mantenerlo activo durante un máximo de 5 días operativos.
  - [x] Contabilizar los días en los que se completan todas las obligaciones debidas; no tienen que ser consecutivos.
  - [x] Vencerlo inmediatamente al alcanzar 2 días completos, aunque todavía queden días de la ventana.
  - [x] Si termina la ventana sin alcanzar 2 días completos, infligir 20 puntos de daño.
  - [x] Mientras esté activo, reducir en un 30% la EXP obtenida.
  - [x] Al vencerlo, conceder EXP, oro y un recurso consumible aleatorio.
  - [x] Tras finalizar, entrar en un enfriamiento aleatorio de entre 10 y 15 días antes de poder reaparecer.
  - [x] Mostrar un modal al entrar en el Castillo y una tarjeta persistente mientras esté activo.
  - [x] Modificar visualmente el Castillo para mostrar al boss sobre la luna.
  - [x] Permitir desplazar la vista del Castillo hacia arriba en un modo de contemplación que oculte el HUD y permita ver la escena completa sin elementos del interfaz sobre el castillo.
  - [x] Marcar visualmente las tareas que contribuyen al encuentro activo con un brillo animado y sutil, similar a un reflejo de luz recorriendo una superficie dorada.
  - [x] Hacer interactivo el boss situado sobre la luna: al pulsarlo, abrir una tarjeta con su nombre, efecto activo, progreso, condiciones de victoria y derrota, duración restante y recompensas.
  - [x] Empezar a contar el primer intervalo desde la publicación de la funcionalidad.
  - [x] Considerar como obligaciones válidas las tareas recurrentes y los pergaminos con vencimiento ese día; excluir las misiones secundarias vinculadas a rutas.
  - [x] Un día válido requiere al menos una obligación debida y todas deben estar completadas; los días sin obligaciones no cuentan.
  - [x] Conceder 100 EXP, 50 monedas y un consumible aleatorio entre sello de aplazamiento, poción de vigor y congelación de racha.
  - [x] Aplicar durante el encuentro el 70% de la EXP obtenida y redondear hacia arriba.
  - [x] Aplicar los 20 puntos de derrota como daño directo, sin defensas.
  - [x] Permitir que el boss reaparezca indefinidamente después de cada enfriamiento.
- [x] Empezar con un formato acotado y basado en eventos reales: completar todas las obligaciones durante 2 días dentro de una ventana de 5 días.
- [ ] Definir qué ventanas de estadísticas puede consultar cada encuentro: el boss inicial contará desde el inicio de su propio punto de referencia; los futuros podrán usar expedición, últimos siete días, desde el encuentro anterior o historial completo.
- [x] Diseñar el plantel de bosses, los efectos de entorno, las maldiciones, los premios y el bestiario (ver `openspec/changes/boss-roster/proposal.md`).
- [x] **Motor general de bosses** (fase 2): objetivos de constancia y golpes, efectos de entorno, maldiciones y tabla de premios por boss. Faltan los objetivos de robo de vida, piezas, enjambre, estatuas, cabezas, duelo, reloj y fases.
  - [x] Dejar de borrar los encuentros resueltos al jubilarse, para conservar el bestiario y las almas.
  - [x] Sustituir el recurso único al azar del Murciélago por el sorteo independiente por objeto.
  - [x] Calcular las metas con la carga real del jugador, sin contar tareas nuevas.
- [ ] **Aparición mixta** (sorteo ponderado y gancho de disparadores hechos; faltan los disparadores de cada boss): sorteo ponderado tras cada enfriamiento, disparadores reactivos (aplazamientos, fallos, rachas, zona abandonada, misiones secundarias olvidadas) y jefes finales por hito.
- [ ] **Bosses** (uno por cambio; Slogra, Gaibon, Legion, Frankenstein, Succubus y Death ya están hechos): Medusa, Cerbero, Doppelgänger, Hidra/Escila, Sukamon y Drácula.
- [ ] **Efectos de entorno** (hechos: pesadez de EXP y pociones a medias): luna de sangre, eclipse, avaricia, silencio, tormenta, mirada, sangre rancia, niebla, zona maldita, bendición lunar y espejo.
- [ ] **Maldiciones**: leves que caducan (hechas, con sacerdotisa y agua bendita) y graves que se curan con penitencia o revancha; máximo dos a la vez.
- [ ] **Premios**: agua bendita, látigo y bolsa de oro; almas con probabilidad baja, piedad y rangos; reliquias; títulos, marcos y auras.
- [ ] **Almas equipables** persistentes entre expediciones, con casillas según el nivel (1, 2 y 3 en los niveles 5, 10 y 20). Las reliquias se reinician al jubilarse.
- [x] **Bestiario**: silueta sin victorias; página y recompensas con 1; probabilidades de consumibles con 5; versión élite y lore con 10; probabilidad del alma con 20.
- [ ] **Versión élite** de cada boss tras 10 victorias, con 1/10 de probabilidad de aparecer en cada encuentro.
- [x] Decidir las preguntas abiertas del diseño: las almas y el bestiario persisten y las reliquias no, la apuesta de Death se pierde de verdad, la versión élite es opcional con 1/10 de probabilidad por aparición y el minijefe de aplazamientos es el Sukamon de Digimon.

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

### 6. Corregir los registros de hoy y ayer

- [x] Permitir registrar y corregir actividades de hoy y ayer; bloquear la edición de días anteriores. Respetar el cambio de día a las 02:00 para determinar qué día es hoy y cuál es ayer.
- [x] Incluir obligaciones, hábitos y misiones secundarias: marcar como hecho lo que se realizó ese día pero se olvidó registrar, corregir cantidades y desmarcar completados apuntados por error.
- [x] Ofrecer acceso desde el detalle del día en el calendario, con botones para abrir ayer u hoy, y desde el panel de fallos recientes del Castillo.
- [x] Añadir también el acceso desde el resumen diario cuando se implemente ese resumen.
- [x] Tratar la corrección como un registro del día elegido, no como una recuperación realizada hoy fuera de plazo. Ajustar EXP, oro, vida, rachas y progreso de rutas sin duplicar recompensas ni penalizaciones. Si la actividad ya estaba fuera de plazo en el día elegido, sigue siendo una recuperación tardía.
- [x] Conservar los niveles del personaje ya alcanzados al desmarcar y restar solo la EXP disponible. Bloquear la corrección si requiere retirar oro ya gastado e indicar cuánto falta.
- [x] Devolver el daño injustificado por actividades que sí se hicieron ayer y recalcular las consecuencias al corregir cantidades o desmarcar actividades. Reasignar o devolver escudos y congelaciones usados en los fallos de ayer; si una congelación devuelta ya se gastó, bloquear el ajuste que necesita consumirla otra vez.
- [x] En tareas con margen, editar el total de la aparición desde el día de su registro, sin duplicarlo en otro día ni permitir corregir registros anteriores a ayer.
- [x] Mantener la muerte de Hardcore irreversible: bloquear la edición de registros de expediciones terminadas, también si terminaron ayer. Una corrección no resucita al personaje ni transfiere efectos o recompensas de una expedición anterior a la nueva. Si una corrección provoca una nueva muerte, pedir confirmación antes de guardar.
- [x] Guardar el inicio de nuevas expediciones y pedir confirmación antes de habilitar correcciones en perfiles antiguos que no tienen ese dato; no borrar sus datos.
- [x] Conservar la coherencia entre los registros corregidos, los eventos de historial, el calendario y las estadísticas. Guardar completados, eventos, recursos y cambios de aplazamiento en una única transacción; las copias de seguridad conservan los nuevos datos del perfil.

### 7. Resumen diario animado y celebración de nivel

- [x] Mostrar automáticamente el resumen de ayer al entrar por primera vez cada día, respetando el corte de las 02:00. Si se estuvo varios días sin entrar, mostrar solo ayer, sin encadenar resúmenes de los días anteriores.
- [x] Incluir actividades realizadas y pendientes, EXP y oro ganados, vida perdida y obligaciones que causaron el daño, racha, progreso en rutas y nivel alcanzado. Mostrar también pérdidas de EXP u oro si existen esas penalizaciones, sin introducir penalizaciones nuevas.
- [x] Presentar un resumen completo con barras animadas, cambios de los recursos y sonido, manteniendo la ambientación de la app; no limitarlo a un aviso breve.
- [x] Añadir un botón para saltar la animación y un acceso visible para volver a consultar el resumen de ayer y reproducir sus animaciones aunque ya se haya mostrado ese día.
- [x] Tras corregir ayer, recalcular el resumen y mostrar los resultados corregidos al volver a consultarlo, sin marcas ni apartados especiales de edición.
- [x] Ampliar la celebración de subida de nivel existente con una animación más vistosa, mostrando el nivel anterior, el nuevo nivel y las mejoras obtenidas.
- [x] Separar la reproducción de las animaciones de la aplicación de sus efectos: consultar o repetir un resumen no vuelve a conceder EXP, oro, niveles ni daño.

### 8. Hábitos de registro único y señal de fallo recurrente

- [x] En Hábitos, la tarea de trabajar no debe registrarse de 5 en 5 minutos: debe poder marcarse como completada de una vez o registrarse 3 veces.
- [x] Mostrar en rojo una tarea recurrente que falló ayer, igual que los pergaminos fallados.

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

## Próxima fase: recurrencias con margen y recordatorios

Orden de implementación propuesto.

### 1. Corrección del selector de día del mes

- [x] Permitir borrar y reescribir el día del mes en la recurrencia mensual. Hoy el campo usa `Number(valor) || 1`, así que al vaciarlo vuelve a 1 de inmediato y no se pueden elegir días como 20 o 30. Validar 1–31 al salir del campo o al guardar.

### 2. Ventana de margen en obligaciones recurrentes

- [x] Permitir que una obligación recurrente tenga una ventana de realización: aparece al inicio de la ventana y puede completarse hasta su último día sin fallar (por ejemplo, limpiar los cristales una vez al mes con 7 días de margen).
- [x] Mostrar un aviso “¡Último día!” en la tarjeta de la tarea cuando la ventana llega a su último día.
- [x] Penalizar solo si la ventana termina sin completarse; tras cumplirla, la siguiente aparición empieza en su ciclo normal.
- [x] Definir cómo se combina la ventana con la recurrencia actual (intervalo, días concretos, último día del mes) y con los aplazamientos existentes.
- [x] Reflejar la ventana en el calendario y en el detalle de la tarea.

### 3. Recordatorios sin tarea

- [x] Crear recordatorios de posibles tareas que no generan obligaciones ni penalizaciones, por ejemplo “lavar la cafetera” cada mes desde la última vez.
- [x] Al cumplirse el plazo, mostrar el recordatorio en una sección propia, separada de obligaciones y misiones.
- [x] Permitir marcarlo como hecho (reinicia el contador) o descartarlo (lo vuelve a sugerir más adelante sin registrar fallo).
- [x] Avisar con una notificación del navegador de los recordatorios vencidos, reutilizando el sistema de notificaciones existente (una vez al día por recordatorio).

### Después de esta fase

- Cierre de la base de historial y señalización de fallos recientes (sección 2 de la etapa anterior), y después el primer boss.

## Decisiones abiertas

- Resuelto: el margen está disponible en cualquier recurrencia y su máximo es la separación mínima entre apariciones (cada día no admite margen; cada 3 días, hasta 3; mensual, hasta 28).
- Resuelto: los recordatorios son independientes y se marcan a mano.
- Resuelto: marcar un recordatorio como hecho es solo un aviso, sin EXP ni monedas.
- Para el primer boss, ¿prefieres un desafío de tareas durante varios días o una pregunta basada en el historial? Se pueden añadir ambos formatos más adelante.
- Resuelto por ahora: las estadísticas son visibles desde el principio. El bloqueo hasta desbloquear un poder se diseñará junto con los poderes.
- ¿Las rutas de inicio actuales son las adecuadas y qué actividades concretas quieres asociar a cada una? ¿Qué requisitos te gustaría usar para bloquear o esconder rutas?
- ¿Bahamut y Squall deben aparecer literalmente o prefieres personajes originales inspirados en esos arquetipos?
