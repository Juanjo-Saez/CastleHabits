# Tareas — entrada cinematográfica de bosses

## Diseño y contrato

- [x] 1.1 Confirmar el token de presentación de un encuentro activo y diferenciarlo
      del token usado por los avisos de resultado.
- [x] 1.2 Definir los estados de la escena (`idle`, `scrolling`, `revealing`,
      `final`, `skipped`) y sus transiciones idempotentes.
- [x] 1.3 Documentar la coordinación entre `BossAnnouncement`, `BossSky`,
      `BossDialog`, el resumen diario y el scroller de `ChoresPage`.

## Persistencia y detección

- [x] 2.1 Crear el marcador local específico de entradas cinematográficas con lectura
      defensiva, límite de tokens y comportamiento seguro si `localStorage` falla.
- [x] 2.2 Detectar únicamente el encuentro activo pendiente de presentación.
- [x] 2.3 Marcar la entrada después de terminarla o de omitirla, nunca al comenzar,
      para que una interrupción no confirme una escena que el jugador no vio.
- [x] 2.4 Verificar que cambiar de ruta, StrictMode, recargar y sincronizar dos veces
      no duplican la presentación ni escriben recompensas o daño.

## Integración de la pantalla

- [x] 3.1 Integrar el orquestador en `ChoresPage` usando el scroller existente y
      `BossSky`, sin desplazar `window` ni romper los snap points.
- [x] 3.2 Sustituir el aviso introductorio activo de `BossAnnouncement` para que no
      aparezca simultáneamente con la cinemática.
- [x] 3.3 Mantener el aviso de victoria, derrota y revancha cuando corresponda.
- [x] 3.4 Asegurar que un boss activo ya presentado sigue visible y abre
      `BossDialog` desde el sprite o el banner.

## Interfaz y animación

- [x] 4.1 Añadir el estado de aparición al cielo sin duplicar la definición del boss,
      el sprite ni el texto del catálogo.
- [x] 4.2 Implementar la atenuación inicial y los relámpagos con CSS controlable por
      clases de estado.
- [x] 4.3 Implementar la aparición progresiva del sprite, nombre, amenaza y acción
      para continuar.
- [x] 4.4 Añadir control visible para omitir la animación y conservar una salida
      clara hacia los detalles del encuentro.
- [x] 4.5 Añadir `prefers-reduced-motion` para mostrar directamente el estado final,
      sin destellos ni desplazamientos suaves.
- [x] 4.6 Revisar foco, teclado, nombres accesibles y región viva de la aparición.
- [x] 4.7 Comprobar que la animación no oculta ni impide completar tareas una vez
      finalizada.

## Verificación automática

- [x] 5.1 Añadir tests del marcador: token nuevo, token visto, límite de tokens y
      almacenamiento no disponible.
- [x] 5.2 Añadir tests de selección: boss activo pendiente, boss ya visto, boss
      programado, boss resuelto y jugador muerto.
- [x] 5.3 Añadir tests de idempotencia: doble render, doble sincronización y
      reentrada en la pantalla no repiten la escena.
- [x] 5.4 Añadir tests de interacción: completar, omitir, abrir detalles y mantener
      el estado del encuentro sin cambios de dominio.
- [x] 5.5 Verificar que el aviso introductorio activo anterior no se renderiza junto
      a la entrada cinematográfica.

## Verificación visual y regresión

- [x] 6.1 Comprobar en navegador una activación nueva desde la pantalla de tareas:
      scroll al cielo, atenuación, relámpagos, aparición y apertura de detalles.
- [x] 6.2 Comprobar recarga y cambio de ruta después de ver la escena.
- [x] 6.3 Comprobar omitir, teclado, foco visible y viewport móvil de 390 px.
- [x] 6.4 Comprobar `prefers-reduced-motion` y confirmar que no quedan destellos.
- [x] 6.5 Comprobar que una victoria o derrota sigue mostrando su aviso de resultado.
- [x] 6.6 Ejecutar `npm test`, `npx tsc -b`, `npm run build`, ESLint focalizado y
      `git diff --check`.

## Tormenta y luna de sangre

- [x] 7.1 Activar el modo de luna roja mientras exista un boss activo y devolverla a
      su aspecto normal cuando no haya encuentro.
- [x] 7.2 Mantener los relámpagos intermitentes durante todo el encuentro, además de
      la animación inicial de aparición.
- [x] 7.3 Ajustar las capas y la posición vertical para que la luna quede por
      delante y claramente por encima de `CastleSilhouette`, conservando sus
      dimensiones originales.
- [x] 7.4 Mantener la compatibilidad con `prefers-reduced-motion`, conservando el
      color de la luna pero eliminando destellos y animaciones.
- [x] 7.5 Validar visualmente el modo activo y la limpieza tras resolver o eliminar
      el encuentro.

## Fuera de este change

- Rediseño general del Castillo.
- Murciélago dorado.
- Audio, vibración o música.
- Cambios de balance, activación o recompensas de bosses.
