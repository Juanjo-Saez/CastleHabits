# Cambio: Plantel de bosses, entorno, maldiciones y bestiario

Diseño de los siguientes encuentros tras el Murciélago gigante. Es un documento de diseño: los valores numéricos son propuestas de balance y se ajustan al jugar. Lo marcado con **[confirmar]** necesita decisión.

## Principios

- El progreso de cada boss se **deriva de los completados, fallos y eventos reales**; no se guarda como contador aparte. Así corregir ayer o deshacer una tarea lo recalcula solo, como ya hace el Murciélago.
- **Un solo boss activo a la vez.** Entre encuentros hay enfriamiento (hoy 10–15 días) y los reactivos tienen un mínimo de 7.
- **Hardcore protegido:** solo el daño directo de un boss puede matar. Los efectos de entorno y las maldiciones nunca bajan la vida de 1.
- **Sin premiar fallar:** ningún boss se vence perdiendo a propósito una responsabilidad. Succubus pasa a ser un boss de **robo de vida** (ver más abajo).
- **Anti-abuso:** cada tarea cuenta como máximo una vez al día (un completado por tarea y día). En los bosses de golpes cuentan todas las tareas, también las creadas durante el combate. En los bosses de golpes las triviales cuentan, pero solo 1 de daño; en los de piezas, estatuas o cabezas no contarán.

## Estado de implementación

**Fase 2 (hecha):** motor general, premios por objeto, persistencia del bestiario, Slogra y Gaibon, efectos de entorno y maldiciones leves.

**Fase 3 (hecha):** pantalla del bestiario en el Perfil con desbloqueos por victorias.

| Pieza | Estado |
|---|---|
| Motor con objetivos `days`, `hits` y `pieces`, metas fijadas al activarse y zonas persistidas cuando hace falta | Hecho |
| Premios: sorteo independiente por objeto, consuelo y multiplicador por nivel | Hecho |
| Consumibles nuevos: agua bendita (cura una maldición) y bolsa de oro (en el motor, sin boss que la suelte aún) | Hecho |
| Persistencia: los encuentros resueltos sobreviven a jubilarse y los pendientes se reprograman | Hecho |
| Migración de los premios antiguos de un solo recurso | Hecho |
| Efectos de entorno globales y efectos por zona (`xpPercent`, `potionPercent`, `damagePercent`, Relámpagos) | Hecho |
| Siete maldiciones leves con sus modificadores (EXP, oro, pociones, aplazar y daño diario) | Hecho |
| Curas: agua bendita y sacerdotisa (`30 + 10 × nivel`) en el Perfil | Hecho |
| Boss Slogra y Gaibon (sprites, barras de vida, golpe visual en la tarjeta y en la tarea) | Hecho |
| Selección: sorteo ponderado sin repetir el último y gancho para disparadores reactivos | Hecho; ningún boss implementado tiene disparador en el diseño |
| Bestiario: datos (`bestiaryOf`) | Hecho |
| Bestiario: pantalla en el Perfil con desbloqueos por victorias | Hecho |
| Almas, reliquias, élite, látigo y maldiciones graves | Pendiente; se implementa en `boss-almas-reliquias`, `boss-premios-elite` y `boss-maldiciones-graves` |
| Succubus | Hecho en `boss-succubus` |
| Death | Hecho en `boss-death` |
| Resto de bosses (Medusa, Cerbero, Doppelgänger, Hidra, Drácula, Sukamon) | Pendiente; un change por boss |

### Modelo de datos

