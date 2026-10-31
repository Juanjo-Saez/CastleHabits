# Tareas — Hidra / Escila

## Diseño y datos

- [x] Confirmar la escala 2/4/6 PV y que los fallos protegidos cancelan la cura.
- [x] Añadir Hidra / Escila, su objetivo, disparador, entorno, maldición y
      recompensa al catálogo.
- [x] Añadir Veneno de hidra, curable con una poción de vigor.
- [x] Añadir la pasiva diaria del alma al catálogo y al registro idempotente.

## Mecánica

- [x] Derivar cabezas cortadas y crecidas de completados y fallos reales.
- [x] Contabilizar el crecimiento al cierre y diferir la victoria hasta ese
      cierre.
- [x] Implementar disparador de tres fallos recientes en una zona.
- [x] Curar 2/4/6 PV al amanecer solo si el día cerrado no registró fallos.

## Interfaz

- [x] Mostrar cabezas actuales, cortes, crecimiento y regla de cierre.
- [x] Resaltar las tareas que pueden cortar una cabeza.
- [x] Añadir el sprite de Hidra / Escila y explicar la maldición en el catálogo.
- [x] Permitir usar la poción de vigor para curar el veneno aunque la vida esté
      llena.

## Verificación

- [x] Cubrir disparador, fallos protegidos, progresión, cierre y resultado.
- [x] Cubrir la pasiva por rango e idempotencia.
- [x] Ejecutar tests, TypeScript, build y lint focalizado.
- [ ] Validar visualmente el encuentro en navegador.
