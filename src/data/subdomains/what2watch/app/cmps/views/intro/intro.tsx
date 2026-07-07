import { ArrowLeft } from 'lucide-react'
import { useEffect, useReducer } from 'react'
import { useShallowState } from '../../../store'
import { cn } from '../../../utils/tw'
import { SWYMBLE_LABS_URL } from '../../../utils/urls'
import { VOROFORCE_MODE } from '../../../vf'
import { OBSCURE_VISUAL_DEFECTS } from '../../../vf/consts'
import { FadeTransition } from '../../common/fade-transition'
import { LandingBackground } from '../../common/landing-background'
import { Loader } from '../../common/loader'
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

  // The landing UI (this component) is the real page finally taking over
  // from the static HTML/CSS boot loader in index.html, which exists so
  // visitors see something other than a blank tab while the JS bundle
  // downloads and parses. Tear it down now that we have something to show.
  useEffect(() => {
    document.getElementById('boot-loader')?.remove()
  }, [])

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
      <a
        href={SWYMBLE_LABS_URL}
        className='absolute top-4 left-4 z-10 flex flex-row items-center gap-1.5 text-foreground/60 text-sm transition-colors hover:text-foreground md:top-9 md:left-9'
      >
        <ArrowLeft className='size-4' />
        Back to Swymble Labs
      </a>
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
          <MoviesDatasetLicenseInfo />
        </div>
      </div>
    </FadeTransition>
  )
}

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
