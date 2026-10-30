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
| Frankenstein | La primera tarea de cada zona cada día da +20 % de EXP |
| Succubus | La primera poción del día cura el doble |
| Death | Segunda oportunidad una vez por expedición |
| Medusa | Una congelación de racha gratis cada 7 días |

Los rangos superiores refuerzan cada pasiva y se definirán en el change que
implemente el efecto concreto. No se inventan multiplicadores en esta fase de
infraestructura.

## Alcance de esta fase

- Añadir un identificador tipado para cada pasiva.
- Asociar cada Alma existente a su pasiva y descripción de rango 1.
- Exponer helpers puros para obtener el rango de un Alma equipada y listar las
  pasivas activas sin duplicados.
- Persistir y seleccionar el loadout diario antes de activar efectos.
- Cubrir la selección con tests.
- Mantener los efectos de juego existentes sin cambios hasta que cada pasiva
  tenga un punto de integración y un registro idempotente.

## Primera integración: Legion

La pasiva de Legion es la primera integración runtime porque solo depende de la
tarea que se está completando:

- Rango 1: +1 moneda en tareas triviales.
- Rango 2: +2 monedas en tareas triviales.
- Rango 3: +3 monedas en tareas triviales.
- No afecta tareas fáciles, medias o difíciles.
- Solo se calcula para una recompensa nueva del día actual.
- Las correcciones de días cerrados usan el loadout guardado en su snapshot.

## Fuera de alcance

- Aplicar todavía las bonificaciones a EXP, monedas, pociones, congelaciones o
  daño.
- Crear contadores manuales por pasiva.
- Cambiar la persistencia de Almas, su piedad, sus fragmentos o las casillas.
- Activar pasivas de Almas no pertenecientes a bosses implementados.