- **`BossDefinition`** (`lib/bosses.ts`): id, partes, nombre gramatical, ventana, objetivo (`days`, `hits`, `pieces` o `lifeSteal`), efectos, daño y maldición de derrota, premio base, tabla de objetos, enfriamiento, peso y disparador opcional.
- **`BossEncounter`**: una aparición. El id es `enc:<sequence>` (los anteriores conservan `giant-bat:<n>`). `bossId` es provisional mientras está pendiente y un disparador puede cambiarlo al activarse. Guarda `goal` (meta fijada al activarse), `zones` cuando el boss fija zonas, `rewards` (EXP, oro y objetos concedidos) y `curse` (maldición aplicada al perder).
- **Perfil:** `holyWater` y `curses` (máximo 2, con `startedOn`, `expiresOn` y `lastTickOn`). Se reinician al jubilarse.
- **Golpes:** sin restricción por fecha de creación; el único límite es un completado por tarea y día.
- **Progreso derivado:** los golpes y los días completos se calculan siempre desde los completados reales, así que corregir ayer o deshacer una tarea los recalcula solos.
- **Robo de vida:** Succubus fija en `goal` la vida robada al activarse y deriva la sangre recuperada de los completados, sin guardar contadores manuales.
- **Maldiciones:** rigen desde el día en que se aplican hasta el anterior a `expiresOn`; el daño diario se cobra una vez por día, desde el mismo día en que se aplican, y nunca baja la vida de 1.
- **Disparadores:** `trigger` se evalúa al acabar el enfriamiento y prima sobre el sorteo.

## Escalado de dificultad

| Aspecto | Cómo escala |
|---|---|
| **Meta del boss** | Sigue la **carga real**: `meta = clamp(round(cargaDiaria × díasVentana × factor), mín, máx)`. `cargaDiaria` es la mediana de obligaciones debidas por día en los últimos 14 días, solo con tareas que ya existían 7 días antes. Cada boss tiene su `factor`, `mín` y `máx`. |
| **Premio** | Sube con el **nivel**: EXP y oro × `(1 + 0,1 × ⌊nivel / 5⌋)`. |
| **Élite** | A partir de **10 victorias** se desbloquea la versión élite: meta ×1,25, un efecto de entorno extra y probabilidades de premio ×1,5. Es **aleatoria y opcional**: una vez desbloqueada, cada aparición de ese boss tiene un **1/10 (10 %)** de ser élite. |

## Aparición de bosses (mixto)

1. **Base aleatoria:** al acabar el enfriamiento se sortea un boss ponderado, sin repetir el último.
2. **Reactivos:** si se cumple un patrón, ese boss tiene prioridad sobre el sorteo.
3. **Hitos:** los jefes finales aparecen al alcanzar un hito, en orden.

| Boss | Disparador reactivo |
|---|---|
| Sukamon *(minijefe)* | 3 o más aplazamientos en 7 días; el objetivo se limita a las tareas aplazadas |
| Death | 3 o más fallos en 3 días, o vida por debajo del 30 % |
| Medusa | Una racha de 14 días o más en una tarea |
| Cerbero | 7 días sin completar ninguna misión secundaria |
| Hidra / Escila | Una zona con 3 o más fallos en 10 días |
| Doppelgänger | Un tramo de ruta completado, o 30 días sin cambios en tu ritmo |
| Succubus | Vida por encima del 80 % durante 5 días |
| Drácula *(final)* | Niveles 10, 20 y 30, o terminar una ruta |

## Plantel

Ventana por defecto: 5 días operativos, salvo que se indique. «Golpe» = una tarea cumplida (obligación, pergamino o misión secundaria).

### 1. Murciélago gigante — *Constancia* (hecho)
Dos días con todas las obligaciones cumplidas. Entorno: EXP −30 %. Derrota: 20 de daño directo.

### 2. Slogra y Gaibon — *Golpes* (hecho)
- **Combate:** dos barras de vida, Slogra y luego Gaibon. Cada tarea cumplida (de cualquier tipo) le hace un golpe; el daño del golpe depende de la dificultad (trivial 1, fácil 2, media 3, difícil 5). El daño sobrante pasa al siguiente.
- **Meta:** `vidaTotal = clamp(round(cargaDiaria × 5 × 0,9), 10, 80)`, repartida 55 % / 45 %.
- **Entorno:** *Lluvia de huesos*: las pociones curan la mitad.
- **Derrota:** 15 de daño directo y la maldición *Lanza clavada* (−1 HP al día durante 3 días, sin bajar de 1).
- **Premio:** 120 EXP y 60 monedas (× multiplicador de nivel); sello de aplazamiento 40 %, poción 50 %, agua bendita 8 %. El látigo queda para cuando exista su mecánica de uso.
- **Visual:** cada golpe sacude la barra de vida de la tarjeta del boss y la tarea muestra el daño flotante (⚔ −N) junto a la EXP y el oro.
- **Qué cuenta:** cualquier tarea cumplida (obligación, pergamino, hábito o misión secundaria), incluidas las creadas durante el combate. La meta es la carga real: mediana de obligaciones debidas por día en los últimos 14 días, con tareas de más de una semana.

