import { cn } from '../../utils/tw'

// Loading animation adapted from Uiverse.io by SachinKumar666 (MIT),
// recolored to the site's gold/amber theme (see .w2w-loader in styles.css).
export const Loader = ({ className = '' }: { className?: string }) => (
  <div
    className={cn('flex flex-col items-center gap-3', className)}
    role='status'
    aria-label='Loading'
  >
    <div className='w2w-loader' />
    <span className='text-foreground/50 text-sm uppercase tracking-[0.2em]'>
      Loading
    </span>
  </div>
)
