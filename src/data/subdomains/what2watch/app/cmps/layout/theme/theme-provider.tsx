import { type ReactNode, useEffect } from 'react'

// Bright mode has been removed - what2watch is dark-only. This just applies
// the 'dark' class the CSS variables in app/styles.css expect, regardless
// of OS preference or any previously persisted theme setting.
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return <>{children}</>
}
