// Pixel art drawn as terminal half-block cells (two pixels per cell, top in
// the foreground, bottom in the background), and the same pixels as an SVG
// for the surfaces that draw Svg instead of Raster.

const CLEAR = 0x01000000
const UPPER_HALF = 0x2580
const LOWER_HALF = 0x2584
const SPACE = 0x20

export type Sprite = {
  /** Terminal columns: one per pixel across. */
  columns: number
  /** Terminal rows: one per two pixels down. */
  rows: number
  /** The cells, packed for a Raster's `cells`. */
  cells: string
  svg: string
}

/** A sprite from rows of one letter per pixel, `.` clear, each letter a color. */
export function sprite(pixels: readonly string[], colors: Record<string, number>): Sprite {
  const columns = Math.max(...pixels.map(row => row.length))
  const rows = Math.ceil(pixels.length / 2)
  const colorAt = (x: number, y: number): number => colors[pixels[y]?.[x] ?? '.'] ?? CLEAR

  const view = new DataView(new ArrayBuffer(columns * rows * 12))
  let at = 0
  for (let row = 0; row < rows; row++) {
    for (let x = 0; x < columns; x++) {
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

  let rects = ''
  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < columns; x++) {
      const color = colorAt(x, y)
      if (color === CLEAR) continue
      const hex = color.toString(16).padStart(6, '0')
      rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="#${hex}"/>`
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${columns} ${pixels.length}" shape-rendering="crispEdges">${rects}</svg>`

  return { columns, rows, cells: btoa(binary), svg }
}

// Pikachu, a 21 by 20 sprite from the supplied pixel art.
const PIKACHU_PIXELS = [
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

const PIKACHU_COLORS: Record<string, number> = {
  K: 0x313131,
  G: 0x525252,
  Y: 0xf7d631,
  D: 0xc5a529,
  O: 0x9c8442,
  B: 0xb57329,
  R: 0xf76352,
  W: 0xffffff,
}

export const PIKACHU = sprite(PIKACHU_PIXELS, PIKACHU_COLORS)

// The same Pikachu at half size (11 by 10), for a terminal too narrow or too
// short for the full sprite: zooming a terminal out and in changes its cells.
const PIKACHU_SMALL_PIXELS = [
  '..KK....KK.',
  '..KK..KKYDK',
  '.KKKKKGDDDK',
  'KYYYYYDDDK.',
  'KYYWYKWDK..',
  'KYYRRYWDK..',
  'KKDRRYYBK..',
  '..KDYYYK...',
  '..KKYYYK...',
  '....KKK....',
]

export const PIKACHU_SMALL = sprite(PIKACHU_SMALL_PIXELS, PIKACHU_COLORS)
