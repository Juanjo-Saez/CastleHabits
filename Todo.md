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
  Legion, Frankenstein, Succubus, Death, Medusa y Cerbero. Hay Bestiario, almas,
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

- Completar los encuentros pendientes: Hidra/Escila, Doppelgänger, Sukamon y
  Drácula; Medusa y Cerbero ya están implementados.
- Añadir y validar los disparadores reactivos específicos que todavía faltan.
  El sorteo ponderado y el mecanismo de disparadores ya existen.
- Pasivas runtime de las almas equipadas completadas: Death salva 1/2/3 golpes
  mortales por expedición, Medusa concede congelaciones gratuitas con
  enfriamiento móvil de 7/5/3 días y Cerbero reduce el daño por fallo un
  10/15/20 % según rango. El registro idempotente cubre liquidación, bosses y
  correcciones de ayer. Falta la validación visual del panel de Almas; ver
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

- Revisar los controles y flujos de la interfaz para que sean claros y
  consistentes, especialmente en móvil.

### UI y experiencia visual

- En el futuro, rediseñar de forma integral el apartado visual para darle
  coherencia entre pantallas y componentes; ahora mismo se percibe demasiado
  dispar. Acordar primero una dirección visual común y revisar el conjunto
  antes de rehacer pantallas por separado.
- Rediseñar el Bestiario como una sección desplegable que se abra como un libro,
  con navegación y fichas claras para consultar la información descubierta.
  Mantener ocultos los datos de criaturas no descubiertas, comprobar la
  experiencia en móvil e incorporar las imágenes de referencia que se
  adjuntarán más adelante.
- Diseñar la pantalla de carga inicial con el portón y el castillo, inspirada
  en el estilo de *Super Castlevania IV*, con animación ligera y respeto a
  `prefers-reduced-motion`.
- Retocar los iconos de la aplicación: los actuales son demasiado básicos y no
  encajan con la calidad visual deseada.
- Rediseñar el catálogo y la interfaz de la tienda para que las tarjetas de los
  objetos tengan una presentación consistente. Añadir una animación o
  confirmación visual al comprar para que la acción y su resultado sean
  perceptibles.
- Añadir un inventario a la vista de Cazador para consultar los objetos que
  posee el personaje.
- Revisar el calendario: valorar representar los días con velas encendidas
  (multiplicador x4), apagadas (x2) y falladas para días pasados, según las
  tareas realizadas o pendientes. El diseño actual diferencia mucho cada día,
  pero esa diferencia no aporta suficiente información.
- Rediseñar la presentación de «Corregir ayer» y el botón de «Hoy».
- Revisar las tarjetas de tareas: reconsiderar la racha y cómo se muestra;
  cambiar «Mañana» por una acción más clara como «Aplazar»; mejorar el texto
  que explica cuándo debe hacerse la tarea; y rediseñar el aviso de fallo con
  fecha (por ejemplo, «Falló el 28/10»), cuya presentación actual no convence.

### Castillo y eventos

- Validar el gesto de scroll táctil e inercia del Castillo en móviles objetivo.
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
