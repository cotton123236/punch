import type { NextConfig } from 'next'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public'
})

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true
  }
}

export default withPWA(nextConfig)
