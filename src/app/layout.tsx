import './globals.css'
import type { Metadata, Viewport } from 'next'
// import Script from 'next/script'
import { Alice, Noto_Sans_TC, Afacad } from 'next/font/google'
import ContextProvider from '@/components/ContextProvider'

const alice = Alice({
  variable: '--font-alice',
  weight: ['400'],
  subsets: ['latin']
})

const afacad = Afacad({
  variable: '--font-afacad',
  weight: ['400'],
  subsets: ['latin']
})

const notoSansTC = Noto_Sans_TC({
  variable: '--font-noto-sans-tc',
  weight: ['400', '500'],
  subsets: ['latin']
})

export const metadata: Metadata = {
  applicationName: 'Punch',
  title: {
    default: 'Punch',
    template: 'Punch | %s'
  },
  description: 'Punch in / out Anytime, Anywhere',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Punch'
  },
  formatDetection: {
    telephone: false
  }
}

export const viewport: Viewport = {
  themeColor: [
    {
      media: '(prefers-color-scheme: dark)',
      color: '#181818'
    },
    {
      media: '(prefers-color-scheme: light)',
      color: 'f2f2f2'
    }
  ]
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <meta
          name="mobile-web-app-capable"
          content="yes"
        />
        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <script
          id="theme-script"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.className = theme;
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body
        className={`${alice.variable} ${notoSansTC.variable} ${afacad.variable} overflow-hidden antialiased`}
        suppressHydrationWarning
      >
        <ContextProvider>{children}</ContextProvider>
      </body>
    </html>
  )
}
