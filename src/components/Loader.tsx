'use client'

import { useAtom } from 'jotai'
import { useEffect, useState, useRef } from 'react'
import { globalLoadingAtom } from '@/store/atoms'
import { cn } from '@/lib/utils'

export default function Loader({ className }: { className?: string }) {
  const [globalLoading] = useAtom(globalLoadingAtom)
  const [shouldRender, setShouldRender] = useState(false)
  const animationStartTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (globalLoading) {
      // 當開始 loading 時立即顯示並記錄開始時間
      setShouldRender(true)
      animationStartTimeRef.current = Date.now()
    } else if (shouldRender && animationStartTimeRef.current) {
      // 當結束 loading 時，計算到下一個完整週期結束的時間
      const animationDuration = 2000
      const elapsed = Date.now() - animationStartTimeRef.current
      const cyclesCompleted = Math.floor(elapsed / animationDuration)
      const nextCycleEnd = (cyclesCompleted + 1) * animationDuration
      const remainingTime = nextCycleEnd - elapsed

      const timer = setTimeout(() => {
        setShouldRender(false)
        animationStartTimeRef.current = null
      }, remainingTime)

      return () => clearTimeout(timer)
    }
  }, [globalLoading, shouldRender])

  if (!shouldRender) return null

  return (
    <div className={cn('fixed inset-0 z-0 flex items-end justify-center overflow-hidden', className)}>
      <div className="animate-ripple-primary from-primary to-secondary absolute bottom-0 left-1/2 aspect-square w-[max(100vh,100vw)] rounded-full bg-radial opacity-0 blur-[5rem]" />
      <div className="animate-ripple-secondary to-secondary from-background absolute bottom-0 left-1/2 aspect-square w-[max(90vh,90vw)] rounded-full bg-radial opacity-0 blur-[5rem]" />
    </div>
  )
}
