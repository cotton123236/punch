'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LiquidGlass } from 'simple-liquid-glass'

export default function Switch({
  checked = false,
  onChange,
  className
}: {
  checked: boolean
  onChange?: (value: boolean) => void
  className?: string
}) {
  // const [value, setValue] = useAtom(atom)
  const [isChecked, setIsChecked] = useState(checked)

  return (
    <label className={cn('relative inline-flex h-5 w-12 cursor-pointer items-center', className)}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={isChecked}
        onChange={(e) => {
          setIsChecked(e.target.checked)
          onChange?.(e.target.checked)
        }}
      />
      <div className="peer-checked:bg-primary bg-foreground/10 h-full w-full rounded-full duration-300"></div>
      <div className="absolute -top-1 -left-1 h-7 w-9 rounded-full shadow-lg duration-300 peer-checked:left-4">
        <LiquidGlass
          mode="preset"
          aberrationIntensity={0.1}
          scale={-10}
          borderColor="color-mix(in srgb, var(--foreground) 25%, transparent)"
          className={cn(
            'h-full w-full transition-[background-color] duration-300',
            isChecked
              ? 'bg-[color-mix(in_srgb,var(--color-white)_80%,transparent)]'
              : 'bg-[color-mix(in_srgb,var(--color-white)_25%,transparent)]'
          )}
        />
      </div>
    </label>
  )
}
