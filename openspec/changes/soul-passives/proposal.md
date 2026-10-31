# Cambio: Pasivas runtime de Almas

## Resumen

Conectar las Almas persistentes con un contrato runtime común. Las Almas solo
producen efectos cuando están equipadas en la expedición actual; su rango se
lee desde la colección persistente y no se duplica ni se convierte en un
contador paralelo.

Esta primera fase define el catálogo tipado y el selector de pasivas equipadas.
Las pasivas que necesitan consumir recursos o registrar hitos diarios se
implementarán sobre este contrato en fases posteriores, cada una con sus
pruebas de idempotencia y corrección de ayer.

## Reglas confirmadas

- Solo las Almas incluidas en `profile.equippedSouls` están activas.
- Al entrar por primera vez en un día operativo se elige el loadout del día,
  después de mostrar el resumen del día anterior si corresponde.
- El loadout elegido queda bloqueado hasta el siguiente corte de las 02:00.
- El rango activo es el rango persistido en `profile.souls`.
- Un Alma no obtenida o una entrada equipable obsoleta no activa ningún efecto.
- La resolución de Almas equipadas es pura y no muta el perfil.
- Los efectos no se aplican retroactivamente a días ya cerrados.
- El loadout fijado se copia al `DaySnapshot` para que una corrección de ayer
  use las Almas de ese día y no las equipadas actualmente.
- El número de casillas sigue dependiendo del nivel de la expedición actual.

## Catálogo inicial

| Alma | Pasiva runtime prevista |
|---|---|
| Murciélago gigante | +5 % de EXP en un día con todas las obligaciones cumplidas |
| Slogra | +5 monedas al cumplir 5 tareas en un día |
| Gaibon | Un aplazamiento gratis por semana |
| Legion | Las tareas triviales dan +1 moneda |
| Frankenstein | La primera tarea de cada zona cada día da +20 % de EXP (rango 1), +30 % (rango 2) o +40 % (rango 3) |
| Succubus | La primera poción del día cura el doble (rango 1) |
| Death | Segunda oportunidad una vez por expedición |
| Medusa | Una congelación de racha gratis cada 7 días |

Los rangos superiores refuerzan cada pasiva y se concretan en la sección de
implementación de cada efecto. La primera integración implementada es Legion;
Frankenstein fija explícitamente la escala +20/+30/+40 % en la tabla anterior.

## Alcance de esta fase

- Añadir un identificador tipado para cada pasiva.
- Asociar cada Alma existente a su pasiva y descripción de rango 1.
- Exponer helpers puros para obtener el rango de un Alma equipada y listar las
  pasivas activas sin duplicados.
- Persistir y seleccionar el loadout diario antes de activar efectos.
- Registrar las activaciones con una identidad estable por expedición y fuente,
  conservando fecha, Alma, rango y pasiva para reintentos y correcciones.
- Cubrir la selección con tests.
- Integrar cada efecto con su punto runtime, registro idempotente y pruebas de
  corrección antes de darlo por completado.

## Registro de activaciones

- El registro Dexie `soulPassiveActivations` usa una clave estable derivada de
  expedición, pasiva y registro fuente; repetir una acción devuelve la misma
  activación en vez de conceder el efecto otra vez.
- Cada activación conserva la fecha operativa, la expedición, la fuente, el Alma
  y su rango. Solo se crea si el Alma se obtuvo y estaba en el loadout fijado
  para esa fecha.
- Para fechas con `DaySnapshot`, su loadout es la única fuente de verdad; un
  snapshot antiguo sin loadout no hereda las Almas actuales.
- La reconciliación elimina o reemplaza solo las activaciones de las fuentes y
  expedición indicadas, dejando intactos los demás registros.
- Las copias de seguridad versión 5 incluyen el registro; las anteriores se
  restauran con un registro vacío.

## Reglas acordadas para pasivas semanales

- Gaibon y Medusa usan enfriamiento móvil, no semanas de calendario ni bloques
  anclados al inicio de la expedición.
- Tras una activación correcta, el siguiente uso queda disponible a los
  **7/5/3 días** en rangos **1/2/3**, respectivamente. El contador sigue
  avanzando aunque el Alma deje de estar equipada.
- El Alma solo puede activar el efecto si está en el loadout diario bloqueado
  el día del evento; no es necesario llevarla equipada durante el enfriamiento.

## Integraciones runtime implementadas

### Legion

- Rango 1: +1 moneda en tareas triviales.
- Rango 2: +2 monedas en tareas triviales.
- Rango 3: +3 monedas en tareas triviales.
- No afecta tareas fáciles, medias o difíciles.
- Solo se calcula para una recompensa nueva del día actual.

### Murciélago gigante y Slogra

- Murciélago concede un bono de EXP del **5/10/15 %** en rangos **1/2/3**
  cuando todas las obligaciones que cierran ese día se completan; las misiones
  secundarias no cuentan como obligaciones.
- Slogra concede **5/10/15 monedas** en rangos **1/2/3** al quinto cumplimiento
  válido del día.
- Ambos efectos se asocian al registro de completado que los activa y se
  recalculan al corregir hoy o ayer; deshacer el requisito retira el bono sin
  dejar EXP u oro duplicado.
- La corrección usa el loadout del snapshot de la fecha; no se conceden bonos
  retroactivos a días cerrados sin ese loadout.

### Gaibon

- Un aplazamiento elegible puede ser gratuito cuando Gaibon está equipado y el
  enfriamiento ha terminado.
- El enfriamiento móvil, medido desde el uso y según el rango de ese uso, es de
  **7/5/3 días** en rangos **1/2/3**.
- Si no está disponible o sigue en enfriamiento, se conserva el gasto normal
  de un sello de aplazamiento. El aplazamiento y la activación se escriben en
  una transacción para evitar dobles usos.

### Succubus

- La primera poción consumida correctamente en el día cura **2×/3×/4×** en
  rangos **1/2/3**, hasta la vida máxima efectiva.
- La pasiva no se consume si la poción no puede curar, el personaje está
  muerto o ya tiene la vida máxima; las pociones posteriores usan la curación
  normal.

### Frankenstein

- Solo se bonifica la primera tarea completada de cada zona en la fecha operativa.
- Rango 1: +20 % de EXP; rango 2: +30 %; rango 3: +40 %.
- Una tarea sin zona no puede activar la pasiva.
- El cálculo se aplica tanto a tareas booleanas como cuantitativas al alcanzar
  la meta.
- Las correcciones históricas usan el `soulLoadout` del snapshot de esa fecha,
  nunca el loadout actual.
- Las correcciones de días cerrados usan el loadout guardado en su snapshot.

## Fuera de alcance

- Completar las pasivas de Death (segunda oportunidad) y Medusa (congelación
  gratuita), incluidas sus reglas de replay y corrección.
- Crear contadores manuales por pasiva.
- Cambiar la persistencia de Almas, su piedad, sus fragmentos o las casillas.
- Activar pasivas de Almas no pertenecientes a bosses implementados.
