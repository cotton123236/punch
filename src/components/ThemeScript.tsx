'use client'

import { useRef } from 'react'
import { useServerInsertedHTML } from 'next/navigation'

// 在第一次繪製前依系統偏好設定 html 的 class，避免主題閃爍
const THEME_SCRIPT = `(function(){try{var t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.className=t}catch(e){}})()`

/**
 * 透過 useServerInsertedHTML 在 SSR 時插入主題 script。
 * 避免直接在元件中 render <script> 觸發 React 的開發警告（參考 Next.js「Preventing Flash」官方指南）。
 * 這個 script 只需要在第一次載入的文件中執行，html 上的 class 在 client 端換頁時會保留。
 */
export default function ThemeScript() {
  const isInserted = useRef(false)

  useServerInsertedHTML(() => {
    if (isInserted.current) return null
    isInserted.current = true

    return (
      <script
        id="theme-script"
        dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
      />
    )
  })

  return null
}
