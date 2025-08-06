import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Get dashboard statistics
    const [
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalCompanies,
      totalApplications,
      pendingEmails,
      failedEmails,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          }
        }
      }),
      prisma.job.count(),
      prisma.job.count({
        where: { isActive: true }
      }),
      prisma.company.count(),
      prisma.jobApplication.count(),
      prisma.emailQueue.count({
        where: { status: 'pending' }
      }),
      prisma.emailQueue.count({
        where: { status: 'failed' }
      }),
    ])

    // Get recent activity
    const recentActivity = await prisma.userActivity.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    })

    // Get user registration trend (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const userRegistrations = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        }
      },
      _count: {
        id: true,
      }
    })

    // Get job posting trend (last 7 days)
    const jobPostings = await prisma.job.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        }
      },
      _count: {
        id: true,
      }
    })

    // Top companies by job count
    const topCompanies = await prisma.company.findMany({
      take: 5,
      include: {
        _count: {
          select: {
            jobs: {
              where: {
                isActive: true,
              }
            }
          }
        }
      },
      orderBy: {
        jobs: {
          _count: 'desc'
        }
      }
    })

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        registrationTrend: userRegistrations,
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        postingTrend: jobPostings,
      },
      companies: {
        total: totalCompanies,
        top: topCompanies.map((company: any) => ({
          id: company.id,
          name: company.name,
          logo: company.logo,
          jobCount: company._count.jobs,
        })),
      },
      applications: {
        total: totalApplications,
      },
      emails: {
        pending: pendingEmails,
        failed: failedEmails,
      },
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity.id,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        metadata: activity.metadata,
        createdAt: activity.createdAt,
        user: activity.user,
      })),
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