### 3. Succubus — *Robo de vida*
- **Combate:** al aparecer te roba sangre: pierdes `min(10, hp − 1)` de vida y esa cantidad queda en su barra como **Sangre robada**. Cada tarea cumplida **recupera** 1 HP de esa barra (2 en una tarea difícil). Se vence vaciando la barra.
- **Derrota:** lo que no recuperaste se pierde para siempre y recibes la maldición *Encanto* (las pociones de vigor no curan durante 5 días).
- **Entorno:** *Niebla de rosas*: se oculta el panel de «Mañana».
- **Variante Carmilla (élite):** además, cada noche roba 1 HP por obligación pendiente y lo suma a la barra.
- **Por qué así:** el riesgo es la pérdida de vida, pero el camino para vencer es cumplir tareas, nunca fallarlas.

### 4. Death — *Reloj y apuesta*
- **Combate:** antes de empezar puedes **apostar oro** (0, 10 % o 25 % del que tengas). La apuesta **se descuenta al empezar y se pierde de verdad si pierdes**. Cada obligación que se queda sin cumplir al cierre del día suma una **hoz**. Con 5 hoces Death se lleva el alma: derrota. Si acaba la ventana con menos de 5, la apuesta se multiplica ×2 y vences. Con 0 hoces, ×3.
- **Entorno:** *Cielo sin luna*: las congelaciones de racha no funcionan.
- **Derrota:** pierdes el oro apostado y recibes la maldición *Hoz de Death* (vida máxima −10 % hasta pagar el responso).
- **Alma:** *Segunda oportunidad* (ver catálogo).

### 5. Frankenstein e Igor — *Piezas*
- **Combate:** el monstruo tiene 5 piezas, cada una ligada a una zona distinta. Cumplir una obligación de esa zona **desactiva** la pieza. Se vence con todas las piezas desactivadas a la vez; Igor remienda una pieza por cada día con alguna sin cumplir.
- **Entorno:** *Relámpagos*: cada día una zona está «cargada» y da el doble de EXP, pero su fallo duele el doble.
- **Derrota:** la maldición *Costuras* (vida máxima −5 durante 7 días).
- **Meta:** piezas = `min(5, zonas distintas con tareas activas)`.

### 6. Legion — *Escudo y ruptura*
- **Combate:** una esfera de cuerpos. Primero hay que romper la **cáscara**: 3 golpes de tareas medias o difíciles; después cualquier golpe hiere el núcleo. Ventana corta de 3 días.
- **Meta:** núcleo = `clamp(round(cargaDiaria × 3 × 1,2), 8, 50)`.
- **Entorno:** *Cuerpos sin descanso*: el daño por fallo se multiplica ×1,5.
- **Derrota:** la maldición *Pesadez* (EXP −20 % durante 7 días).

### 7. Medusa — *Estatuas*
- **Combate:** cada mañana petrifica 1–3 de tus obligaciones, visibles como estatuas. Cumplir una **rompe** la estatua y le hace un golpe. Una estatua sin romper al cierre del día cura a Medusa y duplica el daño del fallo de esa tarea. Se vence rompiendo `clamp(round(cargaDiaria × 2), 4, 14)` estatuas.
- **Entorno:** *Mirada*: las congelaciones y el escudo no funcionan.
- **Derrota:** la maldición *Petrificación* (las rachas no suben durante 5 días).

### 8. Cerbero — *Tres cabezas*
- **Combate:** una cabeza por categoría: obligaciones recurrentes, pergaminos y misiones secundarias. Cada cabeza cae tras `N` cumplidas de su categoría. Una cabeza **se regenera** un punto por cada día sin completar nada de esa categoría. Se vence con las tres caídas.
- **Entorno:** *Aliento infernal*: el daño por fallo ×1,25.
- **Derrota:** la maldición *Triple mordisco* (daño por fallo ×1,5 durante 5 días).
- **Efecto buscado:** obliga a atender las misiones secundarias, que casi nunca importan.

