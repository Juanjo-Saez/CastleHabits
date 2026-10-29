# Cambio: Primer encuentro con boss

## Por qué

La aplicación ya conserva completados, fallos, aplazamientos, daño, EXP y monedas como datos reales, pero todavía no existe un encuentro que convierta ese comportamiento diario en un desafío narrativo. El primer boss debe probar el modelo sin introducir todavía zonas, maldiciones ni preguntas sobre el historial.

El encuentro inicial será un murciélago gigante que aparece automáticamente, altera temporalmente la obtención de EXP y exige demostrar constancia durante varios días. Sus reglas deben ser deterministas una vez activado, resistentes a recargas y correcciones, y no deben conceder recompensas o aplicar daño dos veces.

## Qué cambia

- Añadir un sistema extensible de encuentros con un primer boss: **Murciélago gigante**.
- Programar su primera aparición tras un intervalo aleatorio inclusivo de 10 a 15 días.
- Mantener cada encuentro activo durante 5 días operativos como máximo.
- Contar como progreso los días con al menos una obligación válida en los que se completan todas las obligaciones válidas.
- Vencer el encuentro al alcanzar 2 días completos, aunque no sean consecutivos.
- Si finalizan los 5 días sin victoria, aplicar 20 puntos de daño directo.
- Mientras el boss esté activo, conceder solo el 70 % de la EXP normal, redondeando hacia arriba.
- Al vencer, conceder 100 EXP, 50 monedas y un consumible aleatorio.
- Tras cualquier resolución, programar un enfriamiento aleatorio inclusivo de 10 a 15 días y permitir nuevas apariciones indefinidamente.
- Mostrar el boss sobre la luna del Castillo, permitir una vista de contemplación sin HUD y abrir una tarjeta informativa al pulsarlo.
- Marcar con un brillo animado las tareas que pueden contribuir al encuentro activo.

## Experiencia y reglas del encuentro

### Programación

- La primera inicialización del sistema se realiza al cargar una instalación existente o nueva con esta funcionalidad disponible. Ese día operativo es el punto de referencia de la primera programación.
- Al inicializar el sistema se elige y persiste un retraso entero aleatorio entre 10 y 15 días, ambos incluidos. No se vuelve a sortear al recargar, navegar o cambiar de dispositivo mediante un backup.
- El boss se activa al comenzar el día operativo `scheduledFor`.
- La ventana activa incluye `windowStart` y los cuatro días operativos siguientes; por tanto, tiene exactamente 5 fechas posibles.
- Al vencer o ser derrotado se sortea y persiste otro retraso entre 10 y 15 días. La siguiente aparición no puede activarse antes de `resolvedOn + delay`.
- Solo puede existir un encuentro del Murciélago gigante activo o pendiente de activación a la vez.

### Obligaciones válidas

- Se reutilizan las reglas de fecha operativa de `todayKey()` y el corte de las 02:00.
- Una obligación válida para el boss es:
  - una tarea recurrente del Castillo (`type === 'chore'` con aparición en la fecha), o
  - un pergamino/tarea puntual (`type === 'todo'`) activo y con vencimiento dentro de esa fecha según las reglas existentes.
- Se excluyen los hábitos y las misiones secundarias vinculadas a rutas. La exclusión se basa en las reglas existentes de `isObligation`/`commitment`, no en el texto o la zona de la tarea.
- Se debe respetar el margen de las tareas. Una obligación cuenta como debida en la fecha si `isItemDueOn` la considera activa y cuenta como completada si `isWindowCompleted`/`completionInWindow` confirma que se cumplió su aparición.
- Una fecha de la ventana es un día completo solo cuando:
  - existe al menos una obligación válida debida en esa fecha, y
  - todas las obligaciones válidas debidas en esa fecha están completadas.
- Los días sin obligaciones válidas no cuentan como progreso, pero tampoco causan una derrota por sí mismos.
- Las correcciones de hoy o ayer deben recalcular el progreso de un encuentro que aún esté activo. No se deben crear completados, eventos o recompensas derivados de la consulta.

### Victoria, derrota y efectos

- El progreso visible es `completedDays / 2`, con una lista de fechas completas para poder explicar por qué se ha avanzado.
- Las fechas completas no tienen que ser consecutivas.
- Al pasar a 2 fechas completas:
  - el encuentro cambia a `victory` de forma idempotente;
  - se detiene inmediatamente el efecto de EXP;
  - se conceden exactamente 100 EXP, 50 monedas y un consumible;
  - se registra la resolución y se programa el cooldown;
  - no se vuelve a aplicar el objetivo ni la recompensa al recargar.
