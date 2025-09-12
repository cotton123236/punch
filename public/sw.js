// // 監聽 push event
// self.addEventListener('push', (event) => {
//   const data = event.data?.json() || {}
//   const title = data.title || '🔔 Test Notification'
//   const options = {
//     body: data.body || 'This is a test push message.',
//     icon: '/images/appicon-192x192.png'
//   }

//   event.waitUntil(self.registration.showNotification(title, options))
// })

// // 監聽通知點擊
// self.addEventListener('notificationclick', (event) => {
//   event.notification.close()
//   event.waitUntil(self.clients.openWindow('/'))
// })

// self.addEventListener('install', () => {
//   console.log('SW installed')
//   self.skipWaiting()
// })

// self.addEventListener('activate', () => {
//   console.log('SW activated')
// })

// self.addEventListener('push', (event) => {
//   console.log('Push received:', event)
//   event.waitUntil(
//     self.registration.showNotification('📢 Push Test', {
//       body: 'This is a test notification from sw.js'
//     })
//   )
// })

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/images/appicon-192x192.png',
      // badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      }
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.')
  event.notification.close()
  event.waitUntil(clients.openWindow('https://punch-one.vercel.app'))
})
