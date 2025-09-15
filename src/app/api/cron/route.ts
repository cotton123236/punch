import { NextResponse } from 'next/server'
import { sendScheduledNotifications } from '@/app/actions'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')

  // Security Check: Verify the secret token from the environment variables.
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const result = await sendScheduledNotifications()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to execute cron job' }, { status: 500 })
  }
}
