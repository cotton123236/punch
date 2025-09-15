// import Image from 'next/image'
'use client'

import { useEffect, useRef, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  loginRefreshTokenAtom,
  isHydratedAtom,
  isLoginAtom,
  isDataLoadedAtom,
  loginAtom,
  navAtom,
  navActiveIndexAtom,
  punchThemeAtom,
  punchThemeActiveIndexAtom,
  globalLoadingAtom,
  errorMessageAtom,
  successMessageAtom,
  windowWidthAtom,
  isSettingsOpenAtom,
  timeAtom,
  dateAtom
} from '@/store/atoms'
import { useAuth, useData } from '@/hooks/useApi'
import { cn } from '@/lib/utils'
import { Toaster, toast } from 'sonner'
import Loader from '@/components/Loader'
import SceneLanding from '@/components/scene/Landing'
import ScenePunch from '@/components/scene/Punch'
import SceneCalendar from '@/components/scene/Calendar'
import Nav from '@/components/ui/Nav'
import Settings from '@/components/ui/Settings'

export default function Home() {
  // Activate the global timer
  useAtomValue(timeAtom)

  const { login } = useAuth()
  const { getEmployeeInfo, getAddressList, getMonthDetail } = useData()

  const loginData = useAtomValue(loginAtom)
  const loginRefreshToken = useAtomValue(loginRefreshTokenAtom)
  const isLogin = useAtomValue(isLoginAtom)
  const setGlobalLoading = useSetAtom(globalLoadingAtom)
  const isDataLoaded = useAtomValue(isDataLoadedAtom)

  const nav = useAtomValue(navAtom)
  const setNavActiveIndex = useSetAtom(navActiveIndexAtom)
  const setWindowWidth = useSetAtom(windowWidthAtom)
  const [isHydrated, setIsHydrated] = useAtom(isHydratedAtom)
  const [isAnimated, setIsAnimated] = useState(false)

  const sceneScrollerRef = useRef<HTMLDivElement>(null!)
  const landingRef = useRef<HTMLDivElement>(null!)
  const punchRef = useRef<HTMLDivElement>(null!)
  const calendarRef = useRef<HTMLDivElement>(null!)

  const punchTheme = useAtomValue(punchThemeAtom)
  const punchThemeActiveIndex = useAtomValue(punchThemeActiveIndexAtom)

  const isSettingsOpen = useAtomValue(isSettingsOpenAtom)

  const date = useAtomValue(dateAtom)
  const prevDateRef = useRef(date)

  const [errorMessages, setErrorMessage] = useAtom(errorMessageAtom)
  const [successMessages, setSuccessMessage] = useAtom(successMessageAtom)

  const { primary, secondary } = punchTheme[punchThemeActiveIndex]

  // 錯誤訊息
  useEffect(() => {
    if (errorMessages) {
      toast.error(errorMessages, {
        onAutoClose: () => {
          setErrorMessage('')
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessages])

  // 成功訊息
  useEffect(() => {
    if (successMessages) {
      toast.success(successMessages, {
        onAutoClose: () => {
          setSuccessMessage('')
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessages])

  // 設定全域視窗寬度
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setWindowWidth])

  // 設定 punch 主題
  useEffect(() => {
    if (!isHydrated && !punchThemeActiveIndex) return
    document.documentElement.style.setProperty('--primary', primary)
    document.documentElement.style.setProperty('--secondary', secondary)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [punchThemeActiveIndex])

  // 初始化 hydration 狀態
  useEffect(() => {
    setIsHydrated(true)
  }, [setIsHydrated])

  // 自動登入 effect
  useEffect(() => {
    if (loginRefreshToken && !loginData.account && !loginData.password) {
      setGlobalLoading(true)
      login()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginRefreshToken])

  // 獲取員工資訊、地址列表、月度詳情 effect
  useEffect(() => {
    if (isLogin) {
      const getAllDataByStep = async () => {
        try {
          await Promise.all([getEmployeeInfo(), new Promise((resolve) => setTimeout(resolve, 1000))])
          await Promise.all([getAddressList(), getMonthDetail()])
        } catch (error) {
          console.error('getAllDataByStep:', error)
        } finally {
          setGlobalLoading(false)
        }
      }
      getAllDataByStep()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin])

  // 切換日期時獲取月度詳情
  useEffect(() => {
    // 檢查是否真的是 date 變更（不是初始化）
    if (prevDateRef.current !== date && isDataLoaded) {
      getMonthDetail()
    }
    prevDateRef.current = date
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, isDataLoaded])

  // 資料載入後設定動畫
  useEffect(() => {
    if (isDataLoaded) {
      const animationTimer = setTimeout(() => {
        setIsAnimated(true)

        // 延遲後檢查 URL 參數
        const checkUrlTimer = setTimeout(() => {
          const params = new URLSearchParams(window.location.search)
          if (params.get('nav') === 'punch') {
            const ref = document.getElementById('punch')
            if (!ref) return

            ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)

        return () => clearTimeout(checkUrlTimer)
      }, 1000)

      return () => clearTimeout(animationTimer)
    } else {
      setIsAnimated(false)
    }
  }, [isDataLoaded])

  // 切換 scene 時設定 nav active index
  useEffect(() => {
    const element = sceneScrollerRef.current
    if (!element) return
    const onScroll = () => {
      const scrollCenter = element.scrollLeft + element.clientWidth / 2
      const scrollWidth = element.scrollWidth
      const navLength = nav.length
      const pointArray = nav.map((_, index) => {
        const position = ((index + 1) / navLength) * scrollWidth
        return position
      })
      const pointIndex = pointArray.findIndex((point) => scrollCenter <= point)
      if (pointIndex === -1) return
      setNavActiveIndex(pointIndex)
    }
    element.addEventListener('scroll', onScroll)
    return () => element.removeEventListener('scroll', onScroll)
  }, [sceneScrollerRef, isAnimated, nav, setNavActiveIndex])

  return (
    <>
      <Loader />
      <div
        className={cn(
          'ease-in-out-lg h-dvh w-dvw origin-top transition-[filter,opacity,scale] duration-800',
          isSettingsOpen && 'scale-90 opacity-30 blur-sm lg:scale-95 dark:opacity-20'
        )}
      >
        <div
          ref={sceneScrollerRef}
          className="no-scrollbar scene-scroller relative z-[1] flex h-full w-full snap-x snap-mandatory overflow-x-auto"
        >
          <SceneLanding
            id="home"
            ref={landingRef}
            className={cn(
              'ease-in-out-lg relative z-10 w-full flex-shrink-0 snap-start',
              isDataLoaded && 'md:w-1/2 md:max-lg:order-1 lg:w-1/3',
              !isAnimated && 'transition-[width] duration-800'
            )}
          />
          {isAnimated && (
            <>
              <ScenePunch
                id="punch"
                ref={punchRef}
                className="w-full flex-shrink-0 snap-start md:max-lg:order-3 lg:w-1/3"
              />
              <SceneCalendar
                id="calendar"
                ref={calendarRef}
                className="calendar relative z-10 w-full flex-shrink-0 max-md:snap-start md:w-1/2 md:max-lg:order-2 lg:w-1/3"
              />
            </>
          )}
        </div>
        {isAnimated && <Nav />}
      </div>
      <Settings />
      <Toaster
        position="top-center"
        offset="5vh"
        toastOptions={{
          unstyled: true,
          className:
            'font-alice text-sm text-foreground flex items-center gap-3 w-100 p-5 bg-white dark:bg-black backdrop-blur-sm rounded-lg',
          classNames: {
            icon: 'text-primary'
          }
        }}
      />
    </>
  )
}
