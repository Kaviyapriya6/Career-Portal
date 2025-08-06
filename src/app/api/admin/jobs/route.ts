import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const companyId = searchParams.get('companyId') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (companyId) {
      where.companyId = companyId
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            }
          },
          _count: {
            select: {
              applications: true,
              views: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ])

    return NextResponse.json({
      jobs: jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        salaryRange: job.salaryRange,
        isActive: job.isActive,
        createdAt: job.createdAt,
        company: job.company,
        applicationsCount: job._count.applications,
        viewsCount: job._count.views,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { jobId, isActive, featuredUntil } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(featuredUntil && { featuredUntil: new Date(featuredUntil) }),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        }
      }
    })

    // Track admin action
    await prisma.userActivity.create({
      data: {
        userId: session.user.id,
        action: 'admin_job_update',
        entityType: 'job',
        entityId: jobId,
        metadata: {
          jobTitle: updatedJob.title,
          companyName: updatedJob.companyName,
          changes: {
            ...(typeof isActive === 'boolean' && { isActive }),
            ...(featuredUntil && { featuredUntil }),
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Job updated successfully',
      job: updatedJob,
    })
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { title: true, companyName: true }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    await prisma.job.delete({
      where: { id: jobId },
    })

    // Track admin action
    await prisma.userActivity.create({
      data: {
        userId: session.user.id,
        action: 'admin_job_delete',
        entityType: 'job',
        entityId: jobId,
        metadata: {
          deletedJobTitle: job.title,
          deletedJobCompany: job.companyName,
        }
      }
    })

    return NextResponse.json({
      message: 'Job deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
