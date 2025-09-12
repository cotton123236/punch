import { NextResponse } from 'next/server'

// In the next step, we will import and call the actual action.
// import { sendScheduledNotifications } from '@/app/actions'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')

  // Security Check: Verify the secret token from the environment variables.
  // The request from GitHub Actions must include this header.
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // If the token is missing or incorrect, return an "Unauthorized" response.
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // TODO: In the next step, we will call the real function to send notifications.
    // For now, we just return a success message confirming the route is working.
    console.log('Cron job triggered successfully.')

    return NextResponse.json({
      success: true,
      message: 'Cron job endpoint reached and authorized.'
    })
  } catch (error) {
    console.error('Cron job failed:', error)
    // If any error occurs during the process, return a 500 server error.
    return NextResponse.json(
      { success: false, error: 'Failed to execute cron job' },
      { status: 500 }
    )
  }
}
