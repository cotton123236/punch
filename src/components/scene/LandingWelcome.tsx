'use client'

import { cn } from '@/lib/utils'
import { motion, AnimatePresence, cubicBezier } from 'motion/react'
import { useAtom, useSetAtom } from 'jotai'
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
  addressListAtom
} from '@/store/atoms'
import TextGenerateEffect from '@/components/aceternity/TextGenerateEffect'

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
  const time = new Date().getHours()
  const timeString = time < 12 ? 'morning' : time < 18 ? 'afternoon' : 'evening'
  const welcomeWords = `Good ${timeString} ${employeeInfo!.name}.\nYou have nothing\nscheduled for today\nEnjoy your day!`

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

  return (
    <div
      ref={ref}
      className={cn('relative w-full', className)}
    >
      <TextGenerateEffect words={welcomeWords} />
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
