interface LoginResult {
  success: boolean
  message?: string
  user?: {
    id: string
    email: string
    role: string
    firstName?: string
    lastName?: string
  }
}

export class AuthService {
  private static instance: AuthService
  private currentUser: any = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (result.success) {
        this.currentUser = result.user
        // Store user in localStorage for client-side persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_user', JSON.stringify(result.user))
        }
      }

      return result
    } catch (error) {
      return {
        success: false,
        message: 'Network error occurred'
      }
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }

    this.currentUser = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_user')
    }
  }

  isAuthenticated(): boolean {
    if (this.currentUser) return true

    // Check localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_user')
      if (stored) {
        this.currentUser = JSON.parse(stored)
        return true
      }
    }

    return false
  }

  getCurrentUser() {
    return this.currentUser
  }
}
