'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, cubicBezier } from 'motion/react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { RESET } from 'jotai/utils'
import {
  userTokenAtom,
  loginRefreshTokenAtom,
  accessTokenAtom,
  cidAtom,
  pidAtom,
  deviceIdAtom,
  employeeInfoAtom,
  monthDetailAtom,
  addressListAtom,
  nicknameAtom
} from '@/store/atoms'
import TextGenerateEffect from '@/components/aceternity/TextGenerateEffect'
import { cn } from '@/lib/utils'

export default function LandingWelcome({
  ref,
  className
}: {
  ref?: React.RefObject<HTMLDivElement>
  className?: string
}) {
  const setUserToken = useSetAtom(userTokenAtom)
  const setLoginRefreshToken = useSetAtom(loginRefreshTokenAtom)
  const setAccessToken = useSetAtom(accessTokenAtom)
  const setCid = useSetAtom(cidAtom)
  const setPid = useSetAtom(pidAtom)
  const setDeviceId = useSetAtom(deviceIdAtom)
  const setMonthDetail = useSetAtom(monthDetailAtom)
  const setAddressList = useSetAtom(addressListAtom)
  const [employeeInfo, setEmployeeInfo] = useAtom(employeeInfoAtom)
  const nickname = useAtomValue(nicknameAtom)
  const [welcomeWords, setWelcomeWords] = useState<string>('')

  const handleSignOut = () => {
    setUserToken(RESET)
    setLoginRefreshToken(RESET)
    setCid(RESET)
    setPid(RESET)
    setDeviceId(RESET)
    setAccessToken('')
    setMonthDetail(null)
    setAddressList(null)
    setEmployeeInfo(null)
  }

  useEffect(() => {
    const name = nickname || employeeInfo?.name
    if (!name) return

    const date = new Date()
    const time = date.getHours()
    const day = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    const timeString = time < 12 ? 'morning' : time < 18 ? 'afternoon' : 'evening'
    let specificMessage = ''

    switch (day) {
      case 0: // Sunday
      case 6: // Saturday
        specificMessage = 'Relax and recharge!\nEnjoy your weekend!'
        break
      case 1: // Monday
        specificMessage = "Hello Monday!\nLet's make it\na great week!"
        break
      case 5: // Friday
        specificMessage = 'Happy Friday!\nJust one more push!'
        break
      default: // Tuesday, Wednesday, Thursday
        specificMessage = 'Hope you have\na productive day!'
        break
    }

    setWelcomeWords(`Good ${timeString}, ${name}.\n${specificMessage}`)
  }, [nickname, employeeInfo])

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
