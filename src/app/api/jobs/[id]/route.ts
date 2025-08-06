import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const job = await prisma.job.findFirst({
      where: {
        id: parseInt(id),
        isActive: true,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            websiteUrl: true,
            careerPageUrl: true,
            description: true,
            sector: true,
            country: true,
            headquarters: true,
            employeeCount: true,
            founded: true,
            techStack: true,
            benefits: true,
            culture: true,
            locations: true,
          }
        }
      },
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get related jobs from the same company
    const relatedJobs = await prisma.job.findMany({
      where: {
        companyId: job.companyId,
        isActive: true,
        id: { not: job.id },
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
        remote: true,
      },
      orderBy: {
        postedDate: 'desc',
      },
      take: 5,
    })

    // Get similar jobs from other companies in the same category
    const similarJobs = await prisma.job.findMany({
      where: {
        category: job.category,
        companyId: { not: job.companyId },
        isActive: true,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { postedDate: 'desc' },
      ],
      take: 5,
    })

    // Format job data
    const formattedJob = {
      id: job.id,
      title: job.title,
      company: {
        id: job.company.id,
        name: job.company.name,
        slug: job.company.slug,
        logo: job.company.logoUrl,
        website: job.company.websiteUrl,
        careerPage: job.company.careerPageUrl,
        description: job.company.description,
        sector: job.company.sector,
        country: job.company.country,
        headquarters: job.company.headquarters,
        employeeCount: job.company.employeeCount,
        founded: job.company.founded,
        techStack: job.company.techStack,
        benefits: job.company.benefits,
        culture: job.company.culture,
        locations: job.company.locations,
      },
      location: job.location,
      category: job.category,
      employmentType: job.employmentType,
      workArrangement: job.workArrangement,
      experienceLevel: job.experienceLevel,
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
      responsibilities: job.responsibilities,
      benefits: job.benefits,
      skillsRequired: job.skillsRequired,
      featured: job.featured,
      urgent: job.urgent,
      remote: job.remote,
      originalUrl: job.originalUrl,
      applicationUrl: job.applicationUrl,
      applicationInstructions: job.applicationInstructions,
      relatedJobs: relatedJobs.map((relJob: any) => ({
        id: relJob.id,
        title: relJob.title,
        location: relJob.location,
        category: relJob.category,
        employmentType: relJob.employmentType,
        salary: relJob.salaryMin && relJob.salaryMax 
          ? `${relJob.salaryCurrency}${relJob.salaryMin.toLocaleString()} - ${relJob.salaryCurrency}${relJob.salaryMax.toLocaleString()}`
          : null,
        postedDate: relJob.postedDate,
        featured: relJob.featured,
        urgent: relJob.urgent,
        remote: relJob.remote,
      })),
      similarJobs: similarJobs.map((simJob: any) => ({
        id: simJob.id,
        title: simJob.title,
        company: {
          id: simJob.company.id,
          name: simJob.company.name,
          slug: simJob.company.slug,
          logo: simJob.company.logoUrl,
        },
        location: simJob.location,
        category: simJob.category,
        employmentType: simJob.employmentType,
        salary: simJob.salaryMin && simJob.salaryMax 
          ? `${simJob.salaryCurrency}${simJob.salaryMin.toLocaleString()} - ${simJob.salaryCurrency}${simJob.salaryMax.toLocaleString()}`
          : null,
        postedDate: simJob.postedDate,
        featured: simJob.featured,
        urgent: simJob.urgent,
        remote: simJob.remote,
      })),
    }

    // Track view for analytics
    await prisma.userActivity.create({
      data: {
        action: 'VIEW_JOB',
        entityType: 'JOB',
        entityId: job.id.toString(),
        metadata: {
          jobTitle: job.title,
          company: job.company.name,
          category: job.category,
          location: job.location,
        },
      },
    })

    return NextResponse.json(formattedJob)
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
