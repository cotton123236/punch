export const API_PATHS = {
  userToken: '/user/api/token',
  userTokenCookies: '/user/api/token/cookies',
  loginToken: '/prohrm/api/login/token',
  loginRefresh: '/prohrm/api/login/refresh',

  employeeBasicInfo: '/prohrm/api/app/getEmployeeBasicInfo',

  monthDetail: '/hrm/psc/apis/public/getMonthCardAndCompareDetail.action',
  cardSetting: '/hrm/psc/apis/public/getCardSetting.action',

  cardGps: '/prohrm/api/app/card/gps'
} as const

export type ApiPath = (typeof API_PATHS)[keyof typeof API_PATHS]
