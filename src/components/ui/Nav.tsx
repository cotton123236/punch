'use client'

import { useEffect } from 'react'
import { useAtomValue, useAtom } from 'jotai'
import { motion, cubicBezier } from 'motion/react'
import { navAtom, navActiveIndexAtom, deviceSizeAtom, isDraggingAtom, isSafariOrIOSAtom } from '@/store/atoms'
import { cn } from '@/lib/utils'
// import LiquidGlass from 'liquid-glass-react'
import { LiquidGlass } from 'simple-liquid-glass'

export default function Nav() {
  const [nav, setNav] = useAtom(navAtom)
  const navActiveIndex = useAtomValue(navActiveIndexAtom)
  const deviceSize = useAtomValue(deviceSizeAtom)
  const isDragging = useAtomValue(isDraggingAtom)
  const isSafariOrIOS = useAtomValue(isSafariOrIOSAtom)
  const navList = {
    sm: [
      { name: 'Home', id: 'home' },
      { name: 'Punch', id: 'punch' },
      { name: 'Calendar', id: 'calendar' }
    ],
    md: [
      { name: 'Home', id: 'home' },
      { name: 'Punch', id: 'punch' }
    ],
    lg: [{ name: 'PUNCH', id: 'punch' }]
  }

  const anchorToRef = (index: number) => {
    const navItem = nav[index]
    if (!navItem) return
    const ref = document.getElementById(navItem.id)
    if (!ref) return
    ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  useEffect(() => {
    setNav(navList[deviceSize])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceSize])

  return (
    <motion.div
      key={`nav-${nav.map((item) => item.id).join('-')}`}
      initial={!isDragging ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
      animate={!isDragging ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={!isDragging ? { duration: 0.8, ease: cubicBezier(0.85, 0, 0.15, 1) } : { duration: 0.3 }}
      className="fixed bottom-5 left-1/2 z-[99] -translate-x-1/2 lg:bottom-8"
    >
      <LiquidGlass
        mode="preset"
        borderColor="color-mix(in srgb, var(--foreground) 25%, transparent)"
        className={cn('nav-shadow', isSafariOrIOS && 'backdrop-blur-[.375rem]')}
      >
        <div className="flex items-center justify-center gap-1 px-2 py-1.5">
          {nav.map((item, index) => (
            <button
              key={item.id}
              className={cn(
                'font-alice text-sunrise p-2 text-base font-normal tracking-normal duration-400',
                navActiveIndex !== index && 'opacity-50 grayscale',
                navActiveIndex === index && 'pointer-events-none'
              )}
              onClick={() => anchorToRef(index)}
            >
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </LiquidGlass>
    </motion.div>
  )
}