### 9. Doppelgänger — *Duelo contigo*
- **Combate:** compara los completados de la ventana con los de tus 5 días anteriores. Se vence si los superas en un 10 % y no tienes más fallos que entonces.
- **Entorno:** *Espejo*: las estadísticas se muestran invertidas (solo visual).
- **Derrota:** la maldición *Sombra* (EXP −10 % durante 10 días).
- **Primera victoria de la expedición:** reliquia *Espejo de plata* (revela las estadísticas históricas hasta jubilarte).

### 10. Hidra / Escila — *Cabezas que crecen*
- **Combate:** empieza con 3 cabezas. Cada tarea cumplida corta una. Cada noche, por cada obligación sin cumplir, **crece otra cabeza**. Se vence con 0 cabezas al cierre de un día.
- **Entorno:** *Aguas turbias*: las pociones curan la mitad.
- **Derrota:** la maldición *Veneno de hidra* (−1 HP al día durante 5 días; se cura con una poción de vigor).

### 11. Drácula — *Jefe final de tres fases*
Ventana total de 12 días, tres fases de 4:
1. **Humano:** Constancia (2 días completos).
2. **Demonio:** Golpes (vida con `factor 1,0`).
3. **Murciélago:** ninguna obligación fallada durante los 4 días.

- **Entorno:** *Noche eterna*: luna de sangre, daño por fallo ×1,5.
- **Derrota:** la maldición *Marca de Drácula* (vida máxima −10 % hasta derrotarlo en una revancha).
- **Premio:** EXP 400, oro 200, la *Corona de la noche* (cosmético) y el alma de Drácula con probabilidad baja.

### Minijefe: Sukamon — *Lodo de lo pospuesto*
El **Sukamon** de Digimon, el montón de lodo que nace de lo que se deja sin hacer (sprite propio inspirado en el original). Dura 1 día y se limita a las tareas aplazadas recientemente: cumplir todas lo vence. Derrota: pierdes un sello de aplazamiento. Como minijefe da menos EXP y oro (50 / 25) y sus mismas probabilidades de consumibles, sin alma.

## Efectos de entorno

Cada boss activa 0–2 efectos mientras dura. Máximo uno penalizador y uno favorable.

| Efecto | Qué hace |
|---|---|
| Pesadez | EXP −30 % *(hecho)* |
| Luna de sangre | Daño por fallo ×1,5 y EXP +25 % |
| Eclipse | EXP ×2 y daño por fallo ×2 |
| Avaricia | Oro −50 % |
| Silencio | No se puede aplazar |
| Tormenta | Aplazar cuesta 2 sellos |
| Mirada / Cielo sin luna | Congelaciones y escudo desactivados |
| Sangre rancia | Las pociones curan la mitad |
| Niebla | Se oculta el panel de «Mañana» |
| Zona maldita / Relámpagos | Una zona da el doble de EXP y el doble de daño |
| Bendición lunar | Cada tarea cumplida cura 1 HP |
| Espejo | Estadísticas invertidas (solo visual) |

## Maldiciones

Máximo **2 a la vez**; la misma no se acumula (se renueva su duración).

| Maldición | Tipo | Efecto | Duración o cura |
|---|---|---|---|
| Pesadez | Leve | EXP −20 % | 7 días |
| Avaricia | Leve | Oro −50 % | 5 días |
| Silencio | Leve | No se puede aplazar | 5 días |
| Veneno | Leve | −1 HP al día (mínimo 1) | 5 días o poción de vigor |
| Lanza clavada | Leve | −1 HP al día (mínimo 1) | 3 días |
| Encanto | Leve | Las pociones no curan | 5 días |
| Sombra | Leve | EXP −10 % | 10 días |
| Petrificación | Grave | Las rachas no suben y no hay congelaciones | Hasta curarla |
| Hoz de Death | Grave | Vida máxima −10 % | Hasta curarla |
| Amnesia | Grave | Se ocultan las estadísticas históricas | Hasta curarla |
| Cadenas | Grave | Una tarea no se aplaza y su fallo duele el doble | Hasta curarla |
| Marca de Drácula | Grave | Daño por fallo ×1,5 | Hasta revancha |

**Las leves caducan solas; las graves hay que curarlas:**
- **Sacerdotisa** (oro): `coste = 30 + 10 × nivel`.
- **Agua bendita** (consumible).
- **Penitencia:** 3 días con todas las obligaciones cumplidas.
- **Revancha:** vencer al mismo boss la quita al instante.
- **Rosario** (reliquia): reduce a la mitad la duración de las leves.

