import type { MonthDetailDataItem } from '@/lib/api/client'
import { motion, cubicBezier } from 'motion/react'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useAtomValue } from 'jotai'
import { monthDetailAtom } from '@/store/atoms'
import { cn } from '@/lib/utils'

const CalendarItem = ({
  data,
  index,
  className,
  todayRef,
  ref
}: {
  data: MonthDetailDataItem
  index: number
  className?: string
  todayRef: React.RefObject<HTMLDivElement>
  ref: React.RefObject<HTMLDivElement[]>
}) => {
  const currentDate = new Date(data.date)
  const date = currentDate.getDate().toString().padStart(2, '0')
  const weekday = currentDate.toLocaleDateString('en', { weekday: 'long' }) + '.'
  const month = currentDate.toLocaleDateString('en', { month: 'short' }) + '.'
  const isToday = currentDate.toLocaleDateString('en') === new Date().toLocaleDateString('en')
  const isBeforeToday = currentDate.getTime() < new Date().getTime() || isToday
  const punchTime = [data.timeStart, data.timeEnd]
  const isAbnormal = data.compareStatus > 0

  return (
    <div
      ref={(el) => {
        if (el && isToday) {
          todayRef.current = el
        }
        if (el) {
          ref.current[index] = el
        }
      }}
      data-calendar-item
      className={cn('min-h-[8.125rem] w-full px-12 py-6', className)}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: cubicBezier(0.85, 0, 0.15, 1), delay: 0.05 * index }}
        className="group relative flex h-full w-full items-center gap-2"
      >
        <span
          className={cn(
            'inline-block min-w-[4.5rem] pb-2 text-[4rem] leading-[1.15em]',
            isToday ? 'text-sunrise' : 'text-secondary-foreground'
          )}
        >
          {date}
        </span>
        <div>
          <span
            className={cn('block text-lg leading-[1em]', isToday ? 'text-foreground' : 'text-secondary-foreground')}
          >
            {weekday}
          </span>
          <span className={cn('block', isToday ? 'text-primary-foreground' : 'text-tertiary-foreground')}>{month}</span>
        </div>
        <div
          className={cn(
            'ml-auto flex flex-col items-end',
            !isBeforeToday && 'translate-x-2 opacity-0 duration-300 group-hover:translate-x-0 group-hover:opacity-100'
          )}
        >
          {data.workTypeString !== '工作日' ? (
            <span className={cn(isToday ? 'text-foreground' : 'text-secondary-foreground')}>day off!</span>
          ) : data.workTypeString === '工作日' ? (
            punchTime.map((time, index) => (
              <div
                key={`${date}-${index}`}
                className="flex items-center gap-1"
              >
                <span className={cn(isToday ? 'text-foreground' : 'text-secondary-foreground')}>{time}</span>
                <span className={cn(isToday ? 'text-primary-foreground' : 'text-tertiary-foreground')}>/</span>
                <span
                  className={cn(
                    'inline-block min-w-[1.375rem] text-center',
                    isToday ? 'text-primary-foreground' : 'text-tertiary-foreground'
                  )}
                >
                  {index === 0 ? 'in' : 'out'}
                </span>
              </div>
            ))
          ) : null}
        </div>
        {isAbnormal && (
          <div className="bg-sunrise absolute top-1/2 right-0 h-[.375rem] w-[.375rem] -translate-y-1/2 rounded-full duration-300 group-hover:translate-x-2 group-hover:opacity-0"></div>
        )}
      </motion.div>
    </div>
  )
}

