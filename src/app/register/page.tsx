// src/app/register/page.tsx
import { EnhancedRegistrationForm } from '@/components/forms/EnhancedRegistrationForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top decorative circles */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full opacity-60"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-40"></div>
        
        {/* Bottom decorative circles */}
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full opacity-50"></div>
        <div className="absolute bottom-32 right-32 w-28 h-28 bg-gradient-to-br from-purple-100 to-green-100 rounded-full opacity-45"></div>
        
        {/* Large central subtle background */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-50 to-blue-50 rounded-full opacity-30 blur-3xl"></div>
        
        {/* Brand accent lines */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 opacity-60"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4 hover:bg-green-50 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <EnhancedRegistrationForm />
      </div>
    </div>
  )
}