'use client'

import { motion, AnimatePresence, cubicBezier } from 'motion/react'
import { useState } from 'react'
import { useSetAtom, useAtomValue, useAtom } from 'jotai'
import { loginAtom, isLoginAtom, deviceIdAtom, errorMessageAtom, globalLoadingAtom } from '@/store/atoms'
import { useAuth } from '@/hooks/useApi'
import { cn } from '@/lib/utils'

export default function LandingLogin({
  ref,
  className
}: {
  ref?: React.RefObject<HTMLDivElement>
  className?: string
}) {
  const [loginDeviceId, setLoginDeviceId] = useState('')
  const [loginData, setLoginData] = useAtom(loginAtom)
  const isLogin = useAtomValue(isLoginAtom)
  const setDeviceId = useSetAtom(deviceIdAtom)
  const setErrorMessage = useSetAtom(errorMessageAtom)
  const [globalLoading, setGlobalLoading] = useAtom(globalLoadingAtom)
  const { login } = useAuth()

  const elementAnimate = {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
    transition: { duration: 0.8, delay: 0.5, ease: cubicBezier(0.85, 0, 0.15, 1) }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!loginData.account || !loginData.password || !loginDeviceId) {
      setErrorMessage('Account, Password and Device ID are required!')
      return
    }
    setGlobalLoading(true)
    await login()
    setDeviceId(loginDeviceId)
  }

  return (
    <div
      ref={ref}
      className="w-full"
    >
      <form
        className={cn('flex w-full flex-col gap-10', className)}
        onSubmit={handleSubmit}
      >
        <div className="flex w-full flex-col gap-4">
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                key="account"
                className="flex flex-col gap-1 px-2 transition-opacity duration-300 has-disabled:opacity-50"
              >
                <label
                  htmlFor="account"
                  className="overflow-hidden"
                >
                  <AnimatePresence propagate>
                    <motion.span
                      className="inline-block"
                      {...elementAnimate}
                    >
                      Account
                    </motion.span>
                  </AnimatePresence>
                </label>
                <div className="overflow-hidden">
                  <AnimatePresence propagate>
                    <motion.input
                      id="account"
                      className="placeholder:text-secondary-foreground text-primary-foreground autofill:bg-background w-full py-2 outline-none"
                      placeholder="abc@begonia-design.com.tw"
                      {...elementAnimate}
                      disabled={globalLoading}
                      onChange={(e) => setLoginData({ ...loginData, account: e.target.value })}
                    />
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                key="password"
                className="flex flex-col gap-1 px-2 transition-opacity duration-300 has-disabled:opacity-50"
              >
                <label
                  htmlFor="password"
                  className="overflow-hidden"
                >
                  <AnimatePresence propagate>
                    <motion.span
                      className="inline-block"
                      {...elementAnimate}
                    >
                      Password
                    </motion.span>
                  </AnimatePresence>
                </label>
                <div className="overflow-hidden">
                  <AnimatePresence propagate>
                    <motion.input
                      id="password"
                      type="password"
                      className="placeholder:text-secondary-foreground text-primary-foreground autofill:bg-background w-full py-2 outline-none"
                      placeholder="password"
                      {...elementAnimate}
                      disabled={globalLoading}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                key="deviceId"
                className="flex flex-col gap-1 px-2 transition-opacity duration-300 has-disabled:opacity-50"
              >
                <label
                  htmlFor="deviceId"
                  className="overflow-hidden"
                >
                  <AnimatePresence propagate>
                    <motion.span
                      className="inline-block"
                      {...elementAnimate}
                    >
                      Device ID
                    </motion.span>
                  </AnimatePresence>
                </label>
                <div className="overflow-hidden">
                  <AnimatePresence propagate>
                    <motion.input
                      id="deviceId"
                      type="text"
                      className="placeholder:text-secondary-foreground text-primary-foreground autofill:bg-background w-full py-2 outline-none"
                      placeholder="device id"
                      {...elementAnimate}
                      disabled={globalLoading}
                      onChange={(e) => setLoginDeviceId(e.target.value)}
                    />
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          <motion.div
            key="enter"
            className="flex w-full justify-end overflow-hidden transition-opacity duration-300 has-disabled:opacity-50"
          >
            <AnimatePresence propagate>
              <motion.button
                className="text-sunrise cursor-pointer text-xl"
                type="submit"
                disabled={globalLoading}
                {...elementAnimate}
              >
                Enter
              </motion.button>
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </form>
    </div>
  )
}
