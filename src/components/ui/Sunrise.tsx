'use client'

import { cn } from '@/lib/utils'

export default function Sun({ className, onClick }: { className?: string; onClick: () => void }) {
  return (
    <div
      className={cn('bg-sunrise h-20 w-20 rounded-full', className)}
      onClick={onClick}
    ></div>
  )
}
