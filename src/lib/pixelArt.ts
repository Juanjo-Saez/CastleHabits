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

/** Murciélago gigante del primer boss: se dibuja la mitad izquierda y se refleja. */
const GIANT_BAT_HALF = [
  '.....OOO.................',
  '....OAAAO.O..............',
  '...OAAAAOOAOO............',
  '...OAAaaAOAOAO...........',
  '..OfaAOOAOAOAO...........',
  '..OffAAOOAAAO............',
  '..OfmaAAOOAO.............',
  '.OffmmaAAAAO.............',
  '.OffmmMaAAAO.............',
  '.OfmmmMMaaAAOO...........',
  '.OfmmMMMMaaAAAO......O...',
  '.OfmmMMMMaaaAAAO....OBO..',
  'OffmmMMMaaMaaaAAO...OBBO.',
  'OffmmMMMaaMaMMaAAO..OBBBO',
  'OffmmMMaMaMaMMMaAAO.OBBBB',
  'OfmmmMMaMaMaMMMMaAAOBBBBB',
  'OfmmmMaMaMMaMMMMMaABbbbBB',
  'OfmmmMaMaMMaMMMMMMaBOccBB',
  'OfmmmaMMaMMaMMMMMMMBBBBbb',
  'OfmmmaMMaMMMaMMMMMMMBBBbO',
  'OfmmaMMMaMMMaMMMMMMMBBFBO',
  'OffmaMMaMMMMaMMMMmmMMBFBB',
  'OffammmammMMaMMmmmmmBBBBB',
  '.OfammmammmmaMmmmmmmBBBbb',
  '.OaffmmammmmammmfffffBBbb',
  '..OOffmafffmammffOOOfBBBb',
  '....OfafOOffmaffO...OOBBb',
  '.....OaO..OffafO.....OBBB',
  '.....OaO...OfaO.......OBB',
  '......O.....OaO.......OBO',
  '.............O.........O.',
  '.........................',
]

function mirrorRow(half: string): string {
  return half + [...half].reverse().slice(1).join('')
}

export const GIANT_BAT = GIANT_BAT_HALF.map(mirrorRow)

export const GIANT_BAT_PALETTE: Palette = {
  O: '#0a0412',
  A: '#eadccf',
  a: '#a0847a',
  M: '#4d0f30',
  m: '#8f1d3c',
  f: '#f0742a',
  B: '#3c1a2c',
  b: '#6e3649',
  c: '#6af0ff',
  F: '#fff4d6',
}

/** Gaibon, el demonio alado de Slogra y Gaibon: se dibuja la mitad izquierda y se refleja. */
const GAIBON_HALF = [
'........OHOO.....',
  '.O.......OHHO....',
  'OAO.......OHHO...',
  'OwAO......OHHO...',
  'OwwAO......OHHOOO',
  'wwwwAO.....OHHRRR',
  'wwwwwAOO....OHHRR',
  'wwwwwwAAO..ORReRR',
  'wwwwwwwwAO.OReeRR',
  'aawwwwwwwAOORRRRR',
  'OwaaaawwwwAOORRLL',
  '.OWWWWaaaawARRFRF',
  '.OWWWWWWWWaaRrRRR',
  '..OWWWWWaaaarrrRR',
  '..OWOaaaWWWrrrrrR',
  '..OaaOOWWWarrrrrR',
  '...OO.OWWWarrrrrR',
  '......OWWaOrrrrrR',
  '.......OOaOrrrrrR',
  '.......OaO.OrrCRR',
  '........O...OCRRr',
  '............OCORr',
  '...........OCO.Or',
  '..........OCO..Or',
]

export const GAIBON = GAIBON_HALF.map(mirrorRow)

export const GAIBON_PALETTE: Palette = {
  O: '#0a0412',
  A: '#eadccf',
  a: '#a0847a',
  W: '#7b1f3a',
  w: '#c4453f',
  R: '#c8312b',
  r: '#7d1b24',
  L: '#f08a4a',
  H: '#efe3cf',
  e: '#ffe45a',
  F: '#fff4d6',
  C: '#efe3cf',
}

