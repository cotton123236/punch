'use client'

import type {
  UserTokenBody,
  UserTokenResponse,
  LoginTokenResponse,
  LoginRefreshResponse,
  EmployeeInfoResponse,
  CardSettingResponse,
  MonthDetailResponse,
  CardGpsResponse
} from '@/lib/api/client'
import { useAtom, useSetAtom, useAtomValue } from 'jotai'
import { RESET } from 'jotai/utils'
import { useCallback } from 'react'
import { apiClient } from '@/lib/api/client'
import { mockEmployeeInfo, mockAddressList, mockMonthDetail } from '@/lib/api/mock'
import {
  type AddressListWithId,
  userTokenAtom,
  loginRefreshTokenAtom,
  cidAtom,
  pidAtom,
  deviceIdAtom,
  loginAtom,
  accessTokenAtom,
  userInfoAtom,
  employeeInfoAtom,
  addressListAtom,
  currentAddressIdAtom,
  monthDetailAtom,
  errorMessageAtom,
  isVisitorModeAtom
} from '@/store/atoms'

export const useBackendErrorHandler = () => {
  return useCallback((error: unknown, context?: string) => {
    const message = error instanceof Error ? error.message : '發生未知錯誤'
    const logMessage = context ? `[${context}] ${message}` : message
    console.warn('Backend Error:', logMessage)
  }, [])
}

export const useFrontendErrorHandler = () => {
  const setErrorMessage = useSetAtom(errorMessageAtom)

  return useCallback(
    (message: string) => {
      setErrorMessage(message)
    },
    [setErrorMessage]
  )
}

// 組合錯誤處理
export const useErrorHandler = () => {
  const handleBackendError = useBackendErrorHandler()
  const handleFrontendError = useFrontendErrorHandler()

  return {
    backend: handleBackendError,
    frontend: handleFrontendError,
    both: useCallback(
      (error: unknown, userMessage?: string, context?: string) => {
        handleBackendError(error, context)
        if (userMessage) {
          handleFrontendError(userMessage)
        }
      },
      [handleBackendError, handleFrontendError]
    )
  }
}

// auth hooks
export const useAuth = () => {
  const loginData = useAtomValue(loginAtom)
  const [userToken, setUserToken] = useAtom(userTokenAtom)
  const [loginRefreshToken, setLoginRefreshToken] = useAtom(loginRefreshTokenAtom)
  const [cid, setCid] = useAtom(cidAtom)
  const [pid, setPid] = useAtom(pidAtom)
  const setUserInfo = useSetAtom(userInfoAtom)
  const setAccessToken = useSetAtom(accessTokenAtom)
  const setDeviceId = useSetAtom(deviceIdAtom)
  const setMonthDetail = useSetAtom(monthDetailAtom)
  const setAddressList = useSetAtom(addressListAtom)
  const setEmployeeInfo = useSetAtom(employeeInfoAtom)
  const setIsVisitorMode = useSetAtom(isVisitorModeAtom)
  const errorHandler = useErrorHandler()

  const postUserToken = useCallback(async (): Promise<UserTokenResponse> => {
    try {
      if (!userToken && (!loginData.account || !loginData.password)) {
        throw new Error('Account or password is required!')
      }

      const body: UserTokenBody =
        loginData.account && loginData.password
          ? {
              username: loginData.account,
              password: loginData.password,
              grant_type: 'password'
            }
          : { refresh_token: userToken, grant_type: 'refresh_token' }
      const userTokenResponse = await apiClient.auth.userToken(body)

      if (userTokenResponse.code === 200) {
        return userTokenResponse
      } else {
        throw new Error(userTokenResponse.message)
      }
    } catch (error) {
      errorHandler.backend(error, 'postUserToken')
      throw error
    }
  }, [errorHandler, loginData, userToken])

  const postLoginToken = useCallback(async (): Promise<LoginTokenResponse['data']> => {
    try {
      const loginTokenResponse = await apiClient.auth.loginToken({
        acc: loginData.account,
        pwd: loginData.password
      })

      if (loginTokenResponse.code === 200) {
        return loginTokenResponse.data
      } else {
        throw new Error(loginTokenResponse.message)
      }
    } catch (error) {
      errorHandler.backend(error, 'postLoginToken')
      throw error
    }
  }, [errorHandler, loginData])

  const postLoginRefresh = useCallback(async (): Promise<LoginRefreshResponse['data']> => {
    try {
      const loginRefreshResponse = await apiClient.auth.loginRefresh({
        cid: cid,
        pid: pid,
        refreshToken: loginRefreshToken
      })

      if (loginRefreshResponse.code === 200) {
        return loginRefreshResponse.data
      } else {
        throw new Error(loginRefreshResponse.message)
      }
    } catch (error) {
      errorHandler.backend(error, 'postLoginRefresh')
      throw error
    }
  }, [errorHandler, cid, pid, loginRefreshToken])

  const login = useCallback(async (): Promise<boolean> => {
    try {
      const userTokenResponse = await postUserToken()
      await apiClient.auth.userTokenCookies(userTokenResponse.access_token)
      setUserToken(userTokenResponse.refresh_token)
      setUserInfo(userTokenResponse.user)

      if (!loginRefreshToken || !cid || !pid) {
        const loginTokenResponse = await postLoginToken()
        setLoginRefreshToken(loginTokenResponse.refresh)
        setCid(loginTokenResponse.data.cid)
        setPid(loginTokenResponse.data.pid)
        setAccessToken(loginTokenResponse.access)
      } else {
        const accessToken = await postLoginRefresh()
        setAccessToken(accessToken)
      }

      return true
    } catch (error) {
      errorHandler.both(error, 'Login Failed! Please try again or check your account and password.', 'login')
      return false
    }
  }, [
    setUserToken,
    loginRefreshToken,
    setLoginRefreshToken,
    cid,
    setCid,
    pid,
    setPid,
    errorHandler,
    postUserToken,
    postLoginToken,
    postLoginRefresh,
    setUserInfo,
    setAccessToken
  ])

  const signOut = useCallback(async () => {
    setUserToken(RESET)
    setLoginRefreshToken(RESET)
    setCid(RESET)
    setPid(RESET)
    setDeviceId(RESET)
    setAccessToken('')
    setMonthDetail(null)
    setAddressList(null)
    setEmployeeInfo(null)

    setIsVisitorMode(false)
  }, [
    setUserToken,
    setLoginRefreshToken,
    setCid,
    setPid,
    setDeviceId,
    setAccessToken,
    setMonthDetail,
    setAddressList,
    setEmployeeInfo,
    setIsVisitorMode
  ])

  return {
    login,
    signOut
  }
}

