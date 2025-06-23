// src/app/api/admin/register/route.ts - Registration API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { ServerAuthService } from '@/lib/server-auth'
import { AdminRole } from '@prisma/client'
import { z } from 'zod'

const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'BOOTH_STAFF'])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    // Check if current user has permission to create new admins
    const currentUser = ServerAuthService.getCurrentUser(request)
    
    if (!currentUser || !ServerAuthService.hasRole(currentUser, 'ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, firstName, lastName, role } = RegisterSchema.parse(body)

    // Create new admin user
    const newUser = await ServerAuthService.createAdminUser({
      email,
      password,
      role: role as AdminRole,
      firstName,
      lastName
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
