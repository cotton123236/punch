'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, cubicBezier } from 'motion/react'
import { useAtomValue } from 'jotai'
import { isVisitorModeAtom, visitorNicknameAtom, employeeInfoAtom, nicknameAtom, timeAtom } from '@/store/atoms'
import { useAuth } from '@/hooks/useApi'
import TextGenerateEffect from '@/components/aceternity/TextGenerateEffect'
import { cn } from '@/lib/utils'

export default function LandingWelcome({
  ref,
  className
}: {
  ref?: React.RefObject<HTMLDivElement>
  className?: string
}) {
  const { signOut } = useAuth()

  const isVisitorMode = useAtomValue(isVisitorModeAtom)
  const visitorNickname = useAtomValue(visitorNicknameAtom)

  const employeeInfo = useAtomValue(employeeInfoAtom)
  const nickname = useAtomValue(nicknameAtom)
  const time = useAtomValue(timeAtom)
  const [welcomeWords, setWelcomeWords] = useState<string>('')

  const handleSignOut = () => {
    signOut()
  }

  useEffect(() => {
    const name = isVisitorMode ? visitorNickname : nickname || employeeInfo?.name
    if (!name) return

    const hours = time.getHours()
    const day = time.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    const timeString = hours < 12 ? 'morning' : hours < 18 ? 'afternoon' : 'evening'
    let specificMessage = ''

    switch (day) {
      case 0: // Sunday
      case 6: // Saturday
        specificMessage = 'Relax and recharge!\nEnjoy your weekend!'
        break
      case 1: // Monday
        specificMessage = "Let's make it a great\nstart of the week!"
        break
      case 5: // Friday
        specificMessage = 'Happy Friday!\nJust one more push!'
        break
      default: // Tuesday, Wednesday, Thursday
        specificMessage = 'Hope you have\na productive day!'
        break
    }

    setWelcomeWords(`Good ${timeString}, ${name}.\n${specificMessage}`)
  }, [isVisitorMode, visitorNickname, nickname, employeeInfo, time])

  return (
    <div
      ref={ref}
      className={cn('relative w-full', className)}
    >
      <TextGenerateEffect
        key={welcomeWords}
        words={welcomeWords}
      />
      <AnimatePresence>
        <motion.div className="absolute top-[calc(100%+2.5rem)] left-0 overflow-hidden">
          <AnimatePresence propagate>
            <motion.button
              type="button"
              className="text-secondary-foreground hover:text-primary-foreground cursor-pointer duration-300"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.8, delay: 1, ease: cubicBezier(0.85, 0, 0.15, 1) }}
              onClick={handleSignOut}
            >
              sign out
            </motion.button>
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
