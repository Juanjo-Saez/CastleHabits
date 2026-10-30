/**
 * Geometría del castillo pixel-art (`src/assets/castle.png`), generado desde la
 * referencia autorizada con `scripts/extract-castle.py`.
 */
export const CASTLE_ART = {
  width: 738,
  height: 414,
  /** Fila donde empieza el suelo, que se prolonga a los lados en pantallas anchas. */
  horizon: 341,
  /** Eje de la torre central: se mantiene centrado al recortar los laterales. */
  focusX: 408,
} as const

/** Variables CSS que posicionan el asset sin duplicar sus coordenadas en la hoja de estilos. */
export function castleArtGeometry(): Record<'--castle-focus' | '--castle-ground', string> {
  const percent = (value: number) => `${Number(value.toFixed(4))}%`
  return {
    '--castle-focus': percent((CASTLE_ART.focusX / CASTLE_ART.width) * 100),
    '--castle-ground': percent(((CASTLE_ART.height - CASTLE_ART.horizon) / CASTLE_ART.height) * 100),
  }
}
