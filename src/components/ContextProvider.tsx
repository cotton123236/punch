'use client'

import { useEffect } from 'react'
import { Provider, useAtom } from 'jotai'
import { themeAtom } from '@/store/atoms'

function ThemeManager() {
  const [theme, setTheme] = useAtom(themeAtom)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    setTheme(mediaQuery.matches ? 'dark' : 'light')

    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [setTheme])

  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  return null
}

export default function ContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <ThemeManager />
      {children}
    </Provider>
  )
}
