# Cambio: Boss Succubus — Robo de vida

Implementa el encuentro de Succubus como un cambio independiente del diseño compartido de bosses.

## Mecánica

- Ventana de **5 días**.
- Al activar el encuentro, Succubus roba `min(10, hp - 1)` puntos de vida.
- La cantidad robada se fija en `BossEncounter.goal` y queda representada por la barra **Sangre robada**.
- Cada tarea cumplida durante la ventana recupera 1 punto de sangre; una tarea difícil recupera 2.
- Cuenta cualquier tarea no archivada, incluidas las creadas durante el combate, y solo una vez por tarea y día.
- La sangre recuperada se deriva de los completados reales; no se guarda un contador manual.
- Se vence al recuperar toda la sangre robada, aunque queden días de ventana.

## Entorno y derrota

- **Niebla de rosas:** mientras Succubus está activo se oculta el panel «Mañana» del Castillo.
- Si termina la ventana sin recuperar toda la sangre, la cantidad restante se pierde para siempre.
- La derrota aplica la maldición **Encanto** durante 5 días; las pociones de vigor no curan.
- La derrota no inflige daño directo adicional: el único daño de Succubus es el robo inicial.

## Premios

- 120 EXP y 60 monedas, escalados por nivel.
- Sello de aplazamiento: 20 %.
- Poción de vigor: 60 %.
- Congelación de racha: 30 %.
- Agua bendita: 25 %.
- Carmilla, élites, almas, reliquias y títulos quedan fuera de este change.

## Decisiones de implementación

- Se añade el objetivo `lifeSteal` y una tabla de recuperación por dificultad.
- La activación aplica el robo inicial solo cuando el encuentro pasa de `scheduled` a `active`; el `goal` fijado hace la operación idempotente.
- El progreso se calcula con `lifeProgress` y se muestra mediante una barra que baja al completar tareas.
- El efecto visual de la tarea reutiliza el popup de recompensa y muestra los puntos de sangre recuperados.
- Se añade un sprite propio y la entrada de Succubus se incorpora al Bestiario mediante el catálogo común.

## Fuera de alcance

- Variante élite Carmilla y su robo nocturno por obligaciones pendientes.
- Almas y reliquias.
- Premios élite, látigo y títulos.
- Otros bosses y cambios transversales pendientes.
