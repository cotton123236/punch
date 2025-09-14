import type { EmployeeInfoResponse, AddressList, MonthDetailDataItem } from '@/lib/api/client'

export const mockEmployeeInfo: EmployeeInfoResponse = {
  empSelfPhoto: 'https://randomuser.me/api/portraits/men/75.jpg',
  empBid: 12345,
  positionName: 'Visitor',
  hireDate: new Date().getTime(),
  depId: 101,
  depName: '',
  empNo: 'A00',
  isBoss: false,
  empId: 0,
  name: 'Visitor',
  pid: 999
}

export const mockAddressList: (AddressList & { id: 'company' | 'home' | 'off'; name: string })[] = [
  {
    id: 'company',
    name: '公司',
    latitude: 0,
    longitude: 0,
    clockInLimitDistance: 0,
    address: ''
  },
  {
    id: 'home',
    name: '住家',
    latitude: 0,
    longitude: 0,
    clockInLimitDistance: 0,
    address: ''
  },
  {
    id: 'off',
    name: '關閉',
    latitude: 0,
    longitude: 0,
    clockInLimitDistance: 0,
    address: ''
  }
]

export const mockMonthDetail: MonthDetailDataItem[] = (() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthDetail: MonthDetailDataItem[] = []

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    const weekDay = date.getDay()
    const isWeekend = weekDay === 0 || weekDay === 6
    const isPast = date < today
    const isToday = date.toDateString() === today.toDateString()

    let timeStart = ''
    let timeEnd = ''

    if (!isWeekend) {
      if (isPast) {
        timeStart = '09:30'
        timeEnd = '18:30'
      } else if (isToday) {
        timeStart = '09:30'
      }
    }

    monthDetail.push({
      date: date.getTime(),
      dateString: `${year}/${String(month + 1).padStart(2, '0')}/${String(i).padStart(2, '0')}`,
      weekDay: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][weekDay],
      workTypeString: isWeekend ? '休息日' : '工作日',
      timeStart,
      timeEnd,
      festivalName: '',
      workType: isWeekend ? 2 : 1,
      isWorkDay: !isWeekend,
      temperature: 0,
      handleStatus: 0,
      overAttCardDataId: 0,
      cardOverAttendanceReasonModels: [],
      overAttendanceStatus: 0,
      temperatureSetting: 0,
      handleStatusString: '',
      punchCardTime: null,
      compareStatusString: '',
      compareStatus: 0,
      overAttRequiredReason: false,
      cardRestInterval: [],
      overAttEnable: false,
      lunarDateString: ''
    })
  }

  return monthDetail
})()
