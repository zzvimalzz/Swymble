import { useShallowState } from '@/store'
import { Check, Search, Shuffle } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { cn } from '../../../utils/tw'
import {
  ALL_FILM_TYPES,
  type FilmFilters,
  type FilmType,
  type ReachableFilmMatch,
  getAvailableGenres,
  jumpToCellById,
  jumpToRandomFilteredCell,
  searchReachableFilms,
} from '../../../vf'
import { refreshDynamicPosterTiles } from '../../../vf/integrations/media'
import { Modal } from '../../common/modal'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { ScrollArea } from '../../ui/scroll-area'

const FILM_TYPE_LABELS: Record<FilmType, string> = {
  movie: 'Movies',
  tv: 'TV Shows',
}

// Curated genre bundles - a what2watch-specific quick way in. A mood chip
// simply sets the genre selection (union semantics, same as picking the
// genres by hand), so Apply/Clear behave identically.
const MOODS: { label: string; genres: string[] }[] = [
  { label: 'Feel-good', genres: ['Comedy', 'Family', 'Music', 'Romance'] },
  { label: 'Edge of seat', genres: ['Thriller', 'Horror', 'Mystery'] },
  {
    label: 'Mind-bender',
    genres: ['Science Fiction', 'Fantasy', 'Supernatural'],
  },
  { label: 'Heartfelt', genres: ['Drama', 'Romance'] },
  {
    label: 'Family night',
    genres: ['Animation', 'Family', 'Children', 'Adventure'],
  },
  { label: 'Dark & gritty', genres: ['Crime', 'War', 'Western'] },
]

const sameGenreSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((genre) => b.includes(genre))

const filtersEqual = (a: FilmFilters, b: FilmFilters) =>
  a.types.length === b.types.length &&
  a.types.every((type) => b.types.includes(type)) &&
  sameGenreSet(a.genres, b.genres)

const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) => (
  <button
    type='button'
    onClick={onClick}
    className={cn(
      'cursor-pointer rounded-full border-2 px-4 py-1.5 font-semibold text-sm transition-colors',
      active
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-input text-foreground/70 hover:border-foreground/40',
    )}
  >
    {children}
  </button>
)

