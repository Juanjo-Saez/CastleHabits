# Cambio: Hidra / Escila — Cabezas que crecen

## Resumen

Implementar el encuentro de Hidra / Escila, cuyo contador de cabezas refleja
completados y obligaciones fallidas. El progreso se deriva de completados y
eventos reales para que las correcciones no requieran contadores paralelos.

## Comportamiento

### Activación

- El disparador reactivo busca una zona con al menos tres eventos de fallo en
  los últimos diez días.
- Los fallos protegidos también cuentan; los eventos de otra expedición no.

### Combate

- La ventana dura cinco días operativos y empieza con tres cabezas.
- Cada tarea cumplida corta una cabeza, como máximo una vez por tarea y día.
  Los cuantitativos solo cuentan al alcanzar su meta.
- Al cierre de cada día, cada obligación que termina sin completar hace crecer
  una cabeza. Los fallos protegidos también hacen crecer cabezas.
- Los completados del día actual se muestran como progreso provisional; la
  victoria solo se confirma al cierre operativo, si quedan cero cabezas después
  de contabilizar los fallos de ese día.
- Al acabar la ventana sin victoria, la derrota aplica Veneno de hidra: −1 PV
  diario durante cinco días, sin bajar de 1 PV. Una poción de vigor lo cura.
- **Aguas turbias:** las pociones de vigor curan la mitad mientras el encuentro
  está activo.

### Recompensas y alma

- EXP base: 130; oro base: 70.
- Poción de vigor: 55 %; sello de aplazamiento: 30 %; agua bendita y
  congelación de racha: 20 % cada una.
- El alma tiene 3 % de probabilidad base.
- Si está equipada y el día anterior cerró sin fallos, cura 2/4/6 PV al amanecer
  según rango 1/2/3. Cualquier fallo, incluso absorbido por escudo, congelación
  o pasiva, cancela la cura de ese día.

## Alcance técnico

- Añadir un objetivo tipado de cabezas crecientes y derivar sus valores de
  completados y eventos `missed`.
- Evaluar fallos al cierre de su ventana y confirmar la victoria únicamente en
  un día ya cerrado.
- Pasar eventos al motor de bosses para el disparador por zona, la progresión y
  la pasiva de alma.
- Integrar el Veneno de hidra con el daño diario y permitir que una poción de
  vigor lo cure incluso con la vida llena.
- Añadir el alma al catálogo runtime y registrar el uso diario de forma
  idempotente.
- Mostrar el contador de cabezas, las reglas del encuentro y su sprite.

## Decisiones confirmadas

- El alma cura 2/4/6 PV según rango.
- Los fallos protegidos cuentan como fallos e impiden la cura diaria.
- El Veneno de hidra puede curarse usando una poción de vigor.

## Fuera de alcance

- Élite, látigo, títulos y cosméticos; siguen en `boss-premios-elite`.
- Cambios a los demás disparadores o al sistema común de premios.
