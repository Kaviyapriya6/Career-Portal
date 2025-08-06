import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const sector = searchParams.get('sector') || ''
    const country = searchParams.get('country') || ''
    const featured = searchParams.get('featured') === 'true'
    const trending = searchParams.get('trending') === 'true'
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (sector) {
      where.sector = sector
    }

    if (country) {
      where.country = country
    }

    if (featured) {
      where.featured = true
    }

    if (trending) {
      where.trending = true
    }

    // Build order by clause
    const orderBy: any = {}
    if (sortBy === 'jobs') {
      orderBy.jobs = { _count: sortOrder }
    } else {
      orderBy[sortBy] = sortOrder
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
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
        orderBy,
      }),
      prisma.company.count({ where }),
    ])

    // Format companies for frontend
    const formattedCompanies = companies.map((company: any) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      logo: company.logoUrl,
      website: company.websiteUrl,
      careerPage: company.careerPageUrl,
      description: company.description,
      sector: company.sector,
      country: company.country,
      headquarters: company.headquarters,
      employeeCount: company.employeeCount,
      foundedYear: company.foundedYear,
      featured: company.featured,
      trending: company.trending,
      jobCount: company._count.jobs,
      techStack: company.techStack,
      benefits: company.benefits,
      culture: company.culture,
      locations: company.locations,
    }))

    // Get aggregated data for filters
    const [sectors, countries] = await Promise.all([
      prisma.company.groupBy({
        by: ['sector'],
        where: { isActive: true },
        _count: { sector: true },
        orderBy: { _count: { sector: 'desc' } },
      }),
      prisma.company.groupBy({
        by: ['country'],
        where: { isActive: true },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
      }),
    ])

    return NextResponse.json({
      companies: formattedCompanies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        search,
        sector,
        country,
        featured,
        trending,
      },
      aggregations: {
        sectors: sectors.map((s: any) => ({ name: s.sector, count: s._count.sector })),
        countries: countries.map((c: any) => ({ name: c.country, count: c._count.country })),
      }
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
