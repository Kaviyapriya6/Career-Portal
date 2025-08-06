import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const company = searchParams.get('company') || ''
    const category = searchParams.get('category') || ''
    const level = searchParams.get('level') || ''
    const employmentType = searchParams.get('employmentType') || ''
    const remote = searchParams.get('remote') === 'true'
    const featured = searchParams.get('featured') === 'true'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isActive: true,
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (company) {
      where.companyId = company
    }

    if (category) {
      where.category = category
    }

    if (level) {
      where.level = level
    }

    if (employmentType) {
      where.employmentType = employmentType
    }

    if (remote) {
      where.remote = true
    }

    if (featured) {
      where.featured = true
    }

    // Build order by clause
    const orderBy: any = {}
    if (sortBy === 'salary') {
      orderBy.salaryMax = sortOrder
    } else if (sortBy === 'company') {
      orderBy.companyName = sortOrder
    } else {
      orderBy[sortBy] = sortOrder
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
              slug: true,
            }
          }
        },
        orderBy,
      }),
      prisma.job.count({ where }),
    ])

    // Format jobs for frontend
    const formattedJobs = jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: {
        name: job.companyName,
        logo: job.company?.logo || null,
        slug: job.company?.slug || job.companyName.toLowerCase().replace(/\s+/g, '-'),
      },
      location: job.location,
      location_type: job.locationType,
      category: job.category,
      level: job.level,
      employment_type: job.employmentType,
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
      salary_currency: job.salaryCurrency,
      posted_date: job.postedDate,
      original_url: job.applicationUrl,
      description: job.description,
      skills: job.skills || [],
      is_remote: job.remote,
      is_urgent: job.urgent,
      is_featured: job.featured,
      created_at: job.createdAt,
    }))

    return NextResponse.json({
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        search,
        location,
        company,
        category,
        level,
        employmentType,
        remote,
        featured,
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
