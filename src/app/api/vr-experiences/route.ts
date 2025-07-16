// src/app/api/vr-experiences/route.ts - Get available VR experiences
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching VR experiences...')

    // Get all active VR experiences (ticket types for VR)
    const experiences = await prisma.ticketType.findMany({
      where: {
        isActive: true,
        // Add VR-specific category or tag filtering if needed
        OR: [
          { category: 'VR_EXPERIENCE' },
          { tags: { contains: 'VR' } },
          { name: { contains: 'VR' } }
        ]
      },
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    // Transform data for VR experiences
    const vrExperiences = experiences.map(experience => ({
      id: experience.id,
      name: experience.name,
      description: experience.description,
      category: experience.category || 'Adventure',
      priceInCents: experience.priceInCents,
      currency: experience.currency,
      availableStock: experience.availableStock,
      isActive: experience.isActive,
      maxPerOrder: experience.maxPerOrder,
      minPerOrder: experience.minPerOrder,
      imageUrl: experience.imageUrl,
      featured: experience.featured,
      tags: experience.tags ? experience.tags.split(',').map(tag => tag.trim()) : [],
      
      // VR-specific fields (you can add these to your TicketType model)
      duration: 30, // Default 30 minutes - you can store this in the database
      maxPlayers: 1, // Default single player - you can store this in the database
      difficulty: 'Medium', // You can store this in tags or add a difficulty field
      ageRating: '8+', // You can store this in description or add an age field
      
      // Computed fields
      formattedPrice: `€${(experience.priceInCents / 100).toFixed(2)}`,
      isAvailable: experience.availableStock > 0,
      isFree: experience.priceInCents === 0
    }))

    console.log(`Found ${vrExperiences.length} VR experiences`)

    // Fix for Set iteration - convert to Array first
    const uniqueCategories = Array.from(new Set(vrExperiences.map(exp => exp.category)))
    const priceValues = vrExperiences.map(exp => exp.priceInCents)

    return NextResponse.json({
      success: true,
      data: {
        experiences: vrExperiences,
        total: vrExperiences.length,
        categories: uniqueCategories,
        priceRange: {
          min: priceValues.length > 0 ? Math.min(...priceValues) : 0,
          max: priceValues.length > 0 ? Math.max(...priceValues) : 0
        }
      }
    })

  } catch (error: any) {
    console.error('Error fetching VR experiences:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to load VR experiences',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

// POST endpoint to create new VR experience (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Add authentication check here
    // const isAdmin = await checkAdminAuth(request)
    // if (!isAdmin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const experience = await prisma.ticketType.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category || 'VR_EXPERIENCE',
        priceInCents: body.priceInCents,
        currency: body.currency || 'EUR',
        totalStock: body.totalStock,
        availableStock: body.totalStock,
        maxPerOrder: body.maxPerOrder || 10,
        minPerOrder: body.minPerOrder || 1,
        featured: body.featured || false,
        tags: body.tags ? body.tags.join(', ') : 'VR',
        createdBy: 'admin', // You can get this from auth
        sortOrder: body.sortOrder || 0
      }
    })

    return NextResponse.json({
      success: true,
      message: 'VR experience created successfully',
      data: experience
    })

  } catch (error: any) {
    console.error('Error creating VR experience:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create VR experience',
        error: error.message 
      },
      { status: 500 }
    )
  }
}