## Premios

### Catálogo de consumibles
Sello de aplazamiento, poción de vigor, congelación de racha *(ya existen)*, **agua bendita** (cura una maldición), **látigo** (EXP ×1,5 el resto del día) y **bolsa de oro** (50–150 monedas).

### Reglas de sorteo
- Cada consumible se sortea **por separado**, con su probabilidad y una cantidad mínima y máxima, así que un boss puede dar varios.
- Si no sale ninguno, se concede el de mayor probabilidad (consuelo).
- **Alma:** probabilidad base baja por boss. Con **piedad**: +1 % por cada victoria sin alma, hasta +20 %; al conseguirla se reinicia.
- **Alma repetida:** da un fragmento; 3 fragmentos suben el rango del alma (1 a 3), que refuerza su efecto.
- **Primera victoria:** un título (permanente) y, en algunos bosses, una reliquia garantizada **de esa expedición**.
- **Élite:** probabilidades ×1,5 y opción de reliquias raras (1 %). Se anuncia como élite al aparecer.

### Tabla propuesta (nivel 1; EXP / oro)

| Boss | EXP / oro | Consumibles (probabilidad) | Alma |
|---|---|---|---|
| Murciélago gigante | 100 / 50 | Sello 45 %, Poción 45 %, Congelación 35 %, Agua bendita 5 % | 3 % |
| Slogra y Gaibon | 120 / 60 | Sello 40 %, Poción 50 %, Látigo 25 %, Agua bendita 8 % | 2,5 % cada una |
| Succubus | 120 / 60 | Poción 60 %, Congelación 30 %, Agua bendita 25 %, Sello 20 % | 3 % |
| Death | 200 / 120 | Congelación 45 %, Agua bendita 30 %, Poción 30 %, Sello 30 % | 1,5 % |
| Frankenstein | 130 / 70 | Sello 35 %, Poción 35 %, Látigo 30 %, Congelación 25 %, Agua bendita 6 % | 3 % |
| Legion | 110 / 90 | Sello 50 %, Poción 30 %, Látigo 30 %, Bolsa de oro 35 % | 4 % |
| Medusa | 140 / 80 | Congelación 55 %, Agua bendita 25 %, Sello 25 %, Poción 20 % | 2,5 % |
| Cerbero | 150 / 80 | Sello 40 %, Poción 40 %, Congelación 40 %, Látigo 25 %, Agua bendita 8 % | 2,5 % |
| Doppelgänger | 160 / 80 | Látigo 40 %, Congelación 30 %, Sello 30 %, Agua bendita 20 % | 2 % |
| Hidra / Escila | 130 / 70 | Poción 55 %, Sello 30 %, Agua bendita 20 %, Congelación 20 % | 3 % |
| Drácula | 400 / 200 | Todos 60–70 %, Agua bendita 40 %, Bolsa de oro 60 % | 5 % |

### Almas (pasivas positivas, pequeñas)

| Alma | Efecto (rango 1) |
|---|---|
| Murciélago | +5 % de EXP en un día con todas las obligaciones cumplidas |
| Slogra | +5 monedas al cumplir 5 tareas en un día |
| Gaibon | Un aplazamiento gratis por semana |
| Succubus | La primera poción del día cura el doble |
| Death | **Segunda oportunidad:** una vez por expedición sobrevives a un golpe mortal con 1 HP |
| Frankenstein | La primera tarea de cada zona cada día da +20 % de EXP |
| Legion | Las tareas triviales dan +1 moneda |
| Medusa | Una congelación de racha gratis cada 7 días |
| Cerbero | El daño por fallo baja un 10 % |
| Doppelgänger | **Reflejo:** una vez por semana, el daño de un fallo se reduce a la mitad |
| Hidra | +1 HP al amanecer si ayer no hubo fallos |
| Drácula | Vida máxima +10 % y aura de la Corona |

**Las almas persisten entre expediciones.** Las casillas equipadas dependen del nivel de la expedición actual: 1 al nivel 5, 2 al nivel 10 y 3 al nivel 20, para que una expedición nueva no parta con todo el poder acumulado.

