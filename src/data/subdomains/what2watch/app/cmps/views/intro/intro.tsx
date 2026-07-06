import { useEffect, useReducer } from 'react'
import { useShallowState } from '../../../store'
import { cn } from '../../../utils/tw'
import { VOROFORCE_MODE } from '../../../vf'
import { OBSCURE_VISUAL_DEFECTS } from '../../../vf/consts'
import { FadeTransition } from '../../common/fade-transition'
import { Loader } from '../../common/loader'
import { SmallScreenWarning } from '../../common/small-screen-warning'
import { Button } from '../../ui/button'

export const Intro = () => {
  const { voroforceMediaPreloaded, entered, setEntered } = useShallowState(
    (state) => ({
      voroforceMediaPreloaded: state.voroforceMediaPreloaded,
      entered: state.enteredApp,
      setEntered: state.setEnteredApp,
    }),
  )

  const visible = useIntroVisible(entered)

  return (
    <FadeTransition
      className={cn(
        'fixed inset-x-0 top-0 z-60 flex h-dvh w-full justify-center overflow-hidden bg-background px-12 duration-700',
        {
          '!duration-0': visible,
        },
      )}
      visible={visible}
      transitionOptions={{
        initialEntered: visible,
        timeout: visible ? 0 : 700,
      }}
    >
      <LandingBackground />
      <div className='relative flex h-full flex-col items-stretch'>
        <div className='h-1/3' />
        <div className='flex h-1/3 flex-col items-center justify-center gap-6'>
          <div className='flex flex-col items-center gap-4'>
            <img
              src='./images/what2watch_logo.png'
              alt=''
              className='size-20 rounded-2xl md:size-28'
            />
            <h1 className='text-center font-black text-5xl leading-none tracking-tight md:text-7xl'>
              What<span className='text-primary'>2</span>Watch
            </h1>
            <p className='text-center text-base text-foreground/60 uppercase tracking-[0.2em] md:text-lg'>
              A Swymble Labs Project
            </p>
          </div>
          {!entered ? (
            <Button
              size='lg'
              className='cursor-pointer px-16 text-lg'
              onClick={() => {
                setEntered(true)
              }}
            >
              Enter
            </Button>
          ) : (
            !voroforceMediaPreloaded && <Loader className='mt-4' />
          )}
        </div>
        <div className='relative flex h-1/3 flex-col items-center justify-end gap-4 pb-12'>
          <SmallScreenWarning />
          <MoviesDatasetLicenseInfo />
        </div>
      </div>
    </FadeTransition>
  )
}

const LandingBackground = () => (
  <div className='-z-10 pointer-events-none absolute inset-0 overflow-hidden'>
    <div
      className='-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-[70vmax] w-[70vmax] rounded-full opacity-40 blur-3xl'
      style={{
        background:
          'radial-gradient(circle, rgba(230,178,55,0.35) 0%, rgba(230,178,55,0.08) 45%, transparent 70%)',
      }}
    />
    <div
      className='absolute inset-0 opacity-[0.05]'
      style={{
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    />
    <div className='absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60' />
  </div>
)

const MoviesDatasetLicenseInfo = () => (
  <span className='inline-flex text-center text-xxs text-zinc-600 leading-none dark:text-zinc-300'>
    Contains information from Kaggle's "Full TMDB Movies Dataset" which is made
    available under the ODC Attribution License.
  </span>
)

const DEFAULT_REVEAL_SCREEN_DELAY = 1200
const DEFAULT_PREVIEW_MODE_REVEAL_SCREEN_DELAY = 600
let hideScreen = OBSCURE_VISUAL_DEFECTS
// The landing overlay stays up until the visitor explicitly clicks Enter AND
// the engine has its media preloaded - it never dismisses itself.
function useIntroVisible(entered: boolean) {
  const { voroforceMediaPreloaded, revealScreenDelay } = useShallowState(
    (state) => ({
      voroforceMediaPreloaded: state.voroforceMediaPreloaded,
      revealScreenDelay: state.config?.revealScreenDelay
        ? (state.config.revealScreenDelay.modes?.[state.mode] ??
          state.config.revealScreenDelay.default)
        : state.mode === VOROFORCE_MODE.preview
          ? DEFAULT_PREVIEW_MODE_REVEAL_SCREEN_DELAY
          : DEFAULT_REVEAL_SCREEN_DELAY,
    }),
  )

  if (OBSCURE_VISUAL_DEFECTS) {
    const [, forceUpdate] = useReducer((x) => x + 1, 0)
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
    useEffect(() => {
      setTimeout(() => {
        hideScreen = false
        forceUpdate()
      }, revealScreenDelay)
    }, [])

    useEffect(() => {
      let timeout: NodeJS.Timeout
      const onResize = () => {
        hideScreen = true
        forceUpdate()
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          hideScreen = false
          forceUpdate()
        }, revealScreenDelay)
      }
      window.addEventListener('resize', onResize)
      return () => {
        window.removeEventListener('resize', onResize)
      }
    }, [revealScreenDelay])
  }

  return !entered || hideScreen || !voroforceMediaPreloaded
}
