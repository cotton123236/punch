'use client'

import { useEffect, useState, useRef } from 'react'
import type { PushSubscription as WebPushSubscription } from 'web-push'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { subscribeUser, unsubscribeUser, sendNotification } from '@/app/actions'
import {
  isVisitorModeAtom,
  visitorNicknameAtom,
  isSettingsOpenAtom,
  employeeInfoAtom,
  nicknameAtom,
  isNotificationEnabledAtom,
  notificationStartTimeAtom,
  notificationEndTimeAtom,
  punchThemeAtom,
  punchThemeActiveIndexAtom
} from '@/store/atoms'
import { cn } from '@/lib/utils'
import { LiquidGlass } from 'simple-liquid-glass'
import Switch from '@/components/ui/Switch'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function Settings({ className }: { className?: string }) {
  const isVisitorMode = useAtomValue(isVisitorModeAtom)
  const [visitorNickname, setVisitorNickname] = useAtom(visitorNicknameAtom)

  const employeeInfo = useAtomValue(employeeInfoAtom)
  const [nickname, setNickname] = useAtom(nicknameAtom)
  const [isNotificationEnabled, setIsNotificationEnabled] = useAtom(isNotificationEnabledAtom)
  const [notificationStartTime, setNotificationStartTime] = useAtom(notificationStartTimeAtom)
  const [notificationEndTime, setNotificationEndTime] = useAtom(notificationEndTimeAtom)

  const initialNickname = isVisitorMode ? visitorNickname : nickname || employeeInfo?.name
  const [inputNickname, setInputNickname] = useState<string>(initialNickname || '')
  const [inputNotificationStartTime, setInputNotificationStartTime] = useState<string>(notificationStartTime)
  const [inputNotificationEndTime, setInputNotificationEndTime] = useState<string>(notificationEndTime)
  const punchTheme = useAtomValue(punchThemeAtom)
  const setPunchThemeActiveIndex = useSetAtom(punchThemeActiveIndexAtom)
  const [isSettingsOpen, setIsSettingsOpen] = useAtom(isSettingsOpenAtom)
  const hasOpened = useRef(false)
  const reservedData = useRef<{
    isNotificationEnabled: boolean
    notificationStartTime: string
    notificationEndTime: string
  } | null>(null)

  // push notification
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  const isValidTimeFormat = (timeString: string, type: 'start' | 'end') => {
    const timeRegex = /^(0[9]|10):[0-5][0-9]$/
    const endTimeRegex = /^(18|19):[0-5][0-9]$/

    if (type === 'start') {
      if (!timeRegex.test(timeString)) return false
      const [hour] = timeString.split(':').map(Number)
      return hour >= 9 && hour < 11
    } else {
      if (!endTimeRegex.test(timeString)) return false
      const [hour] = timeString.split(':').map(Number)
      return hour >= 18 && hour < 20
    }
  }

  const handlePunchTheme = () => {
    setPunchThemeActiveIndex((prev) => (prev + 1) % punchTheme.length)
  }

  // set initial input notification time when visitor mode is changed
  useEffect(() => {
    if (!isVisitorMode) {
      setIsNotificationEnabled(isNotificationEnabled)
      setInputNotificationStartTime(notificationStartTime)
      setInputNotificationEndTime(notificationEndTime)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisitorMode])

  // set initial input nickname
  useEffect(() => {
    if (employeeInfo && !nickname) {
      setInputNickname(employeeInfo.name)
    }
    if (!isVisitorMode && nickname) {
      setInputNickname(nickname)
    }
    if (isVisitorMode && visitorNickname) {
      setInputNickname(visitorNickname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeInfo])

  useEffect(() => {
    if (notificationStartTime) {
      setInputNotificationStartTime(notificationStartTime)
    }
  }, [notificationStartTime])

  useEffect(() => {
    if (notificationEndTime) {
      setInputNotificationEndTime(notificationEndTime)
    }
  }, [notificationEndTime])

  // store data
  useEffect(() => {
    if (isSettingsOpen) {
      hasOpened.current = true
      reservedData.current = {
        isNotificationEnabled,
        notificationStartTime,
        notificationEndTime
      }
    }
    if (!isSettingsOpen && hasOpened.current) {
      if (isVisitorMode) {
        setVisitorNickname(inputNickname)
      } else {
        setNickname(inputNickname)
        setNotificationStartTime(inputNotificationStartTime)
        setNotificationEndTime(inputNotificationEndTime)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsOpen])

  // register service worker
  const registerServiceWorker = async () => {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  // subscribe to push
  const subscribeToPush = async (): Promise<{ sub: PushSubscription; success: boolean; message?: string } | null> => {
    const registration = await navigator.serviceWorker.ready

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.error('Notification permission not granted')
      return null
    }

    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      })

      setSubscription(sub)
      const serializedSub = JSON.parse(JSON.stringify(sub))
      const res = await subscribeUser({
        sub: serializedSub,
        startTime: inputNotificationStartTime,
        endTime: inputNotificationEndTime
      })
      if (res.success) {
        return { sub: serializedSub, ...res }
      } else {
        throw new Error(res.message || 'Failed to subscribe')
      }
    } catch (err) {
      console.error('Failed to subscribe:', err)
      return null
    }
  }

  // unsubscribe from push
  const unsubscribeFromPush = async () => {
    await subscription?.unsubscribe()
    await unsubscribeUser(subscription?.endpoint || '')
    setSubscription(null)
  }

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  return (
    <div
      className={cn(
        'fixed top-0 left-0 z-[999] h-dvh w-dvw overflow-hidden',
        !isSettingsOpen && 'pointer-events-none',
        className
      )}
    >
      <div
        className="absolute inset-0 z-10"
        onClick={async () => {
          setIsSettingsOpen(false)

          // check if notification should be updated
          if (
            isVisitorMode ||
            (reservedData.current?.isNotificationEnabled === isNotificationEnabled &&
              reservedData.current?.notificationStartTime === inputNotificationStartTime &&
              reservedData.current?.notificationEndTime === inputNotificationEndTime)
          ) {
            return
          }

          if (isNotificationEnabled) {
            const res = await subscribeToPush()
            if (res?.success) {
              const subscription = res.sub as unknown as WebPushSubscription
              const title = res.message?.includes('updated') ? 'Reminder Updated!' : 'Reminder Enabled!'
              const body = res.message?.includes('updated') ? '已成功更新打卡提醒通知！' : '已成功開啟打卡提醒通知！'
              await sendNotification(subscription, {
                title,
                body
              })
            } else {
              setIsNotificationEnabled(false)
            }
          } else {
            await unsubscribeFromPush()
          }
        }}
      />
      <div
        className={cn(
          'ease-in-out-lg absolute -bottom-9 left-0 z-20 w-full duration-800 md:bottom-12 md:left-1/2 md:w-[90%] md:max-w-md md:-translate-x-1/2',
          !isSettingsOpen && 'translate-y-[110%] scale-120 md:translate-y-[calc(110%+3rem)]'
        )}
      >
        <LiquidGlass
          mode="preset"
          aberrationIntensity={0.1}
          border={0.15}
          radius={36}
          blur={5}
          borderColor="color-mix(in srgb, var(--foreground) 25%, transparent)"
          className={cn('clock-shadow')}
        >
          <div className="p-8 pb-17 lg:p-10 lg:pb-10">
            <div className="flex flex-col">
              {/* theme */}
              <div className="flex items-center justify-between gap-4">
                <span>Theme</span>
                <div
                  className="bg-sunrise ease-in-out-sm h-8 w-8 cursor-pointer rounded-full duration-700 hover:rotate-45"
                  onClick={handlePunchTheme}
                ></div>
              </div>
              {/* nickname */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <span>Nickname</span>
                <input
                  id="nickname"
                  value={inputNickname}
                  className="placeholder:text-secondary-foreground text-primary autofill:bg-background h-6 py-2 text-right outline-none"
                  placeholder="nickname"
                  onChange={(e) => setInputNickname(e.target.value)}
                  onBlur={() => {
                    if (inputNickname === '' && hasOpened.current) {
                      setInputNickname(employeeInfo?.name || '')
                    }
                  }}
                />
              </div>
              {/* notification */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <span>Notification</span>
                {isSupported ? (
                  <Switch
                    checked={isNotificationEnabled}
                    onChange={async (value: boolean) => {
                      setIsNotificationEnabled(value)
                    }}
                  />
                ) : (
                  <span className="text-secondary-foreground">Not supported</span>
                )}
              </div>
              {/* push notification */}
              {isSupported && (
                <>
                  {/* notification time */}
                  <div
                    className={cn(
                      'ease-in-out-lg grid grid-rows-[0fr] overflow-hidden duration-500',
                      isNotificationEnabled && 'mt-6 grid-rows-[1fr]'
                    )}
                  >
                    <div className="flex min-h-0 flex-col gap-6">
                      <div className="flex items-center justify-between gap-4">
                        <span>Start Time</span>
                        <input
                          id="starttime"
                          value={inputNotificationStartTime}
                          className="placeholder:text-secondary-foreground text-primary autofill:bg-background h-6 py-2 text-right outline-none"
                          placeholder="09:30"
                          onChange={(e) => setInputNotificationStartTime(e.target.value)}
                          onBlur={() => {
                            if (!isValidTimeFormat(inputNotificationStartTime, 'start') && hasOpened.current) {
                              setInputNotificationStartTime('09:30')
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>End Time</span>
                        <input
                          id="endtime"
                          value={inputNotificationEndTime}
                          className="placeholder:text-secondary-foreground text-primary autofill:bg-background h-6 py-2 text-right outline-none"
                          placeholder="18:30"
                          onChange={(e) => setInputNotificationEndTime(e.target.value)}
                          onBlur={() => {
                            if (!isValidTimeFormat(inputNotificationEndTime, 'end') && hasOpened.current) {
                              setInputNotificationEndTime('18:30')
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </LiquidGlass>
      </div>
    </div>
  )
}
