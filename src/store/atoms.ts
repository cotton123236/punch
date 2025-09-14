'use client'

import type { UserTokenResponse, EmployeeInfoResponse, AddressList, MonthDetailDataItem } from '@/lib/api/client'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type AddressListWithId = AddressList & { id: 'company' | 'home' | 'off'; name: string }

// visitor mode
export const isVisitorModeAtom = atomWithStorage<boolean>('punch-visitor-mode', false)

export const visitorNicknameAtom = atomWithStorage<string>('punch-visitor-nickname', 'Visitor')

// login token for /user/api/token
export const userTokenAtom = atomWithStorage<string>('punch-refresh_token', '')
// login refresh token for /prohrm/api/login/refresh
export const loginRefreshTokenAtom = atomWithStorage<string>('punch-refreshToken', '')

export const cidAtom = atomWithStorage<string>('punch-cid', '')
export const pidAtom = atomWithStorage<string>('punch-pid', '')
export const deviceIdAtom = atomWithStorage<string>('punch-deviceId', '')

export const isLoginAtom = atom<boolean>(
  (get) => !!(get(accessTokenAtom) && get(cidAtom) && get(pidAtom) && get(deviceIdAtom)) || get(isVisitorModeAtom)
)

// 登入資訊
export const loginAtom = atom<{
  account: string
  password: string
}>({
  account: '',
  password: ''
})

// access token for punch in/out
export const accessTokenAtom = atom<string>('')

export const userInfoAtom = atom<UserTokenResponse['user'] | null>(null)

export const employeeInfoAtom = atom<EmployeeInfoResponse | null>(null)

export const addressListAtom = atom<AddressListWithId[] | null>(null)

export const monthDetailAtom = atom<MonthDetailDataItem[] | null>(null)

export const isDataLoadedAtom = atom<boolean>((get) => {
  return !!(get(employeeInfoAtom) && get(addressListAtom) && get(monthDetailAtom))
})

export const currentAddressIdAtom = atom<'company' | 'home' | 'off'>('home')

// error message
export const errorMessageAtom = atom<string>('')

// success message
export const successMessageAtom = atom<string>('')

// loading
export const globalLoadingAtom = atom<boolean>(false)

// hydration state
export const isHydratedAtom = atom<boolean>(false)

// punching state
export const isDraggingAtom = atom<boolean>(false)
export const isInClockAtom = atom<boolean>(false)
export const isPunchingAtom = atom<boolean>(false)

// theme
export const themeAtom = atom<string>('light')

// nav
export const navAtom = atom<{ name: string; id: string }[]>([
  {
    name: 'Home',
    id: 'home'
  },
  {
    name: 'Punch',
    id: 'punch'
  },
  {
    name: 'Calendar',
    id: 'calendar'
  }
])

export const navActiveIndexAtom = atom<number>(0)

export const windowWidthAtom = atom<number>(0)

export const deviceSizeAtom = atom<'sm' | 'md' | 'lg'>((get) => {
  const windowWidth = get(windowWidthAtom)
  if (windowWidth < 768) return 'sm'
  if (windowWidth < 1024) return 'md'
  return 'lg'
})

export const isSettingsOpenAtom = atom<boolean>(false)

export const nicknameAtom = atomWithStorage<string>('punch-nickname', '')

export const isNotificationEnabledAtom = atomWithStorage<boolean>('punch-notification', false)

export const notificationStartTimeAtom = atomWithStorage<string>('punch-notificationStartTime', '09:30')

export const notificationEndTimeAtom = atomWithStorage<string>('punch-notificationEndTime', '18:30')

export const punchThemeAtom = atom<{ primary: string; secondary: string }[]>([
  { primary: '#ea7c60', secondary: '#f7bfc7' },
  { primary: '#0f7989', secondary: '#c3c5e7' },
  { primary: '#b44276', secondary: '#b0e7dd' },
  { primary: '#654083', secondary: '#bfe8e8' },
  { primary: '#901f15', secondary: '#fff4d8' },
  { primary: '#2b556e', secondary: '#f3bca1' },
  { primary: '#1d5639', secondary: '#eaeecf' },
  { primary: '#2c3e50', secondary: '#d6dbdf' }
])

export const punchThemeActiveIndexAtom = atomWithStorage<number>('punch-theme', 0)

// is iOS
export const isIOSAtom = atom<boolean>(() => {
  if (typeof navigator === 'undefined') return false

  const userAgent = navigator.userAgent || ''
  const isIOSUserAgent = /iPad|iPhone|iPod/.test(userAgent) && !/MSStream/.test(userAgent)

  const maxTouchPoints = navigator.maxTouchPoints || 0
  const hasTouchPoints = maxTouchPoints > 1

  return isIOSUserAgent || hasTouchPoints
})

// is Safari
export const isSafariAtom = atom<boolean>(() => {
  if (typeof navigator === 'undefined') return false

  const userAgent = navigator.userAgent || ''
  const isSafari =
    /Safari/.test(userAgent) &&
    !/Chrome/.test(userAgent) &&
    !/CriOS/.test(userAgent) &&
    !/FxiOS/.test(userAgent) &&
    !/Edg/.test(userAgent) &&
    !/OPR/.test(userAgent) &&
    !/Vivaldi/.test(userAgent)

  return isSafari
})

// is iOS or Safari
export const isSafariOrIOSAtom = atom<boolean>((get) => {
  return get(isIOSAtom) || get(isSafariAtom)
})

// Global time atom
export const timeAtom = atom<Date>(new Date())

export const dateAtom = atom<number>((get) => {
  return get(timeAtom).getDate()
})

timeAtom.onMount = (set) => {
  const intervalId = setInterval(() => {
    set(new Date())
  }, 1000)

  return () => clearInterval(intervalId)
}
