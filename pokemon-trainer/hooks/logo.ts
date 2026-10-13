// The Pokémon logo for the startup screen, downsampled from the supplied
// image to two sizes of half-block pixel art.

import { sprite } from './art'

const COLORS: Record<string, number> = {
  Y: 0xffcb05,
  D: 0xc49e08,
  B: 0x3564ad,
  N: 0x21386e,
}

export const LOGO_LARGE = sprite(
  [
    '...........................................BB...................................',
    '..........................................NBBB..................................',
    '..........................................BBDB..................................',
    '.........................................BBYDBB.................................',
    '........................................BBYYYBB.................................',
    '..............................BBNB.....BBYYYBB..................................',
    '.........BBBBBB...........BBBBBNBBB...BBBBBB.....BBBBBBBBBBB....................',
    '.....BBBBBBBBBBBB.......BBBBBDBBBDBB..NNBBBBBB..NBBBBBBBDDBB.....NBB............',
    '...BBBBDDYYYYYDDBB.....NBBYYYDBBBYDBB.BBBBDDBBBBNBBYYDBYYYBB....NNBBBBBBB.......',
    '..BBBYYYYYYYYYYYDBB....NBBBYYDBBYYYDBBBBYYYYDDBBBBYYYYBYYYDB....NNBDDDDBBNBBB...',
    '.BBBYYYYYYYYYYYYYDBB...NBBBYYDBYYYYYDBBYYYBYYYDBBBYYYYBYYYDB....BBBBYYYDBBBBBBBB',
    'NNBBYYYYYYYYYYYYYYBB...BBNBYYYYYYYYYBBYYBBBBYYBBBBYYYYDYYYDB...BBNBBYYYDBBBYDDBB',
    '.NNBYYYYYYYYBBBYYYDB....BNBYYYYYYYYBBBYYB.BYYBBNBBYYYYDYYYDBBBBBBBBBYYYDBBYYYYBB',
    '.NBBBYYYYYYYBBBBYYBBBBBBBBBYYYYYYYBBBYYYBBYYBBBBBBYYYYYYYYDBBBDDYDDBYYYYBBYYYDB.',
    '..BBBBBYYYYYDBBBYYBBBDYDDDBBYYYYYBB.BYYYBYYBBYDBBBYYYYYYYYYBYYBYYYDBBYYYDBYYYBB.',
    '..BBBBBBYYYYDBBBYBBBYYBYYYDBYYYYDDBBBBYYYYYDYYYDBBYYYYYYYYBBYBBYYBYDBYYYDBYYYBB.',
    '...BBBNBYYYYYBBYYBBYYBBYYDYBBYYYYYDDBBYYYYYYYYYYBBYYDYYYYDBYYBBBBBYDBYYYDYYYYB..',
    '.....NNBBYYYYDYYBBBYDBBBBBYBBYYYYYYYDBBYYYYYYYBBBYYYDBYBYDBYYDBBBYYDBYDYYYYYBB..',
    '......NNBYYYYYYBBBYYYDBBBYYBBYDBBYYYYDBBBBBBBBBBBYYYBBYBYDBYYYDDYYYBBYBYYYYYBB..',
    '......NNBBYYYYBBBBYYYDDDYYYBBYDBBBBYYYDDBBBBNBNBBYYYBBBBBDBYYYYYYYYBYDBYYYYYB...',
    '.......NBBYYYYBBNBYYYYYYYYYBYYDBNNBBBYYYDBBN..NBBBBDBBBBBDBBYYYYYYBBYDBYYYYBB...',
    '.......NNBBYYYDBNBBYYYYYYYBBYYDB.NNNBBBYYBB...NNNBBBBNBBBYDBBYYYBBBYYDBYYYYBB...',
    '.......BNBBYYYDBNNBBYYYYYBBBYYDB...NNNBBBBB......NNNBNNNBYYDBBBBBBBYYBBYYYYB....',
    '........NNBBYYDBBNNBBBBBBBNBBBBB.....NNNBBB...........NNBBBBBBB.NBBYYBBYYYBB....',
    '........NNBBYYYBB.NNNBBBB.NBBBBB.......NNNB...........NNNNBBBB..NNBBBBBYYYBB....',
    '.........NNBYYYDB..NNNN...NNN...........BN................NNNN..NNNNNBBYYYB.....',
    '.........NNBBYYBB...................................................NNBBYBB.....',
    '..........NNBBBBB...................................................NNNBBBB.....',
    '..........NNBBN.......................................................NNNN......',
    '...........NN...................................................................',
  ],
  COLORS,
)

export const LOGO_SMALL = sprite(
  [
    '................................BB..........................',
    '...............................NBB..........................',
    '...............................BYDB.........................',
    '..............................BBYYB.........................',
    '.........B...........BBBBB...BBYBB......BBBB................',
    '....BBBBBBBBB.....BBBBBBBBB.NNBBBB..NBBBBBDDB....BB.........',
    '..BBBYYYYYYDBB...NBBYYDBYYDBBBBBDBBBNBYYDBYDB...NBBBBBB.....',
    '.BBYYYYYYYYYDBB..NBBYYDBYYYBBYYYYYDBBBYYDYYYB...NBYYDDBBBBBB',
    'NNBYYYYYYYYYYDB..BBBYYDYYYYBYYBBBYYBBBYYDYYYB..BBBBYYDBBDDDB',
    '.NBYYYYYYBBBYDB..BBBYYYYYYBBYYBBYYBBBYYYYYYYBBBBBBBYYYBBYYBB',
    '.BBBBYYYYBBBYYBBBDDBBYYYYB.BYYBYYBDBBYYYYYYYBBYYYDBYYYBBYYB.',
    '..BBBBYYYDBBYBBYBYYDBYYYDDBBYYYYYYYDBBYYYYYBBYBBYYDBYYDYYYB.',
    '...BNBYYYYBYBBYYBYYYDBYYYYDDBYYYYYYBBYYBYYYBYYBBBYDBYYDYYBB.',
    '....NNBYYYYBBBYDBBBYDBYBYYYYDBBYYBBBBYYBYBYBYYDDYYBBDYYYYB..',
    '.....NBYYYDBBBYYDDYYBYYBBBYYYDBBBNNBBYYBBBBBYYYYYYBYBYYYYB..',
    '.....NNBYYDBNBYYYYYYBYYBNNBBYYYB..NBBBBBBBBDBYYYYBYYBYYYBB..',
    '......NBYYDBNBBYYYYBBYYB..NNBBDB...NNNNNNNBYDBBBBBYYBYYYB...',
    '......NBBYYBBNBBBBBNBBBB....NNBB.........NBBBBB.NBYDBYYYB...',
    '......NNBYYDB.NNNN.NBBB.......NN.........NNNNNB.NNBBBYYBB...',
    '.......NBYYBB......................................NBBYB....',
    '.......NNBBBB......................................NNBBB....',
    '........NB............................................N.....',
  ],
  COLORS,
)