### Reliquias

Las **reliquias no persisten**: se pierden al jubilarte o renacer, como el resto del progreso de la expedición. Ejemplos: Rosario (reduce a la mitad la duración de las leves), Espejo de plata (revela las estadísticas) y Corazón (+vida máxima).

## Bestiario

| Victorias | Qué se desbloquea |
|---|---|
| 0 | Solo la silueta y «???». |
| 1 | La página: nombre, descripción, mecánica, EXP y oro que da, y tu marca (victorias, derrotas, mejor resultado). |
| 5 | **Probabilidades** de cada consumible. |
| 10 | Lore completo y versión élite. |
| 20 | **Probabilidad del alma**, con tu contador de piedad. |
| 50 | Cosmético de maestro cazador. |

- Cada boss muestra siempre cuántas veces te ha vencido y cuántas has ganado.
- Las **derrotas** no desbloquean nada, pero cuentan en el historial.

## Cosméticos
Títulos por hitos (1, 5, 20 victorias), marcos y auras del Cazador desde almas y élites, y la Corona de la noche.

## Qué hay que cambiar en lo ya hecho

- **Persistencia:** hoy `restartRun` borra todos los encuentros. El **bestiario** y las **almas** deben sobrevivir a jubilarse, así que al reiniciar solo se limpian el encuentro pendiente o activo; los resueltos se conservan. Las **reliquias** sí se reinician.
- **Recompensa:** hoy el Murciélago da un único recurso al azar. Pasa a sorteo independiente por ítem con la tabla de arriba.
- **Motor:** generalizar `BOSSES` con un tipo de objetivo (`days`, `hits`, `pool`, `pieces`, `heads`, `swarm`, `duel`, `clock`, `phases`), una lista de efectos y maldiciones, y una tabla de premios.
- **Efectos:** el modificador de EXP actual (`bossXp`) pasa a una función general de modificadores que también cubra oro, daño por fallo, aplazamiento y curas.
- **Datos nuevos:** tablas de almas (persistentes), maldiciones activas y reliquias (por expedición); el bestiario se calcula desde los encuentros resueltos.

## Decisiones tomadas

- **Almas:** persisten entre expediciones, con casillas limitadas por el nivel de la expedición actual.
- **Reliquias:** no persisten; se reinician al jubilarse o renacer.
- **Bestiario:** persiste siempre.
- **Apuesta de Death:** el oro apostado se pierde de verdad si pierdes.
- **Élite:** opcional y aleatoria, con una probabilidad de 1/10 por aparición una vez desbloqueada.
- **Sukamon:** minijefe con nombre propio, el Sukamon de Digimon.

## Fuera de alcance de este documento

- El código de cada boss; se hará uno por uno con su propio OpenSpec. El motor general ya está hecho (Fase 2).
- Cambiar las reglas actuales de EXP, daño, rutas o Hardcore fuera de lo descrito.

## Changes derivados

Este documento es el diseño compartido. El trabajo pendiente se implementa en changes propios, en este orden:

1. **[boss-almas-reliquias](../boss-almas-reliquias/proposal.md)**: almas persistentes, piedad, reliquias y contador de piedad del bestiario. Va antes que los bosses que dan almas.
2. **[boss-premios-elite](../boss-premios-elite/proposal.md)**: élite, látigo y títulos por hitos.
3. **[boss-maldiciones-graves](../boss-maldiciones-graves/proposal.md)**: petrificación, amnesia, cadenas, penitencia y revancha.
4. **Un change por boss**, cuando toque implementarlo. Orden sugerido:
   - **[boss-legion](../boss-legion/proposal.md)**: hecho; da la bolsa de oro y usa la cáscara antes del núcleo.
   - **[boss-frankenstein](../boss-frankenstein/proposal.md)**: hecho; piezas por zona, Relámpagos y Costuras.
   - Succubus: robo de vida.
   - Death: apuesta y segunda oportunidad; necesita almas y su Hoz.
   - Medusa: necesita almas y petrificación.
   - Cerbero.
   - Hidra/Escila.
   - Doppelgänger: necesita almas.
   - Sukamon: minijefe.
   - Drácula: el último; necesita revancha, Marca, almas y élite.

Este change queda cerrado con las Fases 1–3 completadas.
