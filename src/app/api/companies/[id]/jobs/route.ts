import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category') || ''
    const location = searchParams.get('location') || ''
    const employmentType = searchParams.get('employmentType') || ''
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'postedDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // First verify company exists
    const company = await prisma.company.findFirst({
      where: {
        OR: [
          { id: parseInt(id) || -1 },
          { slug: id }
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Build where clause for jobs
    const where: any = {
      companyId: company.id,
      isActive: true,
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requirements: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (employmentType) {
      where.employmentType = employmentType
    }

    // Build order by clause
    const orderBy: any = {}
    if (sortBy === 'salary') {
      orderBy.salaryMax = sortOrder
    } else {
      orderBy[sortBy] = sortOrder
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          location: true,
          category: true,
          employmentType: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          postedDate: true,
          expiryDate: true,
          description: true,
          requirements: true,
          benefits: true,
          featured: true,
          urgent: true,
          remote: true,
          originalUrl: true,
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
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
        id: job.company.id,
        name: job.company.name,
        slug: job.company.slug,
        logo: job.company.logoUrl,
      },
      location: job.location,
      category: job.category,
      employmentType: job.employmentType,
      salary: job.salaryMin && job.salaryMax 
        ? `${job.salaryCurrency}${job.salaryMin.toLocaleString()} - ${job.salaryCurrency}${job.salaryMax.toLocaleString()}`
        : null,
      salaryRange: {
        min: job.salaryMin,
        max: job.salaryMax,
        currency: job.salaryCurrency,
      },
      postedDate: job.postedDate,
      expiryDate: job.expiryDate,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      featured: job.featured,
      urgent: job.urgent,
      remote: job.remote,
      originalUrl: job.originalUrl,
    }))

    // Get filter options for this company's jobs
    const [categories, locations, employmentTypes] = await Promise.all([
      prisma.job.groupBy({
        by: ['category'],
        where: { companyId: company.id, isActive: true },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      }),
      prisma.job.groupBy({
        by: ['location'],
        where: { companyId: company.id, isActive: true },
        _count: { location: true },
        orderBy: { _count: { location: 'desc' } },
      }),
      prisma.job.groupBy({
        by: ['employmentType'],
        where: { companyId: company.id, isActive: true },
        _count: { employmentType: true },
        orderBy: { _count: { employmentType: 'desc' } },
      }),
    ])

    return NextResponse.json({
      jobs: formattedJobs,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        search,
        category,
        location,
        employmentType,
      },
      aggregations: {
        categories: categories.map((c: any) => ({ name: c.category, count: c._count.category })),
        locations: locations.map((l: any) => ({ name: l.location, count: l._count.location })),
        employmentTypes: employmentTypes.map((e: any) => ({ name: e.employmentType, count: e._count.employmentType })),
      }
    })
  } catch (error) {
    console.error('Error fetching company jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