- Si el día operativo actual supera `windowEnd` y el encuentro sigue sin victoria:
  - cambia a `defeat` de forma idempotente;
  - aplica exactamente 20 puntos de daño directo;
  - el daño ignora escudo, congelación de racha y cualquier otra defensa;
  - respeta el estado Hardcore existente: si la vida llega a 0, el personaje queda muerto mediante el flujo normal;
  - no se vuelve a aplicar el daño al recargar, navegar o volver a evaluar el día;
  - se registra la resolución y se programa el cooldown.
- El daño del boss no se confunde con un fallo de tarea y no genera un `ItemEvent` asociado a una tarea.
- La EXP obtenida por completados mientras el encuentro está activo se calcula como `ceil(EXP normal * 0.70)`. La cifra reducida debe ser la que se guarde en `Completion.xpEarned` y en el evento correspondiente, para que historial, estadísticas, correcciones y deshacer sean coherentes.
- La recompensa fija de victoria no se reduce por el efecto del boss. Se concede como recompensa del encuentro, separada del cálculo normal de una tarea.
- El consumible se sortea uniformemente entre:
  - sello de aplazamiento;
  - poción de vigor;
  - congelación de racha.
- La recompensa debe actualizar el perfil y el estado del encuentro en una operación idempotente. Si se produce una subida de nivel, debe reutilizar `awardCompletion`/`LevelUpInfo` sin duplicar la concesión.

## Persistencia y modelo de datos

Añadir tipos extensibles, aunque el primer contenido solo implemente `giant-bat`:

```ts
type BossId = 'giant-bat'
type BossStatus = 'scheduled' | 'active' | 'victory' | 'defeat' | 'cooldown'

interface BossEncounter {
  id: string
  bossId: BossId
  sequence: number
  status: BossStatus
  scheduledFor: string
  windowStart?: string
  windowEnd?: string
  resolvedOn?: string
  nextActivationOn?: string
  rewardGranted: boolean
  damageApplied: boolean
}
```

- Persistir los encuentros en una nueva tabla Dexie, con índice por `id`, `bossId`, `status` y `scheduledFor`.
- Subir la versión de la base de datos sin perder instalaciones existentes.
- La inicialización debe ser segura ante llamadas concurrentes de React StrictMode.
- La evaluación del estado debe ser idempotente: una misma fecha, recarga o navegación no puede crear una segunda recompensa ni un segundo daño.
- `completedDays` se puede calcular a partir de completados y tareas al mostrar/evaluar el encuentro; no se debe guardar como una fuente de verdad duplicada que quede obsoleta tras una corrección.
- Limpiar los encuentros al ejecutar `resetAllAppData`.
- Incluir los encuentros en el backup y aumentar su versión de forma compatible. Al importar backups antiguos que no contienen bosses, inicializar una programación nueva sin inventar encuentros ya resueltos.

## Integración con la aplicación

- Ejecutar la sincronización del boss después de cargar perfil, tareas, completados y eventos, y después de liquidar las penalizaciones del día. La sincronización debe:
  1. inicializar la programación si no existe;
  2. activar el encuentro si ha llegado `scheduledFor`;
  3. recalcular el progreso si está activo;
  4. resolver victoria o derrota si corresponde;
  5. actualizar las tiendas y la UI sin bucles de escritura.
- Volver a sincronizar al cambiar el día operativo y después de completar, deshacer, aplazar o corregir una obligación.
- Centralizar el modificador de EXP en una función pura reutilizable por completados normales y correcciones. No aplicar el 70 % solo en la tarjeta ni solo en una ruta de UI.
- Mantener las reglas actuales de EXP de dificultad y oficio; el boss se aplica después de esos modificadores y antes de persistir el resultado.
- El flujo de derrota directa no debe consumir recursos defensivos existentes.

## Interfaz

### Castillo y boss sobre la luna

