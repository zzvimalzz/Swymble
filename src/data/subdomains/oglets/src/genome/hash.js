/* FNV-1a. Used for everything that must look arbitrary but stay identical forever: an Oglet's
   name, and the two asymmetry genes, which are too small to be worth spending code characters
   on. Never use Math.random() for any of that — the same code has to draw the same creature on
   every device it is ever opened on. */

export function hash(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
