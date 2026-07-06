import type { VoroforceInstance } from '../types'
import { type FilmFilters, getRandomFilteredCellId } from './films'

// Jumps to a cell and selects it so its film card opens - the shared code
// path for "Surprise me", the Space hotkey, title search and favorites,
// keeping the selected card and the zoomed tile in sync (both derive from
// the same cell).
//
// The engine's own navigateToCell glides the pointer toward the cell with an
// eased, speed-capped pin - but any stray pointermove while it is mid-flight
// freezes the pointer where it currently is (see onPointerMove in
// voroforce/controls/controls.js), so for far-away cells the view never
// arrived. For deliberate jumps we teleport instead: place the pointer (and
// its easing history) directly on the cell, focus it and pin there.
export const jumpToCellById = (
  voroforce: VoroforceInstance,
  cellId: number,
) => {
  const cell = voroforce.cells.find((c) => c.id === cellId)
  if (!cell) return false

  const controls = voroforce.controls as VoroforceInstance['controls'] & {
    lastPosition?: { x: number; y: number }
    position?: { x: number; y: number }
    assignPointer: (data: Record<string, unknown>) => void
    focusCell: (cellOrCellIndex: unknown) => void
  }

  controls.selectCell(cell)

  const position = { x: cell.x, y: cell.y }
  controls.pinPointer(cell)
  controls.lastPosition = { ...position }
  controls.position = { ...position }
  controls.assignPointer({ ...position, speedScale: 0 })
  controls.focusCell(cell.index)

  return true
}

export const jumpToRandomFilteredCell = async (
  voroforce: VoroforceInstance,
  filters?: FilmFilters,
): Promise<boolean> => {
  const cellId = await getRandomFilteredCellId(filters)
  if (typeof cellId !== 'number') return false
  return jumpToCellById(voroforce, cellId)
}
