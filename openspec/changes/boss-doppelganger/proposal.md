# Cambio: Doppelgänger — Duelo contigo

## Resumen

Implementar el encuentro reactivo de Doppelgänger, un duelo que compara los
completados y fallos de cinco días con los cinco días inmediatamente anteriores.
El encuentro también distorsiona visualmente el mapa de constancia y concede la
pasiva Reflejo y el Espejo de plata de primera victoria.

## Reglas confirmadas

### Disparador

- Se activa al completar un tramo de ruta desde la última aparición de
  Doppelgänger en la expedición.
- También puede activarse cuando el promedio diario de completados en los
  primeros siete días de una ventana móvil de 30 días difiere como máximo un
  10 % del promedio de los últimos siete días. Ambos promedios deben ser
  mayores que cero.
- Los completados cuantitativos cuentan cuando alcanzan su meta.

### Combate

- La ventana dura cinco días operativos.
- Se comparan todos los completados de la ventana con los cinco días
  inmediatamente anteriores; solo cuentan completados que alcanzan su meta.
- La victoria exige al menos `ceil(completadosAnteriores × 1,10)` completados,
  con un mínimo de uno si el periodo anterior tuvo cero, y no más fallos que en
  el periodo anterior.
- Los fallos protegidos también cuentan. Se comparan los eventos de fallo de
  cada periodo, sin excluir tareas por su tipo.
- El resultado se confirma cuando la ventana ya ha cerrado.
- **Espejo:** mientras el encuentro esté activo, el mapa de constancia de
  Crónicas se muestra en orden cronológico inverso. No se alteran datos ni
  cálculos.

### Derrota, recompensas y alma

- La derrota aplica Sombra: −10 % EXP durante diez días.
- La primera victoria de Doppelgänger en la expedición concede el Espejo de
  plata.
- Recompensa base: 160 EXP y 80 monedas; congelación 30 %, sello de
  aplazamiento 30 % y agua bendita 20 %; alma 2 %. La probabilidad del látigo
  (40 %) queda para el cambio transversal `boss-premios-elite`, donde se
  implementará ese consumible.
- **Reflejo:** reduce a la mitad, redondeando hacia arriba, el daño de un fallo
  no protegido, una vez cada 7/5/3 días en rangos 1/2/3.
- La pasiva solo se usa si el alma está equipada en el loadout bloqueado para
  la fecha del fallo. Sus usos quedan registrados de forma idempotente y se
  reconcilian al corregir el día.

## Alcance técnico

- Añadir un objetivo de duelo con progreso derivado de completados y eventos.
- Integrar el disparador de ruta y el criterio de ritmo estable con los datos
  persistidos existentes.
- Aplicar la maldición, reliquia, recompensas y pasiva mediante los sistemas
  compartidos.
- Invertir únicamente la presentación cronológica del mapa mientras el boss
  está activo.
- Añadir pruebas para límites de periodo, umbral, fallos protegidos,
  disparadores, enfriamiento, liquidación y correcciones.

## Fuera de alcance

- Cambios a los demás disparadores, premios de élite o estadísticas persistidas.
