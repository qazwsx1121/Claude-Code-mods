// Pixel art for the battle band: Pikachu (a 21 by 20 sprite) as terminal half-block cells (two
// pixels per cell, top in the foreground, bottom in the background) and the
// same sprite as an SVG for the surfaces that draw Svg instead of Raster.

const CLEAR = 0x01000000
const UPPER_HALF = 0x2580
const LOWER_HALF = 0x2584
const SPACE = 0x20

const SPRITE = [
  '......KK.............',
  '.....KGK.........KK..',
  '.....KGK........KYDK.',
  '....KDDK....KKKKYDDDK',
  '....KDOK..KKGGGYDDDDK',
  '...KKDK..KYYGGDDDDDK.',
  '..KDYYYKKYYYGDDDDDK..',
  '.KYYYYYYOYYGDDDDDK...',
  '.KYYYYDYYYOKKDDDK....',
  'KYYYYDWKYYYKWKDDDK...',
  'KYOYYYKGYYYYKWKDDK...',
  '.KYYYYYRRYYYYKDDK....',
  'KDGDYYYRRYYYBGBK.....',
  '.KKKDDYYGYYYYYGBK....',
  '....KDDGYYGYYBGK.....',
  '....KDDYGGYYYYK......',
  '.....KDDYYYYYGK......',
  '......KKKYYYYK.......',
  '.........KKYK........',
  '..........KK.........',
]

const COLORS: Record<string, number> = {
  K: 0x313131,
  G: 0x525252,
  Y: 0xf7d631,
  D: 0xc5a529,
  O: 0x9c8442,
  B: 0xb57329,
  R: 0xf76352,
  W: 0xffffff,
}

export const PIKACHU_COLUMNS = SPRITE[0]?.length ?? 0
export const PIKACHU_ROWS = SPRITE.length / 2

function colorAt(x: number, y: number): number {
  const ch = SPRITE[y]?.[x] ?? '.'

  return COLORS[ch] ?? CLEAR
}

/** Pikachu as `PIKACHU_COLUMNS` by `PIKACHU_ROWS` cells, packed for a Raster. */
export function pikachuCells(): string {
  const view = new DataView(new ArrayBuffer(PIKACHU_COLUMNS * PIKACHU_ROWS * 12))
  let at = 0

  for (let row = 0; row < PIKACHU_ROWS; row++) {
    for (let x = 0; x < PIKACHU_COLUMNS; x++) {
      const top = colorAt(x, row * 2)
      const bottom = colorAt(x, row * 2 + 1)
      let cell: [number, number, number]
      if (top === CLEAR && bottom === CLEAR) cell = [SPACE, CLEAR, CLEAR]
      else if (top === CLEAR) cell = [LOWER_HALF, bottom, CLEAR]
      else cell = [UPPER_HALF, top, bottom]
      for (const word of cell) {
        view.setUint32(at, word, true)
        at += 4
      }
    }
  }

  let binary = ''
  for (const byte of new Uint8Array(view.buffer)) binary += String.fromCharCode(byte)

  return btoa(binary)
}

function svg(): string {
  let rects = ''
  for (let y = 0; y < SPRITE.length; y++) {
    for (let x = 0; x < PIKACHU_COLUMNS; x++) {
      const color = colorAt(x, y)
      if (color === CLEAR) continue
      const hex = color.toString(16).padStart(6, '0')
      rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="#${hex}"/>`
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PIKACHU_COLUMNS} ${SPRITE.length}" shape-rendering="crispEdges">${rects}</svg>`
}

export const PIKACHU_SVG = svg()
