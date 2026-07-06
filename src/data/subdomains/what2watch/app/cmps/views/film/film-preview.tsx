import { selectIsPreviewMode, useShallowState } from '@/store'
import { cn } from '../../../utils/tw'
import { Badge } from '../../ui/badge'
import { FilmPoster } from './shared/film-poster'
import { FilmRatingGauge } from './shared/film-rating-gauge'

// Static hover panel: shows the focused tile's film info pinned to the
// top-left of the screen (below the logo button) instead of floating
// alongside the pointer. Hidden as soon as a tile is selected (the full card
// view takes over) and on non-preview modes.
export const FilmPreview = ({ poster = false }) => {
  const { film, isPreviewMode, config } = useShallowState((state) => ({
    film: state.film,
    isPreviewMode: selectIsPreviewMode(state),
    config: state.config?.filmPreview,
  }))

  if (config && 'enabled' in config && !config.enabled) return null

  return (
    <>
      {film && (
        <div
          className={cn(
            // small screens: pinned across the top, indented past the
            // top-left logo button; md+: pinned top-left below the logo
            'pointer-events-none fixed top-0 left-0 z-10 w-full max-w-full py-4 pr-4 pl-16 opacity-0 transition-opacity duration-500',
            'md:top-24 md:left-9 md:w-auto md:max-w-md md:p-0 lg:top-28',
            {
              'opacity-100': isPreviewMode,
            },
          )}
        >
          <div className='flex flex-row gap-3 lg:gap-6'>
            {poster && (
              <FilmPoster
                film={film}
                className='w-full max-w-[150px] shrink-0 basis-1/4 rounded-2xl'
              />
            )}
            <div className='flex basis-full flex-row justify-between gap-3 md:justify-start lg:gap-6'>
              <div className='flex flex-col gap-2 lg:gap-3'>
                {film.tagline && (
                  <p className='line-clamp-1 hidden font-medium text-base text-foreground/90 leading-none md:inline-block lg:text-lg lg:leading-none'>
                    {film.tagline}
                  </p>
                )}
                <h3 className='line-clamp-2 font-black text-2xl leading-none lg:text-4xl lg:leading-none'>
                  {film.title}
                  <span className='font-normal text-foreground/50 text-xl leading-none lg:text-2xl'>
                    &nbsp;({film.year})
                  </span>
                </h3>
                <div className='flex flex-row flex-wrap gap-2 lg:pt-1'>
                  {film.genres?.map((genre) => (
                    <Badge
                      key={genre}
                      className='whitespace-nowrap text-[0.6rem] leading-none lg:text-xs'
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
              <FilmRatingGauge value={film.rating} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
