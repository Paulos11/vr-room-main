// src/lib/auth.ts (Fixed version)
'use client'

export interface AdminUser {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

export class AuthService {
  private static instance: AuthService
  private currentUser: AdminUser | null = null

  private constructor() {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      this.loadFromStorage()
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('admin_user')
      if (stored) {
        this.currentUser = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading user from storage:', error)
      localStorage.removeItem('admin_user')
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(email: string, password: string): Promise<{ success: boolean; message?: string; user?: AdminUser }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo purposes, use hardcoded credentials
      if (email === 'admin@ems-events.com' && password === 'admin123') {
        const user: AdminUser = {
          id: '1',
          email: 'admin@ems-events.com',
          role: 'SUPER_ADMIN',
          firstName: 'Admin',
          lastName: 'User'
        }
        
        this.currentUser = user
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_user', JSON.stringify(user))
        }
        
        return { success: true, user }
      } else {
        return { success: false, message: 'Invalid email or password' }
      }
    } catch (error) {
      return { success: false, message: 'Login failed. Please try again.' }
    }
  }

  logout(): void {
    this.currentUser = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_user')
    }
  }

  getCurrentUser(): AdminUser | null {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }
}
