'use client'

import 'swiper/css'
import { motion, useAnimate, cubicBezier } from 'motion/react'
import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  monthDetailAtom,
  addressListAtom,
  currentAddressIdAtom,
  isDraggingAtom,
  isInClockAtom,
  isPunchingAtom,
  globalLoadingAtom,
  windowWidthAtom,
  isSafariOrIOSAtom
} from '@/store/atoms'
import { usePunch } from '@/hooks/useApi'
import { cn } from '@/lib/utils'
import type { Swiper as SwiperType } from 'swiper'
import { FreeMode, Parallax } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import Badge from '@/components/ui/Badge'
import { LiquidGlass } from 'simple-liquid-glass'

const AddressList = ({ className, isPunched }: { className?: string; isPunched: boolean | null }) => {
  const monthDetail = useAtomValue(monthDetailAtom)
  const addressList = useAtomValue(addressListAtom)
  const windowWidth = useAtomValue(windowWidthAtom)
  const isDragging = useAtomValue(isDraggingAtom)
  const isSafariOrIOS = useAtomValue(isSafariOrIOSAtom)
  const [currentAddressId, setCurrentAddressId] = useAtom(currentAddressIdAtom)
  const [swiperWidth, setSwiperWidth] = useState<number>(0)
  const buttonRefs = useRef<HTMLButtonElement[]>([])
  const swiper = useRef<SwiperType | null>(null)
  const [hasUpdatedSwiper, setHasUpdatedSwiper] = useState<boolean>(false)
  const repetitions = 4

  // 計算 initial slide
  const getInitaiSlide = (): number => {
    if (!addressList || !monthDetail) return 0
    const currentAddressIndex = addressList.findIndex((address) => address.id === currentAddressId) || 0
    const todayDetail = monthDetail.find(
      (detail) => new Date(detail.date).toLocaleDateString('en') === new Date().toLocaleDateString('en')
    )
    if (!todayDetail) return currentAddressIndex

    const isNotWorkDay = todayDetail.workTypeString !== '工作日'

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes() // 分鐘

    const morningLimit = 9 * 60 + 20 // 9:20
    const eveningLimit = 19 * 60 + 40 // 19:40
    const isEarlyMorning = currentTime < morningLimit
    const isLateEvening = currentTime > eveningLimit
    const isPunchIn =
      todayDetail.timeStart &&
      (todayDetail.timeStart.split(':').length === 2
        ? todayDetail.timeStart
            .split(':')
            .map(Number)
            .reduce((acc, current, index) => acc + current * (index === 0 ? 60 : 1), 0) +
            9 * 60 <
          currentTime
        : false)
    const isPunchOut = todayDetail.timeStart

    if (isNotWorkDay || isEarlyMorning || isLateEvening || isPunchIn || isPunchOut) {
      const offAddressIndex = addressList.findIndex((address) => address.id === 'off') || 0
      return offAddressIndex
    }

    return currentAddressIndex
  }

  // 設定 swiper 寬度
  useEffect(() => {
    if (buttonRefs.current.length / repetitions === addressList?.length) {
      const width = Number(
        (
          buttonRefs.current
            .slice(0, addressList.length)
            .reduce((acc, curr) => acc + curr.getBoundingClientRect().width + 8, 0) - 8
        ).toFixed(2)
      )
      setSwiperWidth(width)
    }
  }, [buttonRefs, addressList, windowWidth])

  // update swiper at the first time
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!swiper.current || hasUpdatedSwiper) return
      swiper.current.update()
      setHasUpdatedSwiper(true)
    }, 150)
    return () => clearTimeout(timer)
  }, [swiper, hasUpdatedSwiper])

  // update swiper to off address when isPunched
  useEffect(() => {
    if (!isPunched || !addressList || !swiper.current) return
    const offAddressIndex = addressList.findIndex((address) => address.id === 'off') || 0
    const closestOffAddressIndex =
      Math.floor(swiper.current.realIndex / addressList.length) * addressList.length + offAddressIndex
    swiper.current.slideToLoop(closestOffAddressIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPunched])

  // see current address id change
  useEffect(() => {
    console.log(currentAddressId)
  }, [currentAddressId])

  return addressList?.length && monthDetail ? (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={hasUpdatedSwiper ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 1, ease: cubicBezier(0.85, 0, 0.15, 1) }}
        className="relative"
      >
        <Swiper
          modules={[FreeMode, Parallax]}
          slidesPerView={addressList.length}
          spaceBetween={8}
          initialSlide={getInitaiSlide() + addressList.length}
          loop={true}
          centeredSlides={true}
          parallax={true}
          freeMode={{
            enabled: true,
            sticky: true
          }}
          onSwiper={(swiperInstance) => {
            swiper.current = swiperInstance
          }}
          onRealIndexChange={(swiperInstance) => {
            setCurrentAddressId(addressList[swiperInstance.realIndex % addressList.length].id)
          }}
          style={{ width: swiperWidth }}
          className={cn(
            'relative z-10 mask-[image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]',
            className
          )}
        >
          {Array.from({ length: repetitions }, () => addressList)
            .flat()
            ?.map((address, index) => (
              <SwiperSlide
                key={`${address.id}-${index}`}
                className="!w-auto"
              >
                <button
                  ref={(el) => {
                    if (el) {
                      buttonRefs.current[index] = el
                    }
                  }}
                  type="button"
                  className={cn(
                    'cursor-pointer p-2 pt-3 duration-300',
                    isDragging && currentAddressId !== address.id && 'opacity-0',
                    currentAddressId === address.id && 'pointer-events-none'
                  )}
                  data-address-id={address.id}
                  onClick={() => {
                    swiper.current?.slideToLoop(index)
                  }}
                >
                  <span
                    className="inline-block text-base leading-[1] md:text-lg"
                    data-swiper-parallax-scale="0.8"
                    data-swiper-parallax-opacity="0.1"
                  >
                    {address.name}
                  </span>
                </button>
              </SwiperSlide>
            ))}
        </Swiper>
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 duration-300',
            isDragging ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          )}
          style={{
            width: (buttonRefs.current[0]?.clientWidth || 0) + 8,
            height: (buttonRefs.current[0]?.clientHeight || 0) - 8
          }}
        >
          <LiquidGlass
            mode="preset"
            aberrationIntensity={0.1}
            border={0.15}
            radius={99}
            borderColor="color-mix(in srgb, var(--foreground) 25%, transparent)"
            className={cn('clock-shadow', isSafariOrIOS && 'backdrop-blur-[.375rem]')}
          ></LiquidGlass>
        </div>
      </motion.div>
    </>
  ) : null
}

