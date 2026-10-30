# Tareas — rediseño visual del Castillo y climas diarios

## Diseño y contrato

- [x] 1.1 Confirmar la composición de referencia adaptada: torre central
      dominante, luna detrás y visible sobre las torres, muralla, puerta,
      ventanas cálidas y capas lejanas.
- [x] 1.2 Confirmar el catálogo inicial de climas y decidir si `eclipse` entra
      en el primer incremento o queda preparado para una iteración posterior.
- [x] 1.3 Confirmar los pesos iniciales del clima y documentar que solo afectan
      a la presentación, nunca al gameplay.
- [x] 1.4 Definir el contrato de anclas compartidas entre `Backdrop`, el castillo
      y `BossSky`, incluyendo la posición de la luna y del boss.
- [x] 1.5 Documentar los estados de accesibilidad y la estrategia responsive de
      proporción preservada con recorte.

## Modelo de clima

- [x] 2.1 Crear los tipos de clima y sus perfiles visuales en `src/lib`, sin
      acoplarlos a los stores de tareas, jugador o bosses.
- [x] 2.2 Implementar una semilla estable por instalación y fecha operativa para
      seleccionar el clima una sola vez por día.
- [x] 2.3 Usar el corte de las 02:00 y verificar que la transición de día cambia
      el clima exactamente cuando cambia el día operativo.
- [x] 2.4 Añadir una ruta segura para almacenamiento local no disponible sin
      inventar datos de gameplay ni bloquear la pantalla.
- [x] 2.5 Implementar la prioridad visual `boss activo > clima diario > estado
      base`, manteniendo el encuentro como única fuente de verdad del boss.

## Nueva escena del Castillo

- [x] 3.1 Rehacer `CastleSilhouette` o extraer un componente de escena con
      geometría original, capas lejanas, torre central, muralla, puerta, agujas
      y ventanas.
- [x] 3.2 Crear un sistema de proporción y recorte que mantenga la relación
      entre castillo, luna y ancla del boss en móvil y escritorio.
- [x] 3.3 Separar las capas permanentes de las capas temporales de clima para que
      cada estado pueda activar solo sus efectos necesarios.
- [x] 3.4 Añadir fondos de cielo despejado y nublado, con contraste suficiente
      para que el castillo no se pierda.
- [x] 3.5 Añadir niebla en varias profundidades sin tapar la puerta, el boss ni
      los controles.
- [x] 3.6 Añadir lluvia y tormenta normal con animaciones sutiles y sin competir
      con la tormenta especial de los bosses.
- [x] 3.7 Añadir el estado de eclipse si se mantiene dentro del primer alcance.
- [x] 3.8 Mantener la luna en `112×112 px` y corregir posición/capas sin volver
      a introducir un escalado responsive que la deforme o encoja.

## Integración con la pantalla

- [x] 4.1 Integrar la nueva escena en `Backdrop` sin cambiar la lógica de
      tareas, vida, EXP, oro o expediciones.
- [x] 4.2 Integrar `BossSky` con las mismas anclas geométricas para evitar que el
      boss se desplace respecto a la luna al cambiar de viewport.
- [x] 4.3 Mantener la navegación vertical, la parada intermedia, el scroll
      táctil y el botón de retorno a las tareas.
- [x] 4.4 Verificar que la escena no crea una nueva capa por encima del HUD ni
      intercepta clics, teclado o scroll de los controles.
- [x] 4.5 Mantener la luna roja, los relámpagos persistentes y la presentación
      cinematográfica existentes como sobrescrituras del clima diario.

## Accesibilidad y responsive

- [x] 5.1 Marcar efectos puramente decorativos como `aria-hidden` y exponer el
      estado atmosférico como texto no intrusivo cuando corresponda.
- [x] 5.2 Añadir estilos para `prefers-reduced-motion` que mantengan composición
      y contraste, pero desactiven lluvia, niebla móvil, flashes y oscilaciones.
- [x] 5.3 Verificar foco, teclado y etiquetas del boss y del botón de retorno
      sobre cada estado atmosférico.
- [x] 5.4 Validar al menos 390×844, 768×1024, 1024×768 y 1440×900.
- [x] 5.5 Comprobar que los textos del cielo y el castillo siguen siendo
      legibles sobre todos los climas.

## Tests

- [x] 6.1 Probar la selección determinista: misma fecha y semilla producen el
      mismo clima; fechas distintas pueden producir estados distintos.
- [x] 6.2 Probar el cambio de día operativo a las 02:00.
- [x] 6.3 Probar todos los estados del catálogo y que los pesos son válidos.
- [x] 6.4 Probar que un boss activo siempre sobrescribe el clima normal sin
      alterar el encuentro ni el perfil.
- [x] 6.5 Probar el fallback cuando `localStorage` no está disponible.
- [x] 6.6 Mantener y ejecutar la suite existente de bosses, progresión,
      correcciones históricas y tareas.

## Verificación visual

- [x] 7.1 Capturar el estado despejado y comprobar la nueva silueta del castillo.
- [x] 7.2 Capturar niebla y lluvia, verificando profundidad y legibilidad.
- [x] 7.3 Capturar tormenta normal y comprobar que no se confunde con un boss.
- [x] 7.4 Capturar eclipse si se incluye en el primer incremento.
- [x] 7.5 Capturar un boss activo y verificar luna roja, rayos y alineación.
- [x] 7.6 Repetir las comprobaciones en móvil y escritorio.
- [x] 7.7 Repetir la comprobación con `prefers-reduced-motion`.
- [x] 7.8 Ejecutar `npm test`, `npx tsc -b`, `npm run build`, ESLint focalizado
      y `git diff --check`.

## Fuera de este change

- Murciélago dorado.
- Nuevas reglas o recompensas de bosses.
- Climas que causen daño, concedan recursos o alteren la progresión.
- Audio, música y vibración.
