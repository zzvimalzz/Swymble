// Shared full-bleed backdrop for full-screen static views (landing, 404).
export const LandingBackground = () => (
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