const ClockNumber = ({ prev, current, duration = 1 }: { prev: string; current: string; duration?: number }) => {
  const prevRef = useRef<HTMLSpanElement>(null)
  const currentRef = useRef<HTMLSpanElement>(null)
  const windowWidth = useAtomValue(windowWidthAtom)
  const [scope, animate] = useAnimate()
  const ease = cubicBezier(0.85, 0, 0.15, 1)

  useLayoutEffect(() => {
    if (scope.current && prevRef.current && currentRef.current) {
      animate(
        scope.current,
        {
          width: [prevRef.current.clientWidth, currentRef.current.clientWidth]
        },
        {
          duration,
          ease
        }
      )

      animate(
        prevRef.current,
        {
          y: ['0%', '-100%'],
          rotateX: ['0deg', '90deg']
        },
        {
          duration,
          ease
        }
      )

      animate(
        currentRef.current,
        {
          y: ['100%', '0%'],
          rotateX: ['-90deg', '0deg']
        },
        {
          duration,
          ease
        }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, prevRef, currentRef, prev, current])

  useEffect(() => {
    if (scope.current && currentRef.current) {
      animate(
        scope.current,
        {
          width: currentRef.current.clientWidth
        },
        {
          duration,
          ease
        }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowWidth])

  return (
    <motion.span
      ref={scope}
      className="text-sunrise relative inline-block overflow-hidden transform-3d"
    >
      <motion.span
        ref={prevRef}
        className="text-sunrise inline-block origin-bottom select-none transform-3d"
        aria-hidden="true"
      >
        {prev}
      </motion.span>
      <motion.span
        ref={currentRef}
        className="text-sunrise absolute top-0 left-0 inline-block origin-top transform-3d"
      >
        {current}
      </motion.span>
    </motion.span>
  )
}

const Clock = ({
  ref,
  isPunched,
  setIsPunched,
  className
}: {
  ref: React.RefObject<HTMLDivElement>
  isPunched: boolean | null
  setIsPunched: (isPunched: boolean | null) => void
  className?: string
}) => {
  const time = new Date()
  const prevTime = new Date(time.getTime() - 1000 * 60)
  const getTimeString = (date?: Date) => {
    return (date || new Date()).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  const timeString = getTimeString(time)
  const prevTimeString = getTimeString(prevTime)
  const [currentText, setCurrentText] = useState<string>(timeString)
  const [prevText, setPrevText] = useState<string>(prevTimeString)
  const isInClock = useAtomValue(isInClockAtom)
  const isDragging = useAtomValue(isDraggingAtom)
  const isSafariOrIOS = useAtomValue(isSafariOrIOSAtom)

  useEffect(() => {
    if (isPunched === null) return
    if (isPunched) {
      setPrevText(getTimeString())
      setCurrentText('PUNCH!')
    } else {
      setPrevText('PUNCH!')
      setCurrentText(getTimeString())
      setIsPunched(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPunched])

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPunched) return
      const currentTimeString = getTimeString()
      if (currentTimeString === currentText) return
      setPrevText(getTimeString(new Date(new Date().getTime() - 1000 * 60)))
      setCurrentText(currentTimeString)
    }, 1000)
    return () => clearInterval(interval)
  }, [isPunched, currentText])

  const maxLength = Math.max(currentText.length, prevText.length)
  const currentArray = currentText.split('')
  const prevArray = prevText.split('')

  while (currentArray.length < maxLength) currentArray.push('')
  while (prevArray.length < maxLength) prevArray.push('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
      className="relative"
    >
      <div
        ref={ref}
        className={cn(
          'punch-clock relative z-10 text-center text-[4.5rem] leading-[1em] transition-transform delay-[30ms] duration-300 perspective-normal lg:text-[clamp(4.5rem,10vh,6rem)]',
          isInClock && 'scale-110',
          className
        )}
      >
        {currentArray.map((text, index) => (
          <ClockNumber
            key={index}
            prev={prevArray[index] || ''}
            current={text}
            duration={0.8 + index * 0.1}
          />
        ))}
      </div>
      <div
        className={cn(
          'ease-in-out-lg absolute top-2 -right-4 bottom-2 -left-4 duration-300',
          isDragging ? 'scale-110 opacity-100' : 'opacity-0',
          isInClock && 'scale-120'
        )}
      >
        <LiquidGlass
          mode="preset"
          aberrationIntensity={0.1}
          border={0.15}
          borderColor="color-mix(in srgb, var(--foreground) 25%, transparent)"
          className={cn('clock-shadow', isSafariOrIOS && 'backdrop-blur-[.375rem]')}
        ></LiquidGlass>
      </div>
    </motion.div>
  )
}

export default function Punch({
  className,
  ref,
  id
}: {
  className?: string
  ref: React.RefObject<HTMLDivElement>
  id: string
}) {
  const setGlobalLoading = useSetAtom(globalLoadingAtom)
  const currentAddressId = useAtomValue(currentAddressIdAtom)
  const isDragging = useAtomValue(isDraggingAtom)
  const [isPunching, setIsPunching] = useAtom(isPunchingAtom)
  const [isPunched, setIsPunched] = useState<boolean | null>(null)
  const { punchInOut } = usePunch()
  const clockRef = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    if (isPunching) {
      const punchInOutHandler = async () => {
        if (!isPunched && currentAddressId !== 'off') {
          setGlobalLoading(true)
          try {
            const isSuccess = await punchInOut()
            if (!isSuccess) {
              throw new Error('Punch in/out has been denied!')
            } else {
              setIsPunched(true)
              setTimeout(() => {
                setIsPunched(false)
              }, 3000)
            }
          } catch (error) {
            console.warn(error)
          } finally {
            setGlobalLoading(false)
          }
        }

        setIsPunching(false)
      }
      punchInOutHandler()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPunching])

  return (
    <>
      <div
        ref={ref}
        id={id}
        className={cn('p-scene relative flex h-full w-full flex-col items-center justify-center', className)}
      >
        <Badge className="absolute top-0 left-0 lg:fixed" />
        <div
          className={cn(
            'mt-auto flex w-full flex-col items-center gap-1 transition-transform duration-300 md:gap-2',
            isDragging && 'translate-y-[calc(var(--height-nav)*0.5)]'
          )}
        >
          <AddressList isPunched={isPunched} />
          <Clock
            ref={clockRef}
            isPunched={isPunched}
            setIsPunched={setIsPunched}
          />
        </div>
      </div>
    </>
  )
}
