# Death — Reloj y apuesta

## Resumen

Implementar el encuentro de Death como el siguiente boss individual del plantel. Death
mantiene una ventana de cinco días, convierte cada obligación incumplida en una hoz y
permite apostar oro para multiplicar el premio.

## Comportamiento

- Al activarse se crea una ventana de cinco días y una meta de cinco hoces.
- La apuesta se elige entre 0 %, 10 % y 25 % del oro disponible. Se descuenta al
  confirmarla y se conserva en el encuentro para que la sincronización sea idempotente.
- Si una obligación vence sin completarse, suma una hoz. Las congelaciones de racha no
  absorben esos fallos mientras Death está activo; los escudos siguen funcionando.
- Al alcanzar cinco hoces, Death derrota al jugador inmediatamente.
- Si termina la ventana con menos de cinco hoces, el jugador vence. La apuesta se
  devuelve por dos si hubo al menos una hoz y por tres si no hubo ninguna.
- Si el usuario cierra el diálogo antes de elegir, la apuesta queda pendiente y puede
  confirmarse desde la tarjeta del boss. Una apuesta no elegida equivale a 0 % al resolver.
- La derrota aplica la maldición permanente Hoz de Death, que reduce la vida máxima un
  10 % hasta que se cure.
- El entorno Cielo sin luna impide consumir congelaciones de racha durante los días de
  la ventana.

## Alcance técnico

- Añadir el objetivo derivado `scythes` sin guardar contadores manuales: el progreso se
  reconstruye desde obligaciones y completados reales.
- Persistir `stakePercent` y `stakeCoins` en `BossEncounter`.
- Añadir selección de apuesta al diálogo de anuncio y al diálogo de detalles.
- Extender el cálculo de vida máxima para reducciones porcentuales y el ciclo de
  maldiciones para soportar Hoz de Death permanente.
- Mantener la activación automática existente y hacer la elección de apuesta atómica en
  IndexedDB.

## Fuera de alcance

- Almas, reliquias y piedad.
- Sistema de premios élite y Segunda oportunidad.
- Catálogo general de maldiciones graves más allá de la maldición necesaria para Death.
- Cambios en los demás bosses.
