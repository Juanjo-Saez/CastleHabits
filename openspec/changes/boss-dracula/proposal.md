# Cambio: Drácula — el jefe final de tres fases

## Resumen

Implementar el encuentro de Drácula como jefe final de aparición por hitos. Cada
nivel 10, 20 o 30 y cada ruta completada genera un hito único por expedición.
Los hitos acumulados se agrupan en una aparición; si otro boss está activo,
Drácula aparece en cuanto termina, sin un enfriamiento aleatorio.

## Reglas confirmadas

### Hitos, prioridad y revancha

- Se comprueban los niveles 10, 20 y 30 y la finalización de cada ruta
  (alcanzar su último tramo). Cada hito se registra una sola vez por
  expedición, aunque se alcancen varios niveles de golpe.
- Los hitos pendientes se agrupan en una sola aparición. Si hay otro boss
  activo, quedan en cola y Drácula se activa al resolverlo, sin demora
  aleatoria. Drácula no participa en el sorteo normal.
- Tras una derrota, se espera al siguiente hito no consumido. Cuando ya se han
  completado todos los niveles y rutas disponibles, una revancha automática se
  programa en 10–15 días. Si llega un nuevo hito antes, se adelanta la
  aparición y los hitos se agrupan.
- Al jubilarse se reinician los hitos, la cola y la revancha automática.

### Combate

El encuentro dura como máximo 12 días. Cada fase tiene su propia ventana de
cuatro días. Al completar el objetivo antes de que venza esa ventana, la fase
siguiente empieza el día operativo siguiente; una fase fallida al cerrar su
cuarto día acaba el encuentro en derrota.

1. **Humano:** completar todas las obligaciones y pergaminos que vencen en dos
   días completos, consecutivos o no, dentro de los cuatro días. El día cuenta
   si vence al menos una obligación y se cumplen todas. No cuentan hábitos ni
   misiones secundarias.
2. **Murciélago:** cualquier tarea no archivada completada inflige daño. La meta
   se fija al comenzar el encuentro: `clamp(round(carga diaria × 4), 10, 80)`.
   Daño por dificultad: trivial 1, fácil 2, media 3, difícil 5; como en los
   demás bosses, una tarea solo golpea una vez por día.
3. **Demonio:** superar cuatro días sin fallos de obligaciones ni pergaminos.
   Los fallos protegidos también cuentan como fallos; se excluyen hábitos y
   misiones secundarias.

Las fases superadas se conservan en el registro del encuentro. El progreso se
deriva de completados y eventos reales, no de contadores manuales.

### Entorno, derrota y revancha

- **Noche eterna:** el daño por fallo se multiplica por 1,5 mientras Drácula
  está activo. El eclipse aplica además su multiplicador ×2 cuando coincide.
- **Marca de Drácula:** al perder, reduce la vida máxima efectiva un 10 %. No
  se acumula y permanece hasta vencer a Drácula en una revancha. La jubilación
  reinicia la Marca.
- El encuentro no añade daño directo al perder: la consecuencia es la Marca.

### Recompensas

- Victoria: 400 EXP y 200 monedas base, sujetos a los multiplicadores
  existentes. No hay consumibles regulares.
- La primera victoria concede **Corona de la noche**, insignia permanente,
  visible en Perfil y no equipable. Solo se concede una vez y sobrevive a la
  jubilación.
- Cada victoria tiene un 2 % de probabilidad base de obtener el alma de
  Drácula, con el sistema de piedad existente. Es coleccionable y no tiene
  pasiva por ahora.
- La versión élite queda fuera de este change y se reserva para
  `boss-premios-elite`.

### Arte

- **Humano:** usar el nuevo diseño `dracula human`, retirando el fondo morado y
  la firma inferior antes de mostrarlo. Este diseño sustituye al recorte
  anterior de Dracula Body.
- **Murciélago:** Dracula Bat se muestra tal cual.
- **Demonio:** se recortan el demonio y la bola de fuego de Dracula Demon; se
  retiran el fondo fotográfico y la tarjeta impresa. El original se conserva.
- Los originales de `art/references/` se conservan sin modificar; los recursos
  listos para mostrar se guardan en `public/images/`.

## Alcance técnico

- Añadir Drácula al catálogo de bosses, al alma coleccionable y al catálogo de
  maldiciones graves.
- Persistir hitos consumidos, una cola de aparición agrupada, fechas y progreso
  de fase, el registro de fases superadas y las fechas de revancha automática.
- Limpiar la cola y el estado de revancha al renacer, manteniendo la insignia
  permanente y el bestiario.
- Mostrar el arte, fase y progreso en la tarjeta y el diálogo del boss, la
  Corona en Perfil y las reglas/recompensas en el Bestiario.
- Actualizar `boss-roster` y `Todo.md`; probar hitos, cola, transiciones,
  fallos, Marca, revancha, recompensas e idempotencia.
