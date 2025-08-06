import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await prisma.emailPreferences.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error fetching email preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      newJobsFromFavorites,
      companyUpdates,
      weeklyJobSummary,
      jobApplicationStatus,
      marketInsights,
    } = body

    const preferences = await prisma.emailPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        newJobsFromFavorites: newJobsFromFavorites ?? true,
        companyUpdates: companyUpdates ?? true,
        weeklyJobSummary: weeklyJobSummary ?? true,
        jobApplicationStatus: jobApplicationStatus ?? true,
        marketInsights: marketInsights ?? false,
      },
      create: {
        userId: session.user.id,
        newJobsFromFavorites: newJobsFromFavorites ?? true,
        companyUpdates: companyUpdates ?? true,
        weeklyJobSummary: weeklyJobSummary ?? true,
        jobApplicationStatus: jobApplicationStatus ?? true,
        marketInsights: marketInsights ?? false,
      },
    })

    return NextResponse.json({ 
      message: 'Email preferences updated successfully',
      preferences 
    })
  } catch (error) {
    console.error('Error updating email preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
