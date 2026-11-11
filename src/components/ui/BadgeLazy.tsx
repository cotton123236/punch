'use client'

import dynamic from 'next/dynamic'

// Badge 依賴 three.js 與 rapier（含內嵌 wasm），體積很大，拆成獨立 chunk 延遲載入
// 呼叫 loadBadge() 可提前下載；之後 render BadgeLazy 時會直接沿用同一個已快取的模組
export const loadBadge = () => import('@/components/ui/Badge')

export const BadgeLazy = dynamic(loadBadge, { ssr: false })
