# Tareas: Drácula

- [x] Confirmar hitos, prioridad, fases, efectos, derrota, revancha y premios.
- [x] Crear la especificación individual a partir de las reglas acordadas.
- [x] Añadir Drácula al catálogo y persistir su estado de hitos, fases y revancha.
- [x] Implementar hitos únicos por expedición, fusión de pendientes y activación
  prioritaria al terminar otro boss.
- [x] Implementar las fases Humano, Murciélago y Demonio con ventanas de cuatro
  días, progresión derivada, transición al día siguiente y derrota al cierre de fase.
- [x] Aplicar Noche eterna, Marca de Drácula y su eliminación al vencer la
  revancha.
- [x] Conceder EXP/oro, Corona permanente y alma con probabilidad base del 2 %
  y piedad; conservar cosmético y bestiario al renacer.
- [x] Mostrar fase y progreso en el encuentro, y recompensa/Marca en Perfil y
  Bestiario.
- [x] Actualizar el plantel y `Todo.md`; añadir pruebas focalizadas.
- [x] Ejecutar tests y build.
- [ ] Ejecutar lint del repositorio; bloqueado por el error preexistente
  `react-hooks/set-state-in-effect` en `src/components/NumberField.tsx`.

## Ajuste confirmado: orden y arte finales

- [x] Cambiar el orden a Humano → Murciélago (daño por tareas) → Demonio (cuatro
  días sin fallos de obligaciones/pergaminos).
- [x] Integrar el nuevo diseño humano sin fondo ni firma, Dracula Bat sin
  cambios y el recorte transparente del demonio y su bola de fuego.
- [x] Mantener compatibilidad con el nombre antiguo del objetivo guardado de
  daño en encuentros existentes.
