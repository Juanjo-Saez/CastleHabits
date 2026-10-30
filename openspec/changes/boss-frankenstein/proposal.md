# Cambio: Boss Frankenstein — Piezas y relámpagos

Implementa el encuentro de Frankenstein e Igor como un cambio independiente del diseño compartido de bosses.

## Mecánica

- Ventana de **5 días**.
- Al activar el encuentro se fijan hasta **5 zonas distintas** con obligaciones activas.
- Cada zona seleccionada representa una pieza.
- Una pieza se desactiva al cumplir al menos una obligación de su zona debida ese día.
- El progreso se deriva de las tareas y no guarda contadores manuales.
- Si un día termina con alguna obligación de las zonas seleccionadas sin cumplir, Igor remienda una pieza desactivada. La selección de la pieza remendada es estable para que el resultado no dependa del orden de inserción.
- Se vence al tener todas las piezas desactivadas a la vez.

## Entorno y derrota

- **Relámpagos:** cada día se selecciona de forma determinista una zona de la aparición. Las tareas de esa zona conceden el doble de EXP y causan el doble de daño por fallo.
- El multiplicador de daño se conserva al recalcular fechas históricas, incluso si el encuentro ya está resuelto.
- Al terminar la ventana sin vencerlo, Frankenstein no inflige daño directo: aplica **Costuras** durante 7 días.
- Costuras reduce la vida máxima efectiva en 5 puntos mientras está activa.

## Premios

- 130 EXP y 70 monedas, escalados por nivel.
- Sello de aplazamiento: 45 %.
- Poción de vigor: 40 %.
- Congelación de racha: 30 %.
- Agua bendita: 10 %.
- El látigo queda fuera de este change y se añadirá con `boss-premios-elite`.

## Fuera de alcance

- Almas, reliquias y élites.
- Látigo y otros premios que dependan del change transversal de élites.
- Otros bosses y disparadores reactivos.

## Decisiones de implementación

- Las zonas se guardan en `BossEncounter.zones` junto con la meta fijada, porque forman parte de la identidad de la aparición.
- La pieza se considera cumplida si la zona tiene al menos una obligación debida ese día y una de ellas está completada.
- La zona cargada de Relámpagos se obtiene con un hash estable de la aparición y la fecha; no usa `Math.random`, de modo que las correcciones históricas reproducen el mismo resultado.
