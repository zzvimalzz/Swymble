import { Favorites } from './favorites'
import { FilmPreview, FilmViewDrawer } from './film'
import { Filter } from './filter'
import { LowFpsAlert } from './low-fps-alert'
import { RandomPick } from './random-pick'
import { Settings } from './settings'

const PrimaryViews = () => (
  <>
    <Settings />
    <Filter />
    <Favorites />
    <FilmPreview />
    <FilmViewDrawer />
    <LowFpsAlert />
    <RandomPick />
  </>
)

export default PrimaryViews
