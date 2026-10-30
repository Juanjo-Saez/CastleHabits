# Cambio: Almas y reliquias

Parte transversal de [boss-roster](../boss-roster/proposal.md). Las almas las consiguen varios bosses y el bestiario las muestra a partir de 20 victorias, así que conviene implementarlas antes de los bosses que dependen de ellas (Death, Medusa, Doppelgänger, Drácula).

## Alcance

### Almas
- **Persisten entre expediciones.** Se guardan en el perfil y sobreviven a jubilarse o renacer.
- **Sorteo:** cada boss tiene una probabilidad base de alma (la define su propio change).
- **Piedad:** +1 % por cada victoria sin alma, hasta +20 %. Al conseguir un alma se reinicia.
- **Alma repetida:** da un fragmento. 3 fragmentos suben el rango del alma de 1 a 3.
- **Casillas equipadas** según el nivel de la expedición actual: 1 al nivel 5, 2 al nivel 10 y 3 al nivel 20.
- **Efecto:** cada alma tiene un efecto por rango. Los efectos concretos los define cada boss en su change.
- **Bestiario:** a partir de 20 victorias muestra la probabilidad del alma con el contador de piedad propio.

### Reliquias
- **No persisten.** Se pierden al jubilarse o renacer.
- **Garantizada por primera victoria** de un boss, en los bosses que lo indiquen.
- **Asignación inicial:** Murciélago gigante → Rosario, Slogra y Gaibon → Espejo de plata y Legion → Corazón.
- **Catálogo inicial:** Rosario (reduce a la mitad la duración de las maldiciones leves), Espejo de plata (desbloquea las estadísticas históricas durante la expedición) y Corazón (+5 de vida máxima). Cada reliquia nueva se añade en su boss.
- Sin el Espejo de plata las estadísticas históricas permanecen bloqueadas. Amnesia puede ocultarlas temporalmente aunque el Espejo esté activo; al curar Amnesia vuelven a estar disponibles.

## Fuera de alcance
- Efectos concretos de cada alma (van en el change de su boss).
- Marcos y auras del Cazador (cosmético).

Los efectos concretos de cada alma quedan como ganchos descriptivos hasta el change específico de su boss; este change solo define su persistencia, piedad, fragmentos, rangos y equipamiento.

## Modelo de datos (propuesta)
- Perfil: `souls` (tipo de alma → rango y fragmentos) y `soulPity` (contador por boss).
- Expedición: `relics` (se reinician al jubilarse o renacer).
