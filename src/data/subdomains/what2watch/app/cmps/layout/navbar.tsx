import { useShallowState } from '@/store'
import { CircleHelp, Heart, ListFilter, Settings, Shuffle } from 'lucide-react'
import { useState } from 'react'

import { cn } from '../../utils/tw'
import { jumpToRandomFilteredCell } from '../../vf'
import { Button } from '../ui/button'

export const Navbar = () => {
  const {
    settingsOpen,
    toggleSettingsOpen,
    filtersOpen,
    toggleFiltersOpen,
    favoritesOpen,
    toggleFavoritesOpen,
    voroforce,
    filters,
  } = useShallowState((state) => ({
    settingsOpen: state.settingsOpen,
    toggleSettingsOpen: state.toggleSettingsOpen,
    filtersOpen: state.filtersOpen,
    toggleFiltersOpen: state.toggleFiltersOpen,
    favoritesOpen: state.favoritesOpen,
    toggleFavoritesOpen: state.toggleFavoritesOpen,
    voroforce: state.voroforce,
    filters: state.filters,
  }))

  const [tipOpen, setTipOpen] = useState(false)
  const [finding, setFinding] = useState(false)

  const buttonClassnames =
    '!size-6 [&_svg]:!size-4 lg:!size-8 lg:[&_svg]:!size-5 pointer-events-auto rounded-full cursor-pointer'

  const surpriseMe = async () => {
    if (!voroforce || finding) return
    setFinding(true)
    try {
      await jumpToRandomFilteredCell(voroforce, filters)
    } finally {
      setFinding(false)
    }
  }

  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-0 z-10 flex w-full flex-row items-center justify-end gap-1 p-3 md:top-0 md:bottom-auto md:z-60 md:px-9 md:py-9'>
      <div className='relative flex flex-row gap-1'>
        {/* Desktop: hotkey tip (Space has no equivalent on touch devices) */}
        <div className='relative hidden md:block'>
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
          <div
            className={cn(
              'pointer-events-auto absolute top-full right-0 mt-2 w-72 rounded-lg border border-foreground/15 bg-background/90 px-3 py-2 text-foreground/80 text-sm leading-snug opacity-0 backdrop-blur-sm transition-opacity duration-300',
              {
                'opacity-100': tipOpen,
                'pointer-events-none': !tipOpen,
              },
            )}
          >
            Press <b className='text-primary'>Space</b> to jump to a random
            movie or show — your filters apply.
          </div>
        </div>
        {/* Mobile: no physical spacebar, so a direct action replaces the tip */}
        <Button
          variant='ghost'
          size='icon'
          onClick={surpriseMe}
          disabled={finding}
          className={cn(buttonClassnames, 'md:hidden')}
          aria-label='Surprise me'
          title='Surprise me'
        >
          <Shuffle />
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
      </div>
    </div>
  )
}