export const useData = () => {
  const accessToken = useAtomValue(accessTokenAtom)
  const cid = useAtomValue(cidAtom)
  const pid = useAtomValue(pidAtom)
  const deviceId = useAtomValue(deviceIdAtom)
  const isVisitorMode = useAtomValue(isVisitorModeAtom)
  const setAddressList = useSetAtom(addressListAtom)
  const setEmployeeInfo = useSetAtom(employeeInfoAtom)
  const setMonthDetail = useSetAtom(monthDetailAtom)
  const errorHandler = useErrorHandler()

  // employee info
  const postEmployeeInfo = useCallback(async (): Promise<EmployeeInfoResponse> => {
    try {
      if (!accessToken || !pid) {
        throw new Error('postEmployeeInfo: Access token or pid is required!')
      }

      const employeeInfoResponse = await apiClient.auth.employeeBasicInfo(accessToken, pid)
      return employeeInfoResponse
    } catch (error) {
      errorHandler.backend(error, 'postEmployeeInfo')
      throw error
    }
  }, [accessToken, pid, errorHandler])

  const getEmployeeInfo = useCallback(async () => {
    if (isVisitorMode) {
      setEmployeeInfo(mockEmployeeInfo)
      return
    }
    try {
      const employeeInfoResponse = await postEmployeeInfo()
      setEmployeeInfo(employeeInfoResponse)
    } catch (error) {
      errorHandler.backend(error, 'getEmployeeInfo')
      throw error
    }
  }, [postEmployeeInfo, errorHandler, setEmployeeInfo, isVisitorMode])

  // address list
  const postCardSetting = useCallback(async (): Promise<CardSettingResponse['data']> => {
    try {
      if (!accessToken || !cid || !pid || !deviceId) {
        throw new Error('postCardSetting: accessToken, cid, pid or deviceId is required!')
      }

      const cardSettingResponse = await apiClient.auth.getCardSetting(accessToken, {
        cid,
        pid,
        deviceId
      })

      if (cardSettingResponse.success) {
        return cardSettingResponse.data
      } else {
        throw new Error(cardSettingResponse.message)
      }
    } catch (error) {
      errorHandler.backend(error, 'postCardSetting')
      throw error
    }
  }, [accessToken, cid, pid, deviceId, errorHandler])

  const getAddressList = useCallback(async () => {
    if (isVisitorMode) {
      setAddressList(mockAddressList)
      return
    }
    try {
      const cardSettingResponse = await postCardSetting()
      const addressList = cardSettingResponse[0]?.addressList ?? []
      const addressListWithId = [
        ...addressList.map((address) => {
          const isCompany = address.address.includes(process.env.NEXT_PUBLIC_COMPANY_ADDRESS || '')
          return {
            ...address,
            id: isCompany ? 'company' : 'home',
            name: isCompany ? '公司' : '住家'
          }
        }),
        {
          id: 'off',
          name: '關閉',
          latitude: 0,
          longitude: 0
        }
      ] as AddressListWithId[]
      setAddressList(addressListWithId)
    } catch (error) {
      errorHandler.backend(error, 'getAddressList')
      throw error
    }
  }, [postCardSetting, errorHandler, setAddressList, isVisitorMode])

  // month detail
  const postMonthDetail = useCallback(async (): Promise<MonthDetailResponse['data']> => {
    try {
      if (!accessToken || !pid || !cid) {
        throw new Error('postMonthDetail: accessToken, pid or cid is required!')
      }

      const date = new Date()
      const month = date.getMonth() + 1
      const year = date.getFullYear()

      const monthDetailResponse = await apiClient.auth.getMonthDetail(accessToken, {
        month,
        year,
        pid,
        cid
      })

      if (monthDetailResponse.success) {
        return monthDetailResponse.data
      } else {
        throw new Error(monthDetailResponse.message)
      }
    } catch (error) {
      errorHandler.backend(error, 'postMonthDetail')
      throw error
    }
  }, [accessToken, pid, cid, errorHandler])

  const getMonthDetail = useCallback(async () => {
    if (isVisitorMode) {
      setMonthDetail(mockMonthDetail)
      return
    }
    try {
      const monthDetailResponse = await postMonthDetail()
      setMonthDetail(monthDetailResponse)
    } catch (error) {
      errorHandler.backend(error, 'getMonthDetail')
      throw error
    }
  }, [postMonthDetail, errorHandler, setMonthDetail, isVisitorMode])

  return {
    getEmployeeInfo,
    getAddressList,
    getMonthDetail
  }
}

