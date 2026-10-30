# Tareas — composición pixel-art completa del Castillo

## Asset y referencias

- [x] 1.1 Conservar la imagen autorizada completa en
      `art/references/castle-scene-reference.png`.
- [x] 1.2 Convertir la composición completa a WebP lossless en
      `src/assets/castle-scene.webp`, sin recortar ni modificar sus píxeles.
- [x] 1.3 Mantener ambas referencias del Castillo y la de loading fuera de
      `public/` para que no se precacheen.
- [x] 1.4 Dejar de usar el PNG transparente extraído de la referencia anterior.

## Integración de la escena

- [x] 2.1 Mostrar la composición completa como fondo en `Backdrop`.
- [x] 2.2 Cubrir el contenedor sin deformar la imagen y priorizar el torreón
      central con un foco horizontal del 55 %.
- [x] 2.3 Mantener la imagen decorativa y sin captura de eventos.
- [x] 2.4 Usar también la composición completa en el encabezado de `BossDialog`.
- [x] 2.5 Eliminar estrellas estáticas duplicadas donde la imagen ya las contiene.

## Capas dinámicas

- [x] 3.1 Mantener la luna independiente y superpuesta a la composición.
- [x] 3.2 Conservar estados normal, luna de sangre y eclipse.
- [x] 3.3 Mantener las capas dinámicas de nubes, lluvia, niebla, tormenta,
      relámpagos y sprites de boss.

## Validación

- [x] 4.1 Ejecutar los tests focalizados del asset y la composición.
- [x] 4.2 Ejecutar TypeScript, build y lint focalizado; registrar el fallo del
      lint global preexistente.
- [x] 4.3 Revisar visualmente móvil/escritorio y verificar en tests la estructura
      del encabezado del diálogo de boss.
- [x] 4.4 Confirmar que no hay assets/scripts antiguos referenciados por runtime.

## Fuera de alcance

- [x] 5.1 No implementar la pantalla de carga basada en
      `loading-reference.png`.
- [x] 5.2 No modificar la lógica de clima, bosses ni gameplay.
