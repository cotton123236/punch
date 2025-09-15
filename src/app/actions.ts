'use server'

import webpush, { type PushSubscription } from 'web-push'
import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

interface SubscribeUserProps {
  sub: PushSubscription
  startTime: string
  endTime: string
}

// VAPID
webpush.setVapidDetails(
  'https://punch-one.vercel.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Google Sheets 設定
const spreadsheetId = process.env.GOOGLE_SHEET_ID!
const sheetName = 'subscriptions'

const auth = new JWT({
  scopes: [process.env.PUNCH_SCOPE!],
  email: process.env.PUNCH_CLIENT_MAIL!,
  key: process.env.PUNCH_PRIVATE_KEY!
})

const sheets = google.sheets({ version: 'v4', auth })

// === Server Actions ===

export async function subscribeUser(data: SubscribeUserProps): Promise<{ success: boolean; message?: string }> {
  try {
    // First, get all existing subscriptions to check for duplicates
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:G`
    })

    const rows = getRes.data.values || []
    const endpointToFind = data.sub.endpoint
    const existingRowIndex = rows.findIndex((row) => row.length > 0 && row[0] === endpointToFind)

    // Prepare the new row data
    const newRow = [
      data.sub.endpoint,
      data.sub.expirationTime || '',
      data.startTime,
      data.endTime,
      data.sub.keys?.auth || '',
      data.sub.keys?.p256dh || '',
      new Date().toISOString() // Use new date for both update and create
    ]

    if (existingRowIndex !== -1) {
      // --- UPDATE EXISTING ROW ---
      // The row was found, so we update it.
      // Sheet rows are 1-based, and findIndex is 0-based.
      const targetRow = existingRowIndex + 1

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${targetRow}:G${targetRow}`, // Specify the exact row range to update
        valueInputOption: 'RAW',
        requestBody: { values: [newRow] }
      })

      return { success: true, message: 'Subscription updated' }
    } else {
      // --- APPEND NEW ROW ---
      // The endpoint was not found, so we append a new row.
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:G`,
        valueInputOption: 'RAW',
        requestBody: { values: [newRow] }
      })

      return { success: true, message: 'Subscription created' }
    }
  } catch (err) {
    console.error('Error in subscribeUser (upsert logic):', err)
    return { success: false, message: 'Failed to save or update subscription' }
  }
}

export async function unsubscribeUser(endpoint: string) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: `${sheetName}!A:G`
    })

    const rows = res.data.values || []
    const rowIndex = rows.findIndex((row) => row[0] === endpoint)

    if (rowIndex === -1) {
      return { success: false, error: 'Subscription not found' }
    }

    // Google Sheets rowIndex 是從 0 開始，但 API 的 deleteDimension 要從 1 算起（含表頭）
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }
        ]
      }
    })

    return { success: true }
  } catch (err) {
    console.error('Error unsubscribing:', err)
    return { success: false, error: 'Failed to unsubscribe' }
  }
}

export async function sendNotification(subscription: PushSubscription, data?: { title: string; body: string }) {
  if (!subscription) {
    throw new Error('No subscription available')
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: data?.title || 'Punch Notification',
        body: data?.body || "It's time to punch in or out."
      })
    )
    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}

export async function sendScheduledNotifications() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: `${sheetName}!A:G`
    })

    const rows = res.data.values || []
    if (rows.length <= 1) {
      return { success: true, message: 'No subscriptions found' }
    }

    const notifications: Array<Promise<unknown>> = []
    // 建立一個 UTC+8 時區的當前時間
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    // 從第 2 行開始 (因為第 1 行是表頭)
    for (let i = 1; i < rows.length; i++) {
      const [endpoint, expirationTime, startTime, endTime, keys_auth, keys_p256dh] = rows[i]

      const [startHour, startMinute] = startTime.split(':').map(Number)
      const userStartMinutes = startHour * 60 + startMinute

      const [endHour, endMinute] = endTime.split(':').map(Number)
      const userEndMinutes = endHour * 60 + endMinute

      const hitStartTime = currentMinutes >= userStartMinutes - 5 && currentMinutes < userStartMinutes + 5
      const hitEndTime = currentMinutes >= userEndMinutes - 5 && currentMinutes < userEndMinutes + 5

      if (hitStartTime || hitEndTime) {
        const sub = {
          endpoint,
          expirationTime: expirationTime || null,
          keys: { auth: keys_auth, p256dh: keys_p256dh }
        }

        const message = hitStartTime ? '該打卡上班了！' : '別忘了打卡下班！'

        notifications.push(
          webpush
            .sendNotification(
              sub,
              JSON.stringify({
                title: '打卡提醒',
                body: message
              })
            )
            .catch(async (err) => {
              console.error(`Failed for ${endpoint}`, err)
              if (err.statusCode === 410 || err.statusCode === 404) {
                await unsubscribeUser(endpoint)
              }
            })
        )
      }
    }

    if (notifications.length > 0) {
      const results = await Promise.allSettled(notifications)
      console.log('Sent scheduled notifications:', results)
      return { success: true, results }
    }

    return { success: true, message: 'No notifications to send at this time.' }
  } catch (err) {
    console.error('Error sending scheduled notification:', err)
    // 重新拋出錯誤，讓 API Route 捕捉
    throw new Error('Failed to send scheduled notification')
  }
}
