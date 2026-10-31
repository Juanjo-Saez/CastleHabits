# Cambio: Evolución de rutas, ramas y recompensas

**Estado: borrador de diseño; no implementar hasta validar los puntos abiertos.**

## Por qué

Las tres rutas actuales ya tienen misiones iniciales, progreso por tramos y
oficios equipables. El siguiente paso es añadir objetivos opcionales paralelos,
misiones anidadas y recompensas de hitos sin cambiar el comportamiento que ya
tienen los perfiles.

## Alcance confirmado

- Conservar Vampire Hunter, Technomancer y Castle Within con sus nombres,
  actividades iniciales, reglas de tramo y pasivas actuales.
- Añadir una rama opcional nueva para cada ruta actual. Las ramas progresan en
  paralelo; completar una no cierra las demás.
- Mantener las actividades existentes vinculadas a la ruta, sin duplicarlas al
  crear o desbloquear ramas.
- Diseñar objetivos combinados y objetivos que puedan cambiar entre etapas.
- Diseñar rutas bloqueadas/secretas y su descubrimiento.
- Diseñar recompensas de rama, progreso después del nivel máximo, avisos de
  mejora y gestión de actividades de ruta.
- No incluir por ahora EXP, oro ni consumibles existentes como premios de
  hitos; esos canales se revisaron y no se seleccionaron para esta propuesta.
- Registrar cada premio de hito una sola vez por expedición. Las correcciones o
  el archivado posterior no retiran premios ya concedidos.

## Propuesta inicial para revisar

### Ramas candidatas

Los temas y actividades siguientes son ideas, no contenido aprobado. Deben
adaptarse a los hábitos que el usuario realmente quiera registrar.

| Ruta base | Rama candidata | Posibles actividades |
|---|---|---|
| Vampire Hunter | Resistencia y recuperación | Caminata o cardio alternativo a «Correr», calentamiento y recuperación/movilidad. |
| Technomancer | Aprendizaje aplicado | Practicar un concepto con un ejercicio pequeño, documentar lo aprendido y probar una solución fuera de la tarea diaria «Trabajar en Hábitos». |
| Castle Within | Cuidado cotidiano | Pausa consciente, preparar un entorno que facilite el descanso y una actividad personal restauradora elegida por el usuario. No sustituye ni prescribe la atención profesional. |

Las misiones de rama deben ser editables y archivables desde la interfaz, sin
modificar las actividades originales de las rutas.

### Objetivo semanal combinado

Propuesta para la primera etapa de cada rama:

- Una ventana fija de siete días comienza al iniciar la etapa; las ventanas no
  se solapan.
- Un día válido requiere completar **3 de 5 actividades distintas** de esa
  rama.
- Se necesitan **5 días válidos de los 7**; se permiten dos días fallidos.
- Si no se alcanza el objetivo, la etapa se repite en la siguiente ventana de
  siete días, sin daño ni pérdida de progreso de las otras ramas.
- Las etapas posteriores declaran sus propios umbrales de forma explícita. No
  suben automáticamente por una fórmula oculta; cualquier aumento debe estar
  definido y mostrado antes de que empiece la etapa.

Queda por confirmar si «5 actividades» es un conjunto fijo por etapa, un
conjunto editable o el número de actividades activas que haya elegido el
usuario. También queda por definir cómo una actividad cuantitativa alcanza el
criterio de completado y si se permite que una actividad contribuya a más de
una rama.

### Ruta secreta candidata

Como ejemplo de descubrimiento determinista y sin depender de un boss, se
propone una ruta de trabajo llamada provisionalmente **Guardián del Equilibrio**,
descubierta al completar la primera etapa de una rama de cada una de las tres
rutas actuales. Antes de descubrirla, la interfaz solo mostraría un indicador
oculto; al descubrirla, revelaría su nombre, objetivos y recompensas.

El nombre, las actividades, los requisitos definitivos y si debe ser una ruta
superior o una rama secreta siguen pendientes de aprobación.

### Recompensas

Los canales actuales que pueden afectar el balance son:

