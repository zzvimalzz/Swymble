import { store } from '../../store'
import type { VoroforceInstance } from '../types'
import { CELL_ID_CAPACITY } from '../utils/films'

// Index of the "uncompressed-single" media version (v0-v2 are the baked
// compressed atlases, v3 streams one poster image per cell id).
const SINGLE_POSTER_MEDIA_VERSION = 3

const getUniqueCellIds = (voroforce: NonNullable<VoroforceInstance>) => {
  const uniqueIds = new Set<number>()
  voroforce.cells.forEach((cell) => {
    uniqueIds.add(cell.id % CELL_ID_CAPACITY)
  })
  return Array.from(uniqueIds)
}

// Re-streams every in-grid poster tile against the CURRENT persisted filters
// without reloading the page: resets the single-poster layers' loaded state
// so the loader fetches the new film mapping's posters and overwrites the
// texture tiles in place, live.
export const refreshDynamicPosterTiles = () => {
  const { voroforce } = store.getState()
  if (!voroforce?.loader?.sharedLoadedMediaVersionLayersData) return

  const layerStates =
    voroforce.loader.sharedLoadedMediaVersionLayersData[
      SINGLE_POSTER_MEDIA_VERSION
    ]
  if (!layerStates) return

  const ids = getUniqueCellIds(voroforce)
  for (const id of ids) {
    layerStates.data[id] = 0
  }
  voroforce.loader.requestMediaLayerLoad(SINGLE_POSTER_MEDIA_VERSION, ids)
}

// Routes every cell's in-grid tile through the dynamic single-poster media
// version. Targets are set once the initial (atlas) preload has finished so
// the wall appears instantly and the real posters stream in over it. The
// forces step picks up each target, requests the poster via the loader
// (which resolves TMDB/TVmaze URLs per the active filters - see
// getCellPosterUrl) and flips the cell over once its tile is on the GPU.
export const handleDynamicPosterTiles = () => {
  const apply = () => {
    const { voroforce } = store.getState()
    if (!voroforce?.cells || !voroforce?.loader) return
    if (
      (voroforce.config.media?.versions?.length ?? 0) <=
      SINGLE_POSTER_MEDIA_VERSION
    )
      return

    voroforce.cells.forEach((cell) => {
      cell.targetMediaVersion = SINGLE_POSTER_MEDIA_VERSION
    })
    // eagerly kick off all visible poster loads instead of waiting for the
    // simulation to request them cell by cell
    voroforce.loader.requestMediaLayerLoad(
      SINGLE_POSTER_MEDIA_VERSION,
      getUniqueCellIds(voroforce),
    )
  }

  if (store.getState().voroforceMediaPreloaded) {
    apply()
  } else {
    const unsubscribe = store.subscribe(
      (state) => state.voroforceMediaPreloaded,
      (preloaded) => {
        if (!preloaded) return
        unsubscribe()
        apply()
      },
    )
  }
}
