# Cambio: Cerbero — Tres cabezas

## Resumen

Implementar el encuentro de Cerbero como el siguiente boss del plantel. Sus tres
cabezas representan obligaciones, pergaminos y misiones secundarias. El progreso
se deriva de completados reales y de la regeneración diaria; no se persisten
contadores paralelos.

## Comportamiento

### Activación y metas

- Cerbero se activa al acabar el enfriamiento si existe una misión secundaria
  activa que lleva disponible al menos siete días y no se ha completado ninguna
  misión secundaria durante los últimos siete días.
- No se activa si no hay misiones secundarias elegibles: no existe abandono que
  pueda medirse en ese caso.
- Al activarse se fija una meta individual por cabeza. Para cada categoría se
  calcula la mediana de tareas debidas por día en los 14 días anteriores,
  considerando solo tareas creadas al menos siete días antes:
  `meta = clamp(round(mediana × 5 días × 1), 1, 30)`.
- Obligaciones excluye hábitos y misiones secundarias; los pergaminos son tareas
  `todo`, salvo las que están clasificadas explícitamente como misión secundaria.

### Combate

- La ventana dura cinco días operativos.
- Cada tarea completada de una categoría quita un punto a su cabeza, hasta
  derrotarla. Una tarea cuenta como máximo una vez por día; una tarea cuantitativa
  cuenta al alcanzar su meta.
- Si no se completa ninguna tarea de una categoría durante un día, su cabeza
  regenera un punto.
- La victoria exige que las tres cabezas estén derrotadas simultáneamente antes
  de que termine la ventana. Si no, el jugador pierde.
- **Aliento infernal:** el daño por fallo se multiplica por 1,25 durante el
  encuentro.
- La derrota aplica **Triple mordisco**, que multiplica el daño por fallo por
  1,5 durante cinco días. El daño indirecto respeta el mínimo de 1 PV.

### Recompensas

- EXP base: 150; oro base: 80.
- Sello de aplazamiento: 40 %; poción de vigor: 40 %; congelación de racha:
  40 %; agua bendita: 8 %.
- El alma tiene 2,5 % de probabilidad base y reduce el daño por fallo un
  10/15/20 % en rangos 1/2/3.
- El drop del látigo queda aplazado al cambio transversal
  `boss-premios-elite`, que implementará el recurso y su uso.

## Alcance técnico

- Añadir el objetivo tipado de cabezas y persistir sus metas en el encuentro.
- Derivar metas, progreso diario, regeneración y victoria simultánea desde las
  tareas y completados.
- Aplicar el disparador reactivo solo cuando haya una misión secundaria
  elegible.
- Integrar Aliento infernal y Triple mordisco con settlement y correcciones
  históricas, respetando el snapshot de almas equipadas.
- Mostrar las tres barras y las tareas que cuentan en la tarjeta, el banner y el
  diálogo; añadir un sprite original de Cerbero.
- Añadir pruebas del disparador, carga por categoría, regeneración, progreso
  único por tarea/día, victoria, derrota, pasiva por rango y corrección de ayer.

## Decisiones confirmadas

- Las metas dependen de la carga real de su propia categoría, con la fórmula y
  los límites descritos arriba.
- La reducción de daño del alma escala 10/15/20 % según rango.
- El látigo se aplaza al change transversal de premios élite.

## Fuera de alcance

- Implementar el látigo, su inventario o su activación.
- Cambiar la fórmula común de carga de otros bosses o el sistema general de
  recompensas.
