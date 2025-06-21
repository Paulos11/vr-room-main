
// src/app/api/admin/users/route.ts - Admin users management
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// Get all admin users
export async function GET() {
  try {
    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
        // Don't return password hash
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        users,
        total: users.length
      }
    })

  } catch (error: any) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch admin users' },
      { status: 500 }
    )
  }
}

// Create new admin user
export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, role } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.adminUser.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await prisma.adminUser.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        role: role || 'ADMIN',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: newUser
    })

  } catch (error: any) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create admin user' },
      { status: 500 }
    )
  }
}
