// Pixel art original. Cada string es una fila; '.' = transparente, el resto se mapea con una paleta.

export type Palette = Record<string, string>

export const OUTLINE = '#05060f'

export const CANDLE_FLAME = [
  '....f....',
  '...fYf...',
  '...YWY...',
  '..fYWYf..',
  '..fYWYf..',
  '...fYf...',
]

export const CANDLE_BODY = [
  '....k....',
  '..OXXxO..',
  '..OXXxO..',
  '..OXXxO..',
  '..OXXxO..',
  '..OXXxO..',
  '.OGGGGGO.',
  'OGgGGGgGO',
  '...OGO...',
  '.OGGGGGO.',
]

export const CANDLE_PALETTE: Palette = {
  O: OUTLINE,
  X: '#efe4c8',
  x: '#b9a987',
  k: '#1a1208',
  G: '#c9a24b',
  g: '#6e5416',
  f: '#d8283f',
  Y: '#ff9f2e',
  W: '#fff4c2',
}

export const HUNTER = [
  '.....OOOOOO.....',
  '....OHHHHHHO....',
  '...OHHHHHHHHO...',
  '..OHHhhhhhhHHO..',
  '..OHhSSSSSShHO..',
  '..OHhSEsSEShHO..',
  '..OHhSSssSShHO..',
  '..OHhhSSSShhHO..',
  '.OHHhhOSSOhhHHO.',
  'OCCHRRRRRRRRHCCO',
  'OCcCRRRRRRRRCcCO',
  'OCcCCTTRRTTCCcCO',
  'OCcCCCTRRTCCCcCO',
  'OCcCCCCTTCCCCcCO',
  'OCcCCCCCCCCCCcCO',
  'OOOOOOOOOOOOOOOO',
]

export const HEART = [
  '.RR.RR.',
  'RLRRRRR',
  'RRRRRRR',
  '.RRRRR.',
  '..RRR..',
  '...R...',
]

export const HEART_PALETTE: Palette = { R: '#d8283f', L: '#ff9a9a' }

export const COIN = [
  '..OOO..',
  '.OGLGO.',
  'OGLGGgO',
  'OGGGGgO',
  'OGGGggO',
  '.OGggO.',
  '..OOO..',
]

export const COIN_PALETTE: Palette = {
  O: '#3a2a06',
  G: '#e2c275',
  L: '#fff4c2',
  g: '#8f7228',
}

export const SKULL = [
  '.OOOOO.',
  'OBBBBBO',
  'OBKBKBO',
  'OBKBKBO',
  'OBBKBBO',
  '.OBBBO.',
  '.OBOBO.',
]

export const SKULL_PALETTE: Palette = { O: OUTLINE, K: OUTLINE, B: '#e8e4d0' }
export const SKULL_DIM_PALETTE: Palette = { O: OUTLINE, K: OUTLINE, B: '#3b4058' }

export const ORB = [
  '..OOOO..',
  '.OmLmmO.',
  'OmLLmmmO',
  'OmLmmmdO',
  'OmmmmmdO',
  'OmmmmddO',
  '.OmdddO.',
  '..OOOO..',
]

export const BAT_A = [
  'O.........O',
  'OO..O.O..OO',
  '.OOOeOeOOO.',
  '...OOOOO...',
  '....O.O....',
]

export const BAT_B = [
  '....O.O....',
  '...OeOeO...',
  '.OOOOOOOOO.',
  'OO.......OO',
  'O.........O',
]

export const BAT_PALETTE: Palette = { O: '#0d0818', e: '#d8283f' }

export const DIAMOND = ['..G..', '.GLG.', 'GLRLG', '.GLG.', '..G..']

export const ORNAMENT = [
  '.......G.......',
  '......GLG......',
  '..G..GLRLG..G..',
  '.GLGGLRRRLGGLG.',
  '..G..GLRLG..G..',
  '......GLG......',
  '.......G.......',
]

export const GOLD_GEM_PALETTE: Palette = {
  G: '#c9a24b',
  L: '#f3e3a8',
  R: '#d8283f',
}

export const NAV_CANDLE = [
  '....S....',
  '...SSS...',
  '....S....',
  '...SSS...',
  '...SSS...',
  '...SSS...',
  '...SSS...',
  '.SSSSSSS.',
  '..SSSSS..',
]

export const NAV_CASTLE = [
  'S.S...S.S',
  'SSS.S.SSS',
  'SSSSSSSSS',
  'SdSSSSSdS',
  'SSSSdSSSS',
  'SSSSSSSSS',
  'SSSdddSSS',
  'SSSdddSSS',
  'SSSdddSSS',
]

export const NAV_MAP = [
  'SSSS.....',
  'S..S.....',
  'SSSSSSSSS',
  '...S..S.S',
  '...SSSSSS',
  '...S.....',
  'SSSSSS...',
  'S....S...',
  'SSSSSS...',
]

export const NAV_CROSS = [
  '...SSS...',
  '...SSS...',
  'SSSSSSSSS',
  'SSSSSSSSS',
  'SSSSSSSSS',
  '...SSS...',
  '...SSS...',
  '...SSS...',
  '...SSS...',
]

export const CURRENT_COLOR_PALETTE: Palette = { S: 'currentColor', d: '#05060f' }
