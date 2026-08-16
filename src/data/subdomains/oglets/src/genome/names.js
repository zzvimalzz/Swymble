/* Names are derived from the code, never stored: the same Oglet is called the same thing on
   every device it is ever opened on, with no backend and nothing to keep in sync. 320
   possibilities is plenty — you only ever meet one. */

import { encode } from './codec.js'
import { hash } from './hash.js'

const HEADS = ['Pob', 'Nix', 'Tur', 'Mol', 'Bim', 'Kes', 'Lun', 'Fip', 'Wob', 'Rue',
  'Zar', 'Hix', 'Gom', 'Mip', 'Syl', 'Dob', 'Vun', 'Tam', 'Orr', 'Quil']
const TAILS = ['ble', 'it', 'low', 'ly', 'py', 'kin', 'na', 'o',
  'er', 'us', 'ie', 'by', 'en', 'im', 'or', 'et']

export function nameOf(genomeOrCode) {
  const code = typeof genomeOrCode === 'string' ? genomeOrCode : encode(genomeOrCode)
  const h = hash(`name:${code}`)
  return HEADS[h % HEADS.length] + TAILS[(h >>> 7) % TAILS.length]
}
