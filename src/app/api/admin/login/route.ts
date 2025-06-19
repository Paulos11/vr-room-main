
// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AdminLoginSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = AdminLoginSchema.parse(body)
    
    // Find admin user
    const admin = await prisma.adminUser.findUnique({
      where: { email: validatedData.email }
    })
    
    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, admin.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // In a real app, you would generate and return a JWT token here
    // For simplicity, we'll just return success with user data
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        firstName: admin.firstName,
        lastName: admin.lastName
      }
    })
    
  } catch (error) {
    console.error('Admin login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Invalid data provided',
          errors: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}