- Las actividades dan EXP y monedas por dificultad; las pasivas pueden
  aumentar EXP o reducir precios.
- Las rutas actuales conceden pasivas de tienda, EXP, vida máxima y escudo.
- El oro se usa en aplazamientos, pociones, congelaciones, objetos especiales
  y recompensas personales configuradas por el usuario.
- Los bosses conceden EXP, monedas, recursos, almas y reliquias; los logros dan
  monedas. Los títulos y cosméticos están en el change pendiente de premios de
  bosses.

Opciones solicitadas para explorar en los hitos:

1. **Desbloquear ramas o misiones:** premio estructural, sin inflación de
   monedas. Cada desbloqueo debe tener una clave estable para no duplicarse.
2. **Títulos y cosméticos:** compartir el catálogo/identidad con bosses en vez
   de crear otro sistema independiente. Definir el comportamiento si el change
   de bosses aún no está implementado.
3. **Recompensas personalizadas:** decidir si un hito desbloquea una entrada de
   la tienda personal, la concede gratis una vez o aplica otra regla. El modelo
   actual de recompensas personales solo guarda nombre y coste.
4. **Pasivas o mejoras permanentes:** conservar intactas las pasivas actuales.
   Como opción segura, las nuevas mejoras serían elecciones alternativas y no
   bonificaciones acumulativas; hay que diseñar su equipamiento y límites antes
   de implementarlas.

Se recomienda un registro de concesiones con clave de expedición, rama, etapa y
premio. Debe impedir duplicados al reintentar, cargar backups o recalcular
progreso tras una corrección. Los premios concedidos se conservan aunque el
progreso que los originó se corrija posteriormente.

### Nivel máximo

Al alcanzar el nivel 5 de una ruta actual, su nivel y pasiva existente se
conservan sin cambios. Las nuevas ramas pueden continuar con etapas de
maestría/reconocimiento, pero no deben incrementar automáticamente la pasiva
actual. Las recompensas de esas etapas deben limitarse a opciones aprobadas
(por ejemplo, cosméticos, títulos, nuevas misiones o mejoras equipables).

## Compatibilidad y superficies afectadas

- Mantener legibles los campos actuales `routes`, `equippedRoute` y
  `Item.routeId`; añadir identificadores estables para ramas/etapas sin
  reinterpretar el progreso histórico.
- Incluir el nuevo estado en normalización de perfiles y backups sin perder
  información de perfiles antiguos.
- Mantener deterministas el evaluador de progreso, las correcciones de días y
  el resumen diario.
- Actualizar el panel de rutas, los selectores de tareas, la edición/archivo y
  las pantallas de descubrimiento sin revelar rutas secretas antes de tiempo.
- Definir el efecto temporal del archivado. Actualmente el archivado solo guarda
  `archived: true` y los cálculos de ruta incluyen las actividades archivadas;
  excluirlas solo a futuro requiere conservar cuándo se archivaron.
- Añadir pruebas permanentes para ventanas, umbrales, ramas paralelas,
  descubrimiento, archivado, correcciones, premios idempotentes y backups.

## Decisiones pendientes antes de implementar

1. Aprobar o cambiar los nombres y actividades candidatas de las tres ramas.
2. Confirmar si las cinco actividades son fijas o configurables, y si una tarea
   puede contar para varias ramas.
3. Aprobar el objetivo semanal y decidir qué ocurre con las ventanas empezadas
   si se edita o archiva una actividad.
4. Decidir si Guardián del Equilibrio será una ruta nueva o una rama secreta, y
   aprobar sus requisitos y contenido.
5. Especificar cómo se obtienen/usan títulos, cosméticos y recompensas
   personalizadas.
6. Definir el modelo de equipamiento y los límites de las nuevas pasivas.
7. Definir etapas de maestría después del nivel máximo y sus recompensas.

## Fuera de alcance de este borrador

- Cambiar los objetivos, niveles, pasivas, actividades iniciales o progreso de
  las tres rutas actuales.
- Conceder EXP, oro o consumibles como recompensa de hitos.
- Rebalancear la tienda, los bosses o los logros.
- Compartir progreso entre jugadores.
