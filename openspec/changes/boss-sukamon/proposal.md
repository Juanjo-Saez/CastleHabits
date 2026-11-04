# Cambio: Sukamon — Lodo de lo pospuesto

## Resumen

Implementar a Sukamon como minijefe reactivo de un día. Aparece tras acumular
tres o más eventos reales de aplazamiento en siete días y obliga a completar
las tareas aplazadas que sigan pendientes cuando comienza el encuentro.

## Reglas confirmadas

### Disparador y objetivo

- Cada evento de aplazamiento cuenta, incluidos varios de la misma tarea.
- Solo cuentan eventos de la expedición actual, de los siete días operativos
  hasta hoy y posteriores al encuentro anterior de Sukamon.
- Al activarlo, se fijan las tareas distintas que tienen esos eventos y siguen
  pendientes. Completar todas ellas durante el día del encuentro vence a
  Sukamon; las tareas aplazadas después de aparecer no se añaden al objetivo.
- Las tareas cuantitativas cuentan solo al alcanzar su meta.
- Sukamon es exclusivamente reactivo y no entra en el sorteo aleatorio.

### Derrota y recompensas

- El encuentro dura un día.
- Al perder, se retira un sello de aplazamiento si queda alguno; nunca se resta
  por debajo de cero. No hay daño, maldición, alma ni consumibles regulares.
- La victoria concede 50 EXP y 25 monedas.
- En una tirada especial e independiente, la victoria tiene un 3 % de
  probabilidad de conceder un Digivice. No usa el drop de consuelo y solo se
  puede obtener uno por expedición. El Digivice no tiene efecto por ahora y se
  reinicia al comenzar una nueva expedición.
- Tras una derrota, el retrato de Perfil muestra durante un día la imagen
  proporcionada. La aparición y la victoria no cambian el retrato.

## Alcance técnico

- Añadir un objetivo con IDs de tareas fijados al activar, progreso derivado,
  aviso de derrota y conteo visual en la interfaz del boss.
- Integrar el registro de eventos, el perfil, las recompensas especiales, el
  reinicio de expedición y el retrato temporal.
- Actualizar Bestiario, `boss-roster` y `Todo.md`, con pruebas para límites de
  fechas, aplazamientos repetidos, objetivos fijados, victoria, derrota,
  recompensa y reinicio del Digivice.
