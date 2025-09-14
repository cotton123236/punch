import { API_PATHS, type ApiPath } from '@/lib/api/paths'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | string
}

export type UserTokenBody =
  | {
      refresh_token: string
      grant_type: 'refresh_token'
    }
  | {
      username: string
      password: string
      grant_type: 'password'
    }

type CompanyType = {
  mdmKey: string
  suspendDate: number
  nickName: string
  status: number
  invoice: string
  updateDate: number
  displayName: string
  isPay: number
  name: string
  toggleIndustryFeeds: boolean
  verificateDate: number
  cid: string
  empStatus: number
  isManager: boolean
  suspendCount: number
  nickNameSearch: string
  industryCategory: number
  isOpen: number
  pid: string
  createDate: number
}

export type UserTokenResponse = {
  code: number
  message: string
  token_type: string
  expires_in: number
  refresh_token: string
  access_token: string
  user: {
    cid: string
    CID: string
    walkthroughFlag: boolean
    lastLoginDate: number
    PID: string
    companies: {
      [key: string]: CompanyType
    }
    permissions: {
      bulletin: boolean
    }
    headPhoto: object
    pid: string
  }
}

export type LoginTokenBody = {
  pwd: string
  acc: string
}

export type LoginTokenResponse = {
  code: number
  message: string
  data: {
    refresh: string
    data: {
      cid: string
      pid: string
    }
    access: string
  }
}

export type LoginRefreshBody = {
  cid: string
  pid: string
  refreshToken: string
}

export type LoginRefreshResponse = {
  code: number
  message: string
  data: string
}

export type EmployeeInfoResponse = {
  empSelfPhoto: string
  empBid: number
  positionName: string
  hireDate: number
  depId: number
  depName: string
  empNo: string
  isBoss: false
  empId: number
  name: string
  pid: number
}

export type CardSettingBody = {
  cid: string
  pid: string
  deviceId: string
}

export type AddressList = {
  latitude: number
  longitude: number
  clockInLimitDistance: number
  address: string
}

export type CardSettingResponse = {
  success: boolean
  code: string
  message: string
  errorCode: string
  jsonString: string
  data: {
    addressList: AddressList[]
    wifiList: {
      name: string
      macAddress: string
    }[]
    mappingDevice: boolean
    serverDateString: string
    bindDeviceTip: string
    serverDate: number
    wifiEnable: boolean
    clockInLimitDistance: number
    deviceMappingErrTip: string
    canUse: boolean
    bluetoothList: []
    bluetoothEnable: boolean
    bindDevice: boolean
    gpsEnable: boolean
    haveDeviceId: boolean
  }[]
}

export type MonthDetailBody = {
  month: number
  year: number
  pid: string
  cid: string
}

export type MonthDetailDataItem = {
  dateString: string
  festivalName: string
  workType: number
  isWorkDay: boolean
  timeEnd: string
  temperature: number
  weekDay: string
  timeStart: string
  handleStatus: number
  overAttCardDataId: number
  cardOverAttendanceReasonModels: []
  overAttendanceStatus: number
  temperatureSetting: number
  handleStatusString: string
  date: number
  punchCardTime: null
  compareStatusString: string
  compareStatus: number
  overAttRequiredReason: boolean
  workTypeString: '工作日' | '休息日' | '例假日'
  cardRestInterval: []
  overAttEnable: boolean
  lunarDateString: string
}

export type MonthDetailResponse = {
  success: boolean
  code: number
  message: string
  errorCode: string
  jsonString: string
  data: MonthDetailDataItem[]
}

export type CardGpsBody = {
  deviceId: string
  latitude: number
  longitude: number
  callApiTimeISO: string
  callApiTime: number
}

export type CardGpsResponse = {
  code: number
  message: string
  data?: {
    timeEnd: string
    cardTime: string
    isTemperatureOpen: boolean
    timeStart: string
    isBindDevice: boolean
    isRequiredReason: boolean
    isOverAttendance: boolean
    overAttCardDataId: number
  }
}

// API 錯誤類
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private proxyUrl = '/api/proxy'

  /**
   * 統一的 API 請求方法
   */
  async request<T>(path: ApiPath, options: RequestOptions = {}): Promise<T> {
    const { body, headers = {}, ...fetchOptions } = options

    // 構建請求標頭
    const requestHeaders: HeadersInit & { Cookie?: string; Authorization?: string } = {
      'Content-Type': 'application/json',
      ...headers
    }

    // 構建請求配置
    const requestConfig: RequestInit = {
      ...fetchOptions,
      headers: requestHeaders,
      cache: 'no-store',
      credentials: 'include'
    }

    // 處理請求體
    if (body) {
      requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    const url = `${this.proxyUrl}?path=${encodeURIComponent(path)}`

    try {
      const response = await fetch(url, requestConfig)

      if (!response.ok) {
        throw new ApiError(response.status, `請求失敗: ${path} - ${response.statusText}`)
      }

      if (response.status === 204 || response.statusText === 'No Content') {
        return undefined as T
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(500, `未知錯誤: ${path} - ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }

  // 認證 API
  auth = {
    // 使用 refresh token 獲取新的 access token
    userToken: (body: UserTokenBody): Promise<UserTokenResponse> =>
      this.request<UserTokenResponse>(API_PATHS.userToken, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${process.env.NEXT_PUBLIC_BASIC_AUTH_TOKEN}`
        },
        body
      }),

    // 使用 access_token 獲取 cookie
    userTokenCookies: (access: string): Promise<void> =>
      this.request(API_PATHS.userTokenCookies, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access}`
        }
      }),

    loginToken: (body: LoginTokenBody): Promise<LoginTokenResponse> =>
      this.request<LoginTokenResponse>(API_PATHS.loginToken, {
        method: 'POST',
        body: {
          acc: body.acc,
          pwd: body.pwd,
          uno: process.env.NEXT_PUBLIC_UNO,
          token: process.env.NEXT_PUBLIC_JWT_TOKEN
        }
      }),

    loginRefresh: (body: LoginRefreshBody): Promise<LoginRefreshResponse> =>
      this.request<LoginRefreshResponse>(API_PATHS.loginRefresh, {
        method: 'POST',
        body
      }),

    employeeBasicInfo: (accessToken: string, pid: string): Promise<EmployeeInfoResponse> =>
      this.request<EmployeeInfoResponse>(API_PATHS.employeeBasicInfo, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: {
          pid
        }
      }),

    getCardSetting: (accessToken: string, body: CardSettingBody): Promise<CardSettingResponse> =>
      this.request<CardSettingResponse>(API_PATHS.cardSetting, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body
      }),

    getMonthDetail: (accessToken: string, body: MonthDetailBody): Promise<MonthDetailResponse> =>
      this.request<MonthDetailResponse>(API_PATHS.monthDetail, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body
      }),

    cardGps: (accessToken: string, body: CardGpsBody): Promise<CardGpsResponse> =>
      this.request<CardGpsResponse>(API_PATHS.cardGps, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body
      })
  }
}

export const apiClient = new ApiClient()
