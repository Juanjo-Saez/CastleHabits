# Cambio: Boss Legion — Escudo y ruptura

Implementa el primer boss que usa una defensa previa al núcleo y da la bolsa de oro, que ya existe en el motor pero todavía no tiene una fuente.

## Mecánica

- Ventana de **3 días**.
- La **cáscara** necesita 3 golpes de tareas medias o difíciles.
- Mientras la cáscara siga intacta, los golpes no dañan el núcleo.
- Después de romperla, cualquier tarea cumplida daña el núcleo según su dificultad.
- La meta del núcleo se calcula al activar el encuentro:
  `clamp(round(cargaDiaria × 3 × 1,2), 8, 50)`.
- El progreso se deriva de las completaciones reales y respeta una completación por tarea y día.

## Entorno y derrota

- **Cuerpos sin descanso:** el daño por fallo se multiplica ×1,5 mientras Legion está activo.
- Al terminar la ventana sin vencerlo, inflige 15 de daño directo y aplica **Pesadez** durante 7 días.

## Premios

- 110 EXP y 90 monedas, escalados por nivel.
- Sello de aplazamiento: 50 %.
- Poción de vigor: 30 %.
- Bolsa de oro: 35 %, con 50–150 monedas.
- El látigo queda fuera de este change y se añadirá con `boss-premios-elite`.
- No se implementan aquí almas, reliquias ni élites.

## Fuera de alcance

- Otros bosses, disparadores reactivos y la selección de élite.
- Látigo y cualquier cosmético.
