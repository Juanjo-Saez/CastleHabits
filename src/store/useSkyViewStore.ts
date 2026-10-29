import { create } from 'zustand'

interface SkyViewState {
  /** El Castillo está desplazado hacia arriba: se oculta la navegación para ver el cielo completo. */
  contemplating: boolean
  setContemplating: (value: boolean) => void
}

export const useSkyViewStore = create<SkyViewState>((set, get) => ({
  contemplating: false,
  setContemplating: (value) => {
    if (get().contemplating !== value) set({ contemplating: value })
  },
}))
