// src/lib/server-auth.ts - Enhanced with your environment
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { AdminRole } from '@prisma/client'

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
  firstName: string | null // Changed from string? to string | null
  lastName: string | null  // Changed from string? to string | null
  isActive: boolean
}

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret-key'

export class ServerAuthService {
  static verifyToken(token: string): AdminUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      return decoded.user
    } catch (error) {
      console.error('Token verification error:', error)
      return null
    }
  }

  static generateToken(user: AdminUser): string {
    return jwt.sign({ user }, JWT_SECRET, { expiresIn: '24h' })
  }

  static getCurrentUser(request: NextRequest): AdminUser | null {
    try {
      // Try Authorization header first
      const authHeader = request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        return this.verifyToken(token)
      }

      // Try cookies
      const cookieStore = cookies()
      const token = cookieStore.get('admin_token')?.value
      if (token) {
        return this.verifyToken(token)
      }

      return null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  static hasRole(user: AdminUser | null, requiredRole: AdminRole): boolean {
    if (!user || !user.isActive) return false

    const roleHierarchy = {
      'SUPER_ADMIN': 4,
      'ADMIN': 3,
      'SALES_MANAGER': 2,
      'BOOTH_STAFF': 1
    }

    const userLevel = roleHierarchy[user.role] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    return userLevel >= requiredLevel
  }

  static async authenticate(email: string, password: string): Promise<AdminUser | null> {
    try {
      const user = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          password: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true
        }
      })

      if (!user || !user.isActive) {
        return null
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive
      }
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  }

  static async createAdminUser(data: {
    email: string
    password: string
    role: AdminRole
    firstName?: string // This is fine as input can be undefined
    lastName?: string  // This is fine as input can be undefined
  }): Promise<AdminUser> {
    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await prisma.adminUser.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName || null, // Ensure to store as null if undefined
        lastName: data.lastName || null,   // Ensure to store as null if undefined
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    })

    return user
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await prisma.adminUser.findUnique({
        where: { id: userId },
        select: { password: true }
      })

      if (!user) return false

      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) return false

      const hashedPassword = await bcrypt.hash(newPassword, 12)

      await prisma.adminUser.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })

      return true
    } catch (error) {
      console.error('Password change error:', error)
      return false
    }
  }
}