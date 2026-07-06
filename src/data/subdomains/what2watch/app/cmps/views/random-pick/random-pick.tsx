import { useShallowState } from '@/store'
import { useEffect, useRef } from 'react'
import { jumpToRandomFilteredCell } from '../../../vf'

// Top-left brand mark: clicking it returns to the landing screen. Also owns
// the global Space hotkey, which jumps to a random title matching the active
// filters (same code path as "Surprise me").
export const RandomPick = () => {
  const {
    voroforce,
    filters,
    entered,
    setEntered,
    voroforceMediaPreloaded,
    exitSelectMode,
  } = useShallowState((state) => ({
    voroforce: state.voroforce,
    filters: state.filters,
    entered: state.enteredApp,
    setEntered: state.setEnteredApp,
    voroforceMediaPreloaded: state.voroforceMediaPreloaded,
    exitSelectMode: state.exitSelectMode,
  }))

  const findingRef = useRef(false)

  const active = entered && voroforceMediaPreloaded

  useEffect(() => {
    if (!active || !voroforce) return

    const onKeyDown = async (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      const target = event.target as Element | null
      if (
        target &&
        (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.nodeName) ||
          target.hasAttribute?.('contenteditable'))
      )
        return
      event.preventDefault()
      if (findingRef.current) return
      findingRef.current = true
      try {
        await jumpToRandomFilteredCell(voroforce, filters)
      } finally {
        findingRef.current = false
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [active, voroforce, filters])

  if (!active) return null

  return (
    <div className='pointer-events-none fixed top-0 left-0 z-10 p-3 md:px-9 md:py-7'>
      <button
        type='button'
        onClick={() => {
          exitSelectMode()
          setEntered(false)
        }}
        className='pointer-events-auto size-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-foreground/20 transition-transform hover:scale-110 lg:size-11'
        aria-label='Back to the landing page'
        title='Back to the landing page'
      >
        <img
          src='./images/what2watch_logo.png'
          alt='what2watch'
          className='size-full object-cover'
        />
      </button>
    </div>
  )
}
