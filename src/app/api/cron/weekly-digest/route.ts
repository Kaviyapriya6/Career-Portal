import { NextRequest, NextResponse } from 'next/server'
import { sendWeeklyDigest } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron service or has proper authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await sendWeeklyDigest()
    
    return NextResponse.json({ message: 'Weekly digest emails sent successfully' })
  } catch (error) {
    console.error('Error sending weekly digest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
