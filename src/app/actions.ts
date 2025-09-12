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

export async function subscribeUser(data: SubscribeUserProps) {
  try {
    const createdAt = new Date().toISOString()
    const row = [
      data.sub.endpoint,
      data.sub.expirationTime || '',
      data.startTime,
      data.endTime,
      data.sub.keys?.auth || '',
      data.sub.keys?.p256dh || '',
      createdAt
    ]

    console.log(row)

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:G`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] }
    })

    return { success: true }
  } catch (err) {
    console.error('Error saving subscription:', err)
    return { success: false, error: 'Failed to save subscription' }
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

export async function sendNotificationToAll(message: string) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: `${sheetName}!A:G`
    })

    const rows = res.data.values || []
    if (rows.length <= 1) {
      return { success: false, error: 'No subscriptions found' }
    }

    const notifications: Array<Promise<unknown>> = []

    // 從第 2 行開始 (因為第 1 行是表頭)
    for (let i = 1; i < rows.length; i++) {
      const [endpoint, expirationTime, startTime, endTime, keys_auth, keys_p256dh] = rows[i]

      const sub = {
        endpoint,
        expirationTime: expirationTime || null,
        keys: {
          auth: keys_auth,
          p256dh: keys_p256dh
        }
      }

      notifications.push(
        webpush
          .sendNotification(
            sub,
            JSON.stringify({
              title: 'Punch Notification',
              body: message || "It's time to punch in or out.",
              icon: '/images/appicon-192x192.png'
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

    await Promise.allSettled(notifications)
    return { success: true }
  } catch (err) {
    console.error('Error sending notification:', err)
    return { success: false, error: 'Failed to send notification' }
  }
}

export async function sendNotification(subscription: PushSubscription, message?: string) {
  if (!subscription) {
    throw new Error('No subscription available')
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: 'Punch Notification',
        body: message || "It's time to punch in or out.",
        icon: '/images/appicon-192x192.png'
      })
    )
    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}
