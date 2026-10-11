// Pixel art for the battle band: a Poké Ball as terminal half-block cells
// (two pixels per cell, top in the foreground, bottom in the background) and
// the same ball as an SVG for the surfaces that draw Svg instead of Raster.

const CLEAR = 0x01000000
const UPPER_HALF = 0x2580
const LOWER_HALF = 0x2584
const SPACE = 0x20

const INK = 0x1a1a1a
const RED = 0xee1515
const RED_SHADE = 0xa80c0c
const WHITE = 0xf4f4f4
const WHITE_SHADE = 0xbcbcbc
const SHINE = 0xffffff

function pixel(x: number, y: number, size: number): number {
  const c = (size - 1) / 2
  const r = size / 2
  const d = Math.hypot(x - c, y - c)

  if (d > r) return CLEAR
  if (d > r - 1) return INK
  if (d <= size * 0.11) return SHINE
  if (d <= size * 0.2) return INK
  if (Math.abs(y - c) <= 0.5) return INK
  if (y < c) {
    if (Math.hypot(x - size * 0.27, y - size * 0.24) < size * 0.09) return SHINE
    return x - c > r * 0.45 && d > r - 2.2 ? RED_SHADE : RED
  }

  return x + y > 2 * c + r * 0.6 && d > r - 2.2 ? WHITE_SHADE : WHITE
}

/** The ball `size` pixels across: `size` columns by `size / 2` rows of cells. */
export function pokeballCells(size: number): string {
  const rows = Math.ceil(size / 2)
  const view = new DataView(new ArrayBuffer(size * rows * 12))
  let at = 0

  for (let row = 0; row < rows; row++) {
    for (let x = 0; x < size; x++) {
      const top = pixel(x, row * 2, size)
      const bottom = row * 2 + 1 < size ? pixel(x, row * 2 + 1, size) : CLEAR
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

export const POKEBALL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<circle cx="50" cy="50" r="45" fill="#f4f4f4"/>
<path d="M5 50a45 45 0 0 1 90 0z" fill="#ee1515"/>
<ellipse cx="31" cy="26" rx="8" ry="4.5" fill="#fff" opacity=".75" transform="rotate(-35 31 26)"/>
<circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a1a" stroke-width="6"/>
<rect x="5" y="45" width="90" height="10" fill="#1a1a1a"/>
<circle cx="50" cy="50" r="15" fill="#f4f4f4" stroke="#1a1a1a" stroke-width="7"/>
<circle cx="50" cy="50" r="6" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
</svg>`