export const usePunch = () => {
  const accessToken = useAtomValue(accessTokenAtom)
  const deviceId = useAtomValue(deviceIdAtom)
  const addressList = useAtomValue(addressListAtom)
  const [currentAddressId, setCurrentAddressId] = useAtom(currentAddressIdAtom)
  const [monthDetail, setMonthDetail] = useAtom(monthDetailAtom)
  const isVisitorMode = useAtomValue(isVisitorModeAtom)
  const errorHandler = useErrorHandler()

  const postCardGps = useCallback(async (): Promise<CardGpsResponse> => {
    try {
      if (isVisitorMode) {
        const date = new Date()
        const timeStart = date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
        const timeEnd =
          date.getHours() * 60 + date.getMinutes() > 12 * 60
            ? date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
            : ''
        const cardTime = date.toISOString()
        return {
          code: 200,
          message: 'success',
          data: {
            timeStart,
            timeEnd,
            cardTime,
            isTemperatureOpen: false,
            isBindDevice: false,
            isRequiredReason: false,
            isOverAttendance: false,
            overAttCardDataId: 0
          }
        }
      }

      if (!accessToken || !deviceId) {
        throw new Error('accessToken or deviceId is required!')
      }

      const currentAddress = addressList?.find((address) => address.id === currentAddressId)
      if (!currentAddress) {
        throw new Error('Can not get current address!')
      }

      if (currentAddressId === 'off') {
        return {
          code: 200,
          message: 'PUNCH OFF!'
        }
      }

      const date = new Date()
      const callApiTimeISO = date.toISOString()
      const callApiTime = date.getTime()
      const body = {
        deviceId,
        latitude: currentAddress.latitude,
        longitude: currentAddress.longitude,
        callApiTimeISO,
        callApiTime
      }

      const cardGpsResponse = await apiClient.auth.cardGps(accessToken, body)

      // console.log(cardGpsResponse)

      if (cardGpsResponse.code === 200) {
        return cardGpsResponse
      } else {
        throw new Error(cardGpsResponse.message)
      }
    } catch (error) {
      errorHandler.backend(error, 'postCardGps')
      throw error
    }
  }, [isVisitorMode, accessToken, deviceId, addressList, currentAddressId, errorHandler])

  const punchInOut = useCallback(async (): Promise<boolean> => {
    try {
      const cardGpsResponse = await postCardGps()

      if (cardGpsResponse.code === 200 && cardGpsResponse.data) {
        const data = cardGpsResponse.data
        const todayDateString = new Date(data.cardTime).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })

        if (Array.isArray(monthDetail)) {
          setMonthDetail(
            monthDetail.map((item) => {
              if (item.dateString === todayDateString) {
                return {
                  ...item,
                  timeStart: data.timeStart,
                  timeEnd: data.timeEnd
                }
              }
              return item
            })
          )
        }

        if (data.timeEnd) {
          setCurrentAddressId('off')
        }

        return true
      } else if (cardGpsResponse.code === 200 && cardGpsResponse.message) {
        errorHandler.frontend(cardGpsResponse.message)
        return true
      } else {
        return false
      }
    } catch (error) {
      errorHandler.both(error, 'Punch in/out failed! Please try again later.', 'punchInOut')
      throw error
    }
    /* eslint-disable-next-line */
  }, [postCardGps, errorHandler, isVisitorMode])

  return {
    punchInOut
  }
}
