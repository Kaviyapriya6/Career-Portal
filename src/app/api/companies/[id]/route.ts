import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Find company by ID or slug
    const company = await prisma.company.findFirst({
      where: {
        OR: [
          { id: parseInt(id) || -1 },
          { slug: id }
        ],
        isActive: true,
      },
      include: {
        jobs: {
          where: {
            isActive: true,
          },
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
            featured: true,
            urgent: true,
          },
          orderBy: {
            postedDate: 'desc',
          },
          take: 50, // Latest 50 jobs
        },
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
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Format company data
    const formattedCompany = {
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
      techStack: company.techStack,
      benefits: company.benefits,
      culture: company.culture,
      locations: company.locations,
      totalJobs: company._count.jobs,
      jobs: company.jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        location: job.location,
        category: job.category,
        employmentType: job.employmentType,
        salary: job.salaryMin && job.salaryMax 
          ? `${job.salaryCurrency}${job.salaryMin.toLocaleString()} - ${job.salaryCurrency}${job.salaryMax.toLocaleString()}`
          : null,
        postedDate: job.postedDate,
        featured: job.featured,
        urgent: job.urgent,
      })),
      lastUpdated: company.lastScrapedAt,
    }

    return NextResponse.json(formattedCompany)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
