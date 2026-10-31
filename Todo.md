# Hoja de ruta de Hábitos

Revisada el 31 de octubre de 2026. Este documento resume el estado y el trabajo
pendiente; los requisitos detallados y su seguimiento técnico viven en los
OpenSpecs enlazados.

## Estado actual

- **Tareas y calendario:** obligaciones, hábitos y tareas puntuales; recurrencias
  con fecha de inicio y margen; recordatorios; archivo; calendario mensual y
  detalle de actividad.
- **Progresión:** niveles, EXP, vida, Hardcore, correcciones de hoy y ayer,
  resumen diario, historial, copias de seguridad y objetos.
- **Rutas y oficios:** ya existen Cazavampiros, Tecnomancer y Fortaleza Interior,
  con misiones iniciales, progreso por tramos y oficios equipables.
- **Bosses:** están implementados el Murciélago gigante, Slogra y Gaibon,
  Legion, Frankenstein, Succubus, Death y Medusa. Hay Bestiario, almas,
  reliquias, maldiciones y un motor común; algunos premios, pasivas y encuentros
  todavía están pendientes.
- **Castillo:** escena pixel-art, luna independiente, climas y estados de boss.
  Durante el eclipse, EXP y oro se multiplican por dos y el daño recibido
  también.

## Próxima prioridad — Evolucionar las rutas

La base de rutas y oficios está hecha en
[routes-missions-jobs](./openspec/changes/routes-missions-jobs/). La siguiente
etapa debe diseñarse como un OpenSpec nuevo antes de implementar:

- Convertir las rutas lineales en líneas con ramas, misiones anidadas y
  objetivos combinados; por ejemplo, completar 3 de 5 actividades durante un
  periodo, definiendo cuántos fallos se permiten.
- Permitir que los objetivos evolucionen al avanzar por los tramos.
- Extender la asociación actual entre tareas y rutas, el progreso por tramos y
  el desbloqueo/equipamiento de oficios para que encajen con ramas, sin
  duplicar misiones vinculadas.
- Diseñar rutas bloqueadas y secretas, sus requisitos y cómo se descubren sin
  revelar contenido antes de tiempo.
- Resolver los temas que quedaron fuera del OpenSpec inicial: recompensas por
  tramo, qué sucede al llegar al nivel máximo, aviso o celebración al mejorar
  una pasiva y edición/archivo de actividades de ruta.
- Revisar la presentación de rutas disponibles, bloqueadas y descubiertas.

Las rutas actuales ya incluyen actividades de ejercicio, programación y mejora
personal, incluida la sesión con la psicóloga. El contenido nuevo o sus cambios
deben acordarse al concretar el OpenSpec.

## Trabajo pendiente confirmado

### Bosses, almas y premios

- Completar los encuentros pendientes: Cerbero, Doppelgänger, Hidra/Escila,
  Sukamon y Drácula; Medusa ya está implementada.
- Añadir y validar los disparadores reactivos específicos que todavía faltan.
  El sorteo ponderado y el mecanismo de disparadores ya existen.
- Completar las pasivas runtime restantes de las almas equipadas: el registro
  idempotente y Murciélago, Slogra, Gaibon, Legion, Frankenstein y Succubus ya
  están conectados; quedan Death y Medusa. Seguir
  [soul-passives](./openspec/changes/soul-passives/).
- Implementar versión élite, látigo, títulos y cosméticos según
  [boss-premios-elite](./openspec/changes/boss-premios-elite/).
- Completar la comprobación visual en navegador del encuentro de Legion,
  pendiente en
  [boss-legion](./openspec/changes/boss-legion/).

El sistema de almas/reliquias, las maldiciones graves, el Bestiario y sus
encuentros terminados se documentan en
[boss-roster](./openspec/changes/boss-roster/); no reabrirlos como features
pendientes.

### Fixes y mejoras de UX

- Revisar y mejorar el Bestiario: su presentación actual no resulta satisfactoria.
  Rediseñar la navegación y la ficha de cada criatura para que el plantel,
  el progreso de descubrimiento y la información disponible se entiendan de un
  vistazo, manteniendo ocultos los datos de criaturas aún no descubiertas.
  Comprobar también su uso en móvil y acordar el alcance visual y funcional
  antes de implementarlo.

### Castillo y eventos

- Validar el gesto de scroll táctil e inercia del Castillo en móviles objetivo.
- Crear una pantalla de carga de entrada con animación ligera, respetando
  `prefers-reduced-motion`. La referencia está en
  [loading-reference.png](./art/references/loading-reference.png).
- Diseñar un encuentro raro del Murciélago dorado: aparición poco frecuente,
  recompensa moderada de oro, persistencia y protección frente a cobros
  repetidos.

## Ideas aparcadas — sin prioridad asignada

- Al desbloquear las estadísticas, mostrar récords personales por día: el día
  con más dinero ganado, el día con más experiencia ganada y el día con más
  vida perdida.
- Crear un histórico familiar con todos los personajes que hayan existido,
  incluyendo la fecha de muerte y un resumen de lo ocurrido, con la tarea que
  causó cada muerte.
- Explorar un sistema Nemesis que aproveche el historial de personajes y sus
  muertes.
- Mapa con zonas visitables, personajes y diálogos; transiciones entre zonas.
- Traits heredables y promoción/prestigio para el endgame.
- Funciones sociales, como prestar temporalmente un oficio cuando haya cuentas
  y amistades.
- Incorporar a Bahamut y Squall, y desarrollar el concepto del minijefe
  Sukamon. El usuario confirma que dispone de las licencias necesarias.

## OpenSpecs con trabajo todavía abierto

- [Rutas y oficios — base implementada](./openspec/changes/routes-missions-jobs/).
  La evolución de rutas está en borrador y pendiente de validar en
  [route-evolution](./openspec/changes/route-evolution/).
- [Plantel de bosses](./openspec/changes/boss-roster/): quedan encuentros del
  plantel y disparadores específicos.
- [Pasivas runtime de almas](./openspec/changes/soul-passives/).
- [Élite, látigo y títulos](./openspec/changes/boss-premios-elite/).
- [Validación visual de Legion](./openspec/changes/boss-legion/).
