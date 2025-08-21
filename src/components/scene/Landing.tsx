'use client'

import { motion, cubicBezier } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  loginRefreshTokenAtom,
  employeeInfoAtom,
  isHydratedAtom,
  punchThemeAtom,
  punchThemeActiveIndexAtom
} from '@/store/atoms'
import { cn } from '@/lib/utils'
import Sunrise from '@/components/ui/Sunrise'
import LandingLogin from './LandingLogin'
import LandingWelcome from './LandingWelcome'

export default function Landing({
  className,
  ref,
  id
}: {
  className?: string
  ref: React.RefObject<HTMLDivElement>
  id: string
}) {
  const employeeInfo = useAtomValue(employeeInfoAtom)
  const isHydrated = useAtomValue(isHydratedAtom)
  const loginRefreshToken = useAtomValue(loginRefreshTokenAtom)
  const childrenRef = useRef<HTMLDivElement>(null!)
  const [childrenHeight, setChildrenHeight] = useState<number>(0)
  const punchTheme = useAtomValue(punchThemeAtom)
  const setPunchThemeActiveIndex = useSetAtom(punchThemeActiveIndexAtom)

  const handlePunchTheme = () => {
    setPunchThemeActiveIndex((prev) => (prev + 1) % punchTheme.length)
  }

  useEffect(() => {
    if (childrenRef.current) {
      setChildrenHeight(childrenRef.current.getBoundingClientRect().height)
    }
  }, [isHydrated, childrenRef, employeeInfo])

  return (
    <div
      ref={ref}
      id={id}
      className={cn('p-scene flex h-full w-full flex-col items-center justify-center', className)}
    >
      <div
        className={cn(
          'flex w-full flex-col gap-10 transition-[max-width] duration-500',
          !loginRefreshToken ? 'max-w-90' : 'max-w-65'
        )}
      >
        <Sunrise
          className="ease-in-out-sm cursor-pointer duration-700 hover:rotate-45"
          onClick={handlePunchTheme}
        />
        {isHydrated && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: childrenHeight }}
            transition={{ duration: 1, ease: cubicBezier(0.85, 0, 0.15, 1) }}
          >
            {!loginRefreshToken && <LandingLogin ref={childrenRef} />}
            {employeeInfo && <LandingWelcome ref={childrenRef} />}
          </motion.div>
        )}
      </div>
    </div>
  )
}
