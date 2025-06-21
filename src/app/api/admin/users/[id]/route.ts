
// src/app/api/admin/users/[id]/route.ts - Individual admin user management
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// Update admin user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const { email, password, firstName, lastName, role } = await request.json()

    // Check if user exists
    const existingUser = await prisma.adminUser.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'Admin user not found' },
        { status: 404 }
      )
    }

    // Check if email is taken by another user
    if (email && email !== existingUser.email) {
      const emailCheck = await prisma.adminUser.findUnique({
        where: { email }
      })

      if (emailCheck) {
        return NextResponse.json(
          { success: false, message: 'Email already in use by another user' },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      email: email?.toLowerCase().trim(),
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      role: role || existingUser.role
    }

    // Hash new password if provided
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), 12)
    }

    // Update user
    const updatedUser = await prisma.adminUser.update({
      where: { id: userId },
      data: updateData,
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
      message: 'Admin user updated successfully',
      data: updatedUser
    })

  } catch (error: any) {
    console.error('Error updating admin user:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update admin user' },
      { status: 500 }
    )
  }
}

// Delete admin user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    // Check if user exists
    const existingUser = await prisma.adminUser.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'Admin user not found' },
        { status: 404 }
      )
    }

    // Check if this is the last super admin
    if (existingUser.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.adminUser.count({
        where: { 
          role: 'SUPER_ADMIN',
          isActive: true
        }
      })

      if (superAdminCount <= 1) {
        return NextResponse.json(
          { success: false, message: 'Cannot delete the last super admin' },
          { status: 400 }
        )
      }
    }

    // Delete user
    await prisma.adminUser.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting admin user:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete admin user' },
      { status: 500 }
    )
  }
}