/** Slogra, el esqueleto con lanza. */
export const SLOGRA = [
'.......................O....',
  '......................OTO...',
  '.........O...........OTTTO..',
  '.......OOBOO.........OTTTTO.',
  '......OBBBBBO.........OSSSO.',
  '....OOBBBBBBBO.........OSSO.',
  '...ObBBeeBBBBBO.......OSSO..',
  '..ObbBBBBBBBBBO.......OSSO..',
  '.ObbbBBBBBBBBBO.......OSSO..',
  '..ObbMMBBBBBBO........OSSO..',
  '...OOOOMMBBBBO........OSSO..',
  '.......OOBOOBBO......OSSO...',
  '.........OOOBBOOOOOO.OSSO...',
  '.........ObbbBBBBBBBOOSSO...',
  '........ObbbbbMMMMBBOOSSO...',
  '.........ObbbBBBBBBBBOSSO...',
  '..........OOOOMMMMMOBBSO....',
  '............OBBBBBBBOBBBO...',
  '.............OMMMMMOOBBBO...',
  '............OBBBBBBOOBBBO...',
  '.............OMMMMMOOSSO....',
  '............OBBBBBBOOSSO....',
  '.............OObbbOOSSO.....',
  '..............OBBbbbbbOOOO..',
  '.............OBBOBBOSbbbbbOO',
  '.............OBBOOBBSSOOObbb',
  '............OBBO.OBBSSO..OOb',
  '...........OBBO...OBBO....Ob',
  '............OBBO..OSBBO....O',
  '.............OBBO.OSSBBO....',
  '..............OBBOOSSOBBO...',
  '............OOOBBBOSSOOBBO..',
  '..........OOBBBBOOSSOBBBO...',
  '.........OBBBOOO.OSBBBOO....',
  '..........OOO...OBBBOO......',
  '.................OOO........',
]

export const SLOGRA_PALETTE: Palette = {
  O: '#0a0412',
  B: '#e9dec9',
  b: '#a5927f',
  M: '#1b0f1c',
  e: '#ffe45a',
  S: '#7a5a3a',
  T: '#d7deea',
}

/** Legion: esfera de cuerpos alrededor de un núcleo dorado. */
export const LEGION = [
  '........OOOO........',
  '.....OOmmmmOOO......',
  '...OOmMmmmmmMOO....',
  '..OmMmmmGmmmMmmO...',
  '.OmMmmGGLGGmmmMmO..',
  'OmMmmGLLPLLGmmmMO..',
  'OmMmmGLLPLLGmmmMO..',
  'OmMmmmGGLGGmmmmMO..',
  '.OmMmmmmmmmmmmMmO..',
  '..OmMmmmmmmmmMmO...',
  '...OmMmmmmmMmO.....',
  '....OmMmmmmMO......',
  '.....OmMmmMO.......',
  '......OmMMO........',
  '.......OOO.........',
]

export const LEGION_PALETTE: Palette = {
  O: '#0a0412',
  M: '#3d1835',
  m: '#7d2c4f',
  G: '#c9a24b',
  L: '#f3e3a8',
  P: '#150d1c',
}

/** Frankenstein: cuerpo cosido bajo una descarga eléctrica. */
export const FRANKENSTEIN = [
  '....OO......OO....',
  '...ObBO....OObO...',
  '..ObBBBOOOObBBbO..',
  '..OBBmmGGmmBBO...',
  '..OBmGLLLGmBO....',
  '...OmGLLLGmO.....',
  '...OmMmmmMO......',
  '..OmMmmmmMO......',
  '..OmMmmmmMO......',
  '...OOmMmOO.......',
  '....OmMmO........',
  '...OmMmmMO.......',
  '..OmMmmmmMO......',
  '.OOO......OOO....',
]

export const FRANKENSTEIN_PALETTE: Palette = {
  O: '#0a0412',
  B: '#9aa5a6',
  b: '#d7deea',
  m: '#315b4a',
  M: '#1b3028',
  G: '#c9a24b',
  L: '#f3e3a8',
}

/** Succubus: una figura alada rodeada por la niebla de rosas. */
export const SUCCUBUS = [
  '......OOO......',
  '....OOrrrOO....',
  '...OrrLLLrrO...',
  '..OrrLPLPLrrO..',
  '..OrrLLLLLrrO..',
  '...OrrLrrrO....',
  '...OOmMmOO.....',
  '..OmmMMMmmO....',
  '.OmmMMMMMmmO...',
  '.OmmMMMMMmmO...',
  '..OmmMMMmmO....',
  '...OmmMmmO.....',
  '..OOO...OOO....',
]

export const SUCCUBUS_PALETTE: Palette = {
  O: '#0a0412',
  r: '#8f1d3c',
  L: '#f3b4c8',
  P: '#4d0f30',
  m: '#5d2b63',
  M: '#2a1638',
}

/** Medusa: una mirada dorada bajo una corona de serpientes. */
export const MEDUSA = [
  '....OOO.OOO....',
  '...OgggOgggO...',
  '..OgggOOOgggO..',
  '..OggLLLLgggO..',
  '..OggLPLPgggO..',
  '...OggLLgggO...',
  '....OOmMmOO....',
  '...OmmMMMmmO...',
  '..OmmMMMMMmmO..',
  '..OmmMMMMMmmO..',
  '...OmmMMMmmO...',
  '....OO...OO....',
  '...OO.....OO...',
]

export const MEDUSA_PALETTE: Palette = {
  O: '#0a0412',
  g: '#4d8c78',
  L: '#f3e3a8',
  P: '#8f1d3c',
  m: '#5d2b63',
  M: '#2a1638',
}

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