export const Filter = () => {
  const { open, setOpen, filters, setFilters, voroforce } = useShallowState(
    (state) => ({
      open: state.filtersOpen,
      setOpen: state.setFiltersOpen,
      filters: state.filters,
      setFilters: state.setFilters,
      voroforce: state.voroforce,
    }),
  )

  const [genres, setGenres] = useState<string[]>([])
  const [finding, setFinding] = useState(false)

  // Draft filters: chip toggles edit this local copy; Apply persists it and
  // re-streams the poster tiles in place (no page reload).
  const [draft, setDraft] = useState<FilmFilters>(filters)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ReachableFilmMatch[]>([])

  useEffect(() => {
    if (open) {
      setDraft(filters)
      setQuery('')
      setResults([])
    }
  }, [open, filters])

  useEffect(() => {
    getAvailableGenres().then(setGenres)
  }, [])

  // Search runs against the APPLIED filters - results are cells you can jump
  // to on the wall as it currently stands.
  useEffect(() => {
    let cancelled = false
    searchReachableFilms(query, filters).then((next) => {
      if (!cancelled) setResults(next)
    })
    return () => {
      cancelled = true
    }
  }, [query, filters])

  const isDirty = !filtersEqual(draft, filters)

  const toggleType = (type: FilmType) => {
    const types = draft.types.includes(type)
      ? draft.types.filter((t) => t !== type)
      : [...draft.types, type]
    if (types.length === 0) return
    setDraft({ ...draft, types })
  }

  const toggleGenre = (genre: string) => {
    const genresSelected = draft.genres.includes(genre)
      ? draft.genres.filter((g) => g !== genre)
      : [...draft.genres, genre]
    setDraft({ ...draft, genres: genresSelected })
  }

  const toggleMood = (mood: (typeof MOODS)[number]) => {
    setDraft({
      ...draft,
      genres: sameGenreSet(mood.genres, draft.genres) ? [] : [...mood.genres],
    })
  }

  const hasActiveDraftFilters =
    draft.types.length !== ALL_FILM_TYPES.length || draft.genres.length > 0

  const apply = () => {
    setFilters(draft)
    // Re-stream every in-grid poster tile against the new mapping, live -
    // no page reload, the wall repopulates in the background. Close the
    // panel so the change is actually visible instead of hidden behind it.
    refreshDynamicPosterTiles()
    setOpen(false)
  }

  const jumpTo = (cellId: number) => {
    if (!voroforce) return
    jumpToCellById(voroforce, cellId)
    setOpen(false)
  }

  const surpriseMe = async () => {
    if (!voroforce || finding) return
    setFinding(true)
    try {
      if (await jumpToRandomFilteredCell(voroforce, filters)) {
        setOpen(false)
      }
    } finally {
      setFinding(false)
    }
  }

  return (
    <Modal
      rootProps={{
        open: open,
        onClose: () => setOpen(false),
      }}
      overlay
      footer={
        <div className='flex w-full flex-row flex-wrap justify-between gap-3 bg-background/90 p-4 backdrop-blur-sm md:gap-6 md:p-6'>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Close
          </Button>
          <div className='flex flex-row flex-wrap justify-end gap-3'>
            {hasActiveDraftFilters && (
              <Button
                variant='outline'
                onClick={() => setDraft({ types: ALL_FILM_TYPES, genres: [] })}
              >
                Clear filters
              </Button>
            )}
            <Button
              variant='outline'
              onClick={surpriseMe}
              disabled={finding || isDirty}
              title={isDirty ? 'Apply your filters first' : undefined}
            >
              <Shuffle /> Surprise me
            </Button>
            <Button onClick={apply} disabled={!isDirty}>
              <Check /> Apply
            </Button>
          </div>
        </div>
      }
    >
      <ScrollArea
        className='not-landscape:w-full bg-background/60 lg:w-full landscape:h-full'
        innerClassName='max-h-[calc(100dvh-var(--spacing)*12)]'
      >
        <div className='flex w-full flex-col gap-6 p-4 pb-40 md:gap-8 md:p-6 md:pr-10 md:pb-24 lg:pt-16 lg:pb-24'>
          <p className='text-foreground/60 text-sm'>
            Pick a mood, type or genre, then hit <b>Apply</b> to rebuild the
            wall with matching titles, or <b>Surprise me</b> to jump straight to
            a random match.
          </p>
          <div className='flex flex-col gap-3'>
            <h4 className='font-bold text-lg uppercase leading-none'>
              Find on the wall
            </h4>
            <div className='relative'>
              <Search className='-translate-y-1/2 absolute top-1/2 left-3 size-4 text-foreground/40' />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='Search titles currently on the wall…'
                className='pl-9'
              />
            </div>
            {!!results.length && (
              <div className='flex flex-col'>
                {results.map((match) => (
                  <button
                    key={`${match.type}-${match.cellId}`}
                    type='button'
                    onClick={() => jumpTo(match.cellId)}
                    className='flex cursor-pointer flex-row items-baseline justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-foreground/10'
                  >
                    <span className='truncate font-semibold text-sm'>
                      {match.title}{' '}
                      <span className='font-normal text-foreground/50'>
                        ({match.year})
                      </span>
                    </span>
                    <span className='shrink-0 text-foreground/50 text-xs uppercase'>
                      {FILM_TYPE_LABELS[match.type]}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {!!query.trim() && !results.length && (
              <span className='px-3 text-foreground/50 text-sm'>
                No matching title on the wall right now.
              </span>
            )}
          </div>
          <div className='flex flex-col gap-3'>
            <h4 className='font-bold text-lg uppercase leading-none'>Mood</h4>
            <div className='flex flex-row flex-wrap gap-2'>
              {MOODS.map((mood) => (
                <FilterChip
                  key={mood.label}
                  active={sameGenreSet(mood.genres, draft.genres)}
                  onClick={() => toggleMood(mood)}
                >
                  {mood.label}
                </FilterChip>
              ))}
            </div>
          </div>
          <div className='flex flex-col gap-3'>
            <h4 className='font-bold text-lg uppercase leading-none'>Type</h4>
            <div className='flex flex-row flex-wrap gap-2'>
              {ALL_FILM_TYPES.map((type) => (
                <FilterChip
                  key={type}
                  active={draft.types.includes(type)}
                  onClick={() => toggleType(type)}
                >
                  {FILM_TYPE_LABELS[type]}
                </FilterChip>
              ))}
            </div>
          </div>
          <div className='flex flex-col gap-3'>
            <h4 className='font-bold text-lg uppercase leading-none'>Genre</h4>
            <div className='flex flex-row flex-wrap gap-2'>
              {genres.map((genre) => (
                <FilterChip
                  key={genre}
                  active={draft.genres.includes(genre)}
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </FilterChip>
              ))}
              {!genres.length && (
                <span className='text-foreground/50 text-sm'>
                  Loading genres…
                </span>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </Modal>
  )
}
