import { CircleHelp, Heart, ListFilter, Settings } from 'lucide-react'
import { useState } from 'react'

import { useShallowState } from '@/store'
import { cn } from '../../utils/tw'
import { Button } from '../ui/button'

export const Navbar = () => {
  const {
    settingsOpen,
    toggleSettingsOpen,
    filtersOpen,
    toggleFiltersOpen,
    favoritesOpen,
    toggleFavoritesOpen,
  } = useShallowState((state) => ({
    settingsOpen: state.settingsOpen,
    toggleSettingsOpen: state.toggleSettingsOpen,
    filtersOpen: state.filtersOpen,
    toggleFiltersOpen: state.toggleFiltersOpen,
    favoritesOpen: state.favoritesOpen,
    toggleFavoritesOpen: state.toggleFavoritesOpen,
  }))

  const [tipOpen, setTipOpen] = useState(false)

  const buttonClassnames =
    '!size-6 [&_svg]:!size-4 lg:!size-8 lg:[&_svg]:!size-5 pointer-events-auto rounded-full cursor-pointer'

  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-0 z-10 flex w-full flex-row items-center justify-end gap-1 p-3 md:top-0 md:bottom-auto md:z-60 md:px-9 md:py-9'>
      <div className='relative flex flex-row gap-1'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setTipOpen((open) => !open)}
          className={cn(buttonClassnames, {
            'border border-foreground': tipOpen,
          })}
          aria-label='Tips'
        >
          <CircleHelp />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleSettingsOpen}
          onPointerDown={(event) => {
            if (settingsOpen) {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
          className={cn(buttonClassnames, {
            'border border-foreground': settingsOpen,
          })}
        >
          <Settings />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleFiltersOpen}
          onPointerDown={(event) => {
            if (filtersOpen) {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
          className={cn(buttonClassnames, {
            'border border-foreground': filtersOpen,
          })}
        >
          <ListFilter />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleFavoritesOpen}
          onPointerDown={(event) => {
            if (favoritesOpen) {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
          className={cn(buttonClassnames, {
            'border border-foreground': favoritesOpen,
          })}
        >
          <Heart />
        </Button>
        <div
          className={cn(
            // tip bubble: above the bar on small screens (bottom navbar),
            // below it on md+ (top navbar)
            'pointer-events-auto absolute right-0 bottom-full mb-2 w-64 rounded-lg border border-foreground/15 bg-background/90 px-3 py-2 text-foreground/80 text-xs leading-snug opacity-0 backdrop-blur-sm transition-opacity duration-300 md:top-full md:bottom-auto md:mt-2 md:mb-0 md:w-72 md:text-sm',
            {
              'opacity-100': tipOpen,
              'pointer-events-none': !tipOpen,
            },
          )}
        >
          Press <b className='text-primary'>Space</b> to jump to a random movie
          or show — your filters apply.
          <span className='mt-1 block text-foreground/50 md:hidden'>
            On touch devices, use <b>Surprise me</b> in the filters.
          </span>
        </div>
      </div>
    </div>
  )
}
