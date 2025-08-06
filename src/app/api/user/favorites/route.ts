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

    const favorites = await prisma.favoriteCompany.findMany({
      where: { userId: session.user.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
            location: true,
            description: true,
            _count: {
              select: {
                jobs: {
                  where: {
                    isActive: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    })

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error fetching favorite companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check if already favorited
    const existingFavorite = await prisma.favoriteCompany.findUnique({
      where: {
        userId_companyId: {
          userId: session.user.id,
          companyId,
        },
      },
    })

    if (existingFavorite) {
      return NextResponse.json({ error: 'Company already in favorites' }, { status: 409 })
    }

    // Add to favorites
    const favorite = await prisma.favoriteCompany.create({
      data: {
        userId: session.user.id,
        companyId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
            location: true,
            description: true,
          }
        }
      }
    })

    // Track analytics
    await prisma.userActivity.create({
      data: {
        userId: session.user.id,
        action: 'favorite_company',
        entityType: 'company',
        entityId: companyId,
        metadata: {
          companyName: company.name,
        }
      }
    })

    return NextResponse.json({ 
      message: 'Company added to favorites',
      favorite 
    })
  } catch (error) {
    console.error('Error adding favorite company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Check if favorite exists
    const favorite = await prisma.favoriteCompany.findUnique({
      where: {
        userId_companyId: {
          userId: session.user.id,
          companyId,
        },
      },
      include: {
        company: true,
      }
    })

    if (!favorite) {
      return NextResponse.json({ error: 'Company not in favorites' }, { status: 404 })
    }

    // Remove from favorites
    await prisma.favoriteCompany.delete({
      where: {
        userId_companyId: {
          userId: session.user.id,
          companyId,
        },
      },
    })

    // Track analytics
    await prisma.userActivity.create({
      data: {
        userId: session.user.id,
        action: 'unfavorite_company',
        entityType: 'company',
        entityId: companyId,
        metadata: {
          companyName: favorite.company.name,
        }
      }
    })

    return NextResponse.json({ 
      message: 'Company removed from favorites' 
    })
  } catch (error) {
    console.error('Error removing favorite company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