export default function Calendar({
  className,
  ref,
  id
}: {
  className?: string
  ref: React.RefObject<HTMLDivElement>
  id: string
}) {
  const monthDetail = useAtomValue(monthDetailAtom)
  const todayRef = useRef<HTMLDivElement>(null!)
  const scrollerRef = useRef<HTMLDivElement>(null!)
  const itemRefs = useRef<HTMLDivElement[]>([])

  // 拖曳滾動相關狀態
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const startY = useRef(0)
  const startScrollTop = useRef(0)
  const velocity = useRef(0)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const animationFrame = useRef<number | null>(null)

  // 檢測是否為觸控裝置
  const isTouchDevice = useCallback(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }, [])

  // 慣性滾動動畫
  const inertiaScroll = useCallback(() => {
    if (!scrollerRef.current) {
      animationFrame.current = null
      return
    }

    const currentScrollTop = scrollerRef.current.scrollTop
    const newScrollTop = currentScrollTop + velocity.current

    scrollerRef.current.scrollTop = newScrollTop
    velocity.current *= 0.95 // 減速係數

    animationFrame.current = requestAnimationFrame(inertiaScroll)
  }, [])

  // 滑鼠按下事件
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isTouchDevice()) return

      setIsDragging(true)
      isDraggingRef.current = true
      startY.current = e.clientY
      lastY.current = e.clientY
      lastTime.current = Date.now()
      startScrollTop.current = scrollerRef.current?.scrollTop || 0
      velocity.current = 0

      // 停止任何正在進行的慣性滾動
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
        animationFrame.current = null
      }

      e.preventDefault()
    },
    [isTouchDevice]
  )

  // 滑鼠移動事件
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !scrollerRef.current || isTouchDevice()) return

      const currentY = e.clientY
      const deltaY = startY.current - currentY
      const currentTime = Date.now()
      const timeDelta = currentTime - lastTime.current

      if (timeDelta > 0) {
        velocity.current = ((lastY.current - currentY) / timeDelta) * 16
      }

      scrollerRef.current.scrollTop = startScrollTop.current + deltaY
      lastY.current = currentY
      lastTime.current = currentTime

      e.preventDefault()
    },
    [isTouchDevice]
  )

  // 滑鼠釋放事件
  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current || isTouchDevice()) return

    setIsDragging(false)
    isDraggingRef.current = false

    // 啟動慣性滾動
    if (Math.abs(velocity.current) > 1) {
      inertiaScroll()
    }
  }, [isTouchDevice, inertiaScroll])

  // 添加全域滑鼠事件監聽器
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e)
    const handleGlobalMouseUp = () => handleMouseUp()

    if (!isTouchDevice()) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [handleMouseMove, handleMouseUp, isTouchDevice])

  // 初始滾動到今天
  useEffect(() => {
    if (todayRef.current && scrollerRef.current) {
      const scrollerPaddingYDiff = 76
      const scrollToTop = Math.round(
        todayRef.current.offsetTop - scrollerRef.current.getBoundingClientRect().height / 2 + scrollerPaddingYDiff
      )
      scrollerRef.current.scrollTo({
        top: scrollToTop
      })
    }
  }, [todayRef, scrollerRef])

  // 滾動遮罩計算
  useEffect(() => {
    if (scrollerRef.current) {
      const scroller = scrollerRef.current
      const setScrollMask = () => {
        const scrollTop = scroller.scrollTop
        const scrollHeight = scroller.scrollHeight
        const height = scroller.getBoundingClientRect().height
        const scrollDiff = scrollHeight - height
        const maskTop = (Math.min(scrollTop / scrollDiff, 0.1) * 100 * 2).toFixed(1)
        const maskBottom = (100 - Math.min((scrollDiff - scrollTop) / scrollDiff, 0.1) * 100 * 2).toFixed(1)
        scroller.style.setProperty('--mask-top', `${maskTop}%`)
        scroller.style.setProperty('--mask-bottom', `${maskBottom}%`)
      }
      setScrollMask()
      scroller.addEventListener('scroll', setScrollMask)
      return () => scroller.removeEventListener('scroll', setScrollMask)
    }
  }, [scrollerRef])

  // item scaleY 效果
  useEffect(() => {
    if (itemRefs.current.length > 0 && scrollerRef.current) {
      const scroller = scrollerRef.current
      const items = itemRefs.current
      const observingItems = new Set<HTMLDivElement>(items)
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observingItems.add(entry.target as HTMLDivElement)
          } else {
            observingItems.delete(entry.target as HTMLDivElement)
          }
        })
      })
      items.forEach((item) => {
        observer.observe(item)
      })

      const onScroll = () => {
        observingItems.forEach((item) => {
          const distanceToCenter = Math.abs(
            scroller.getBoundingClientRect().height / 2 -
              (item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2)
          )
          const scaleY = 1 - (distanceToCenter / (scroller.getBoundingClientRect().height / 2)) * 0.2
          item.style.transform = `scaleY(${scaleY})`
        })
      }
      onScroll()
      scroller.addEventListener('scroll', onScroll)
      return () => {
        items.forEach((item) => {
          observer.unobserve(item)
        })
        scroller.removeEventListener('scroll', onScroll)
      }
    }
  }, [itemRefs, scrollerRef])

  return (
    <div
      ref={ref}
      id={id}
      className={cn('flex h-full w-full flex-col items-center justify-center', className)}
    >
      <motion.div
        ref={scrollerRef}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: cubicBezier(0.85, 0, 0.15, 1) }}
        className={cn(
          'no-scrollbar py-scene mx-auto h-full w-full max-w-90 overflow-y-auto select-none',
          isTouchDevice() && 'snap-y snap-mandatory',
          !isTouchDevice() && isDragging ? 'cursor-grabbing' : 'cursor-default'
        )}
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent, black var(--mask-top, 20%), black var(--mask-bottom, 80%), transparent)'
        }}
        onMouseDown={handleMouseDown}
      >
        {monthDetail &&
          monthDetail.map((item, index) => {
            return (
              <CalendarItem
                key={item.dateString}
                data={item}
                index={index}
                todayRef={todayRef}
                ref={itemRefs}
                className={cn(isTouchDevice() && 'snap-center')}
              />
            )
          })}
      </motion.div>
    </div>
  )
}
