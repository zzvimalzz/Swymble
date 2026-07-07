import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { SWYMBLE_LABS_URL } from '../../../utils/urls'
import { LandingBackground } from '../../common/landing-background'
import { Button } from '../../ui/button'

// what2watch has no client-side routes at all - the wall is the only page.
// Any pathname other than the app's own root is therefore always a broken
// link, so this renders instead of mounting the (heavy, WebGL) app tree at
// all - see main.tsx.
export const NotFound = () => {
  useEffect(() => {
    document.getElementById('boot-loader')?.remove()
  }, [])

  return (
    <div className='fixed inset-0 z-60 flex h-dvh w-full items-center justify-center overflow-hidden bg-background px-12'>
      <LandingBackground />
      <a
        href={SWYMBLE_LABS_URL}
        className='absolute top-4 left-4 flex flex-row items-center gap-1.5 text-foreground/60 text-sm transition-colors hover:text-foreground md:top-9 md:left-9'
      >
        <ArrowLeft className='size-4' />
        Back to Swymble Labs
      </a>
      <div className='flex flex-col items-center gap-6 text-center'>
        <img
          src='./images/what2watch_logo.png'
          alt=''
          className='size-16 rounded-2xl md:size-20'
        />
        <div className='flex flex-col items-center gap-3'>
          <h1 className='font-black text-6xl text-primary leading-none tracking-tight md:text-8xl'>
            404
          </h1>
          <p className='max-w-sm text-base text-foreground/60 md:text-lg'>
            There's nothing on the wall at this address.
          </p>
        </div>
        <Button size='lg' asChild className='cursor-pointer px-10 text-lg'>
          <a href='/'>Back to what2watch</a>
        </Button>
      </div>
    </div>
  )
}
