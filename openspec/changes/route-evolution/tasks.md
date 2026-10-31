# Tareas — Evolución de rutas, ramas y recompensas

> Borrador pendiente de validar `proposal.md`. No comenzar implementación hasta
> cerrar las decisiones abiertas.

## Diseño

- [ ] Confirmar nombres, actividades, dificultad y tipo de registro de las tres ramas candidatas.
- [ ] Definir identificadores y relación entre rutas, ramas, etapas, misiones y actividades sin duplicar misiones.
- [ ] Cerrar el objetivo semanal, el comportamiento de ventanas fallidas y cómo evolucionan los objetivos entre etapas.
- [ ] Definir tareas compartidas entre ramas y el efecto de editar, archivar o reactivar actividades sobre el progreso histórico.
- [ ] Definir requisitos, contenido y presentación de rutas bloqueadas y secretas.
- [ ] Acordar tipos, cantidades, equipamiento y límites de recompensas; coordinar títulos/cosméticos con el change de bosses.
- [ ] Definir etapas de maestría tras nivel 5 sin alterar pasivas existentes.

## Modelo y compatibilidad

- [ ] Añadir estado de ramas y etapas con claves estables e idempotentes por expedición.
- [ ] Normalizar perfiles existentes y verificar importación/exportación de backups.
- [ ] Conservar el progreso y las pasivas actuales de Vampire Hunter, Technomancer y Castle Within.
- [ ] Registrar concesiones de recompensas para evitar duplicados en reintentos, correcciones y restauración de backups.

## Progreso y economía

- [ ] Implementar evaluación determinista de etapas paralelas y ventanas de siete días.
- [ ] Integrar correcciones de días y resumen diario sin duplicar ni retirar premios concedidos.
- [ ] Aplicar política de archivado sin borrar los registros históricos ya completados.
- [ ] Asegurar que premios de ramas no concedan EXP, oro ni consumibles mientras ese alcance siga excluido.

## Interfaz

- [ ] Presentar las ramas nuevas junto a su ruta base sin cambiar las tarjetas ni acciones existentes.
- [ ] Añadir selección de rama a los flujos de creación y edición de actividades compatibles.
- [ ] Permitir gestionar actividades de rama y comunicar el efecto de archivarlas.
- [ ] Ocultar rutas bloqueadas/secretas hasta satisfacer sus requisitos y revelar su contenido al descubrirlas.
- [ ] Mostrar progreso por etapa, requisitos siguientes, premio y avisos de desbloqueo/mejora.
- [ ] Permitir equipar las nuevas mejoras sin acumular efectos fuera de los límites acordados.

## Validación

- [ ] Añadir pruebas unitarias de umbrales, ventanas, fallos permitidos, etapas y ramas paralelas.
- [ ] Añadir pruebas de correcciones, archivado, descubrimiento y premios idempotentes.
- [ ] Añadir pruebas de migración/normalización y round-trip de backups con perfiles antiguos y nuevos.
- [ ] Ejecutar `npm test`, `npm run build` y `npm run lint`.
- [ ] Validar visualmente rutas, ramas, estados bloqueados y avisos en navegador.