- En `Backdrop` o un componente visual equivalente, mostrar el sprite del Murciélago gigante sobre la luna solo cuando el encuentro esté activo o tenga un estado que deba anunciarse.
- El sprite debe ser un control accesible, con nombre comprensible y foco visible; no depender únicamente de una imagen o posición.
- Al pulsarlo, abrir una tarjeta/modal coherente con los paneles góticos actuales que muestre:
  - Murciélago gigante;
  - estado activo, victoria o derrota reciente si aplica;
  - efecto actual: “La EXP obtenida se reduce un 30 %” mientras esté activo;
  - progreso `0/2`, `1/2` o `2/2`;
  - fechas o contador de días válidos conseguidos;
  - días restantes de la ventana;
  - condición de victoria;
  - consecuencia de derrota;
  - recompensa de victoria;
  - información del cooldown cuando corresponda.
- La tarjeta es informativa: no puede conceder recompensas, activar el boss ni alterar el progreso.

### Vista de contemplación

- En la vista del Castillo debe poder desplazarse la escena ligeramente hacia arriba para contemplar el castillo y la luna.
- Durante el modo de contemplación se ocultan el HUD y los elementos de navegación superpuestos al Castillo.
- Debe existir una forma accesible de salir del modo de contemplación y volver a la posición normal.
- La interacción no debe impedir el scroll normal de las listas de tareas ni romper el uso en pantallas pequeñas.
- Respetar `prefers-reduced-motion`: el brillo y el movimiento del boss se reducen o se sustituyen por un estado estático.

### Tareas que afectan al boss

- En la lista de obligaciones, aplicar una clase o estado visual solo a las tareas válidas para el encuentro activo y debidas dentro de la ventana.
- Usar un reflejo dorado animado que recorra periódicamente el marco o la superficie de la tarjeta; no usar un parpadeo agresivo ni dificultar la lectura.
- Mantener contraste, foco, estados de completado y estados de vencimiento existentes.
- Añadir una alternativa no basada en movimiento/color, por ejemplo una etiqueta accesible “Cuenta para el boss”.
- No marcar hábitos, misiones secundarias de ruta, tareas archivadas ni obligaciones fuera de la ventana.

## Fuera de alcance

- Bosses activados por patrones de aplazamientos, cantidad de fallos o rachas de fallos.
- Preguntas o quizzes basados en estadísticas.
- Efectos de zona adicionales, maldiciones o formas de purificarlas.
- Poderes, reliquias o catálogo específico de bosses.
- Nuevas fórmulas generales de EXP, daño, Hardcore, rachas o rutas.
- Cambiar la ruta inicial de la aplicación: la raíz ya abre Castillo y Hábitos conserva `/habitos`.

## Decisiones tomadas

- El primer boss es un Murciélago gigante.
- Primera aparición: intervalo aleatorio de 10–15 días desde la inicialización de la funcionalidad.
- Ventana activa: 5 días operativos.
- Victoria: 2 días con al menos una obligación válida y todas completadas; no consecutivos.
- Derrota: 20 de daño directo.
- Efecto: 30 % menos de EXP, aplicando `ceil(xp * 0.70)`.
- Recompensa: 100 EXP, 50 monedas y un consumible aleatorio.
- Cooldown: intervalo aleatorio de 10–15 días, con reaparición indefinida.
- Días vacíos: no cuentan y no penalizan por sí solos.
- Misiones secundarias de ruta: nunca cuentan para este boss.

## Impacto previsto

- `src/types/index.ts`: tipos de boss y estado persistido.
- `src/db/database.ts`: nueva tabla y migración; limpieza en el reinicio total.
- `src/lib/bosses.ts`: definición, calendario, selección de obligaciones, progreso, modificador de EXP y recompensa de forma pura.
- `src/store/useBossStore.ts`: carga, sincronización y acciones idempotentes del encuentro.
- `src/store/useItemsStore.ts` y `src/lib/dayCorrections.ts`: aplicar el modificador de EXP y sincronizar progreso después de cambios reales.
- `src/store/usePlayerStore.ts`: concesión de recompensa y daño directo sin duplicados.
- `src/App.tsx`: carga y refresco del encuentro junto al cambio de día.
- `src/components/Backdrop.tsx`: boss sobre la luna y entrada al modo contemplación.
- `src/components/ItemCard.tsx` y `src/pages/ChoresPage.tsx`: identificación visual de tareas afectadas.
- `src/components/BossCard.tsx` o componente equivalente: detalle accesible del encuentro.
- `src/index.css`: animación del reflejo dorado, estados de foco y movimiento reducido.
- `src/lib/backup.ts`: exportación/importación compatible del estado de bosses.
- `tests/`: pruebas puras de fechas, selección, progreso, modificadores y resolución idempotente.
