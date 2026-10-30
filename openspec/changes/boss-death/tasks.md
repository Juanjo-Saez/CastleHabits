# Tareas — Death

## Motor

- [x] Añadir Death al catálogo y al tipo `BossId`.
- [x] Añadir el objetivo `scythes` y derivar una hoz por obligación incumplida.
- [x] Resolver la derrota inmediata al alcanzar cinco hoces.
- [x] Resolver la victoria al cerrar la ventana con menos de cinco hoces.
- [x] Persistir la apuesta y pagarla por ×2 o ×3 al vencer.
- [x] Impedir congelaciones durante la ventana sin alterar escudos ni otros bosses.

## Maldición y reglas transversales

- [x] Añadir Hoz de Death con reducción permanente del 10 % de vida máxima.
- [x] Conservar la maldición y su reducción al recalcular fechas e iniciar la aplicación.
- [ ] Integrar la versión general de maldiciones graves en `boss-maldiciones-graves`.

## Interfaz

- [x] Mostrar progreso de hoces, Cielo sin luna y reglas de derrota/victoria.
- [x] Permitir elegir 0 %, 10 % o 25 % de oro desde anuncio y detalles.
- [x] Mantener la apuesta pendiente sin bloquear el resto de la aplicación.

## Verificación

- [x] Añadir tests de hoces, congelaciones, derrota, maldición y apuesta.
- [x] Ejecutar tests, TypeScript, build y lint final.
- [x] Realizar comprobación visual con IndexedDB temporal y restaurar los datos.
