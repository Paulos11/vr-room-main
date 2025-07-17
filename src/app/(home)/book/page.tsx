// src/app/book/page.tsx - VR booking page with integrated payment flow
import { VRRegistrationForm } from '@/components/forms/VRRegistrationForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book VR Experience | VR Room Malta',
  description: 'Book your virtual reality experience at VR Room Malta. Choose from premium VR adventures, get instant confirmation, and enjoy cutting-edge VR technology.',
  keywords: 'VR booking, virtual reality Malta, VR experiences, VR Room Malta, book VR session',
  openGraph: {
    title: 'Book Your VR Adventure | VR Room Malta',
    description: 'Experience the future of entertainment with premium VR experiences at 50m From Bugibba Square, Malta.',
    type: 'website',
    locale: 'en_US',
  }
}

// Force this page to be server-side rendered for better SEO
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function BookVRPage() {
  return (
    <div className="min-h-screen">
      {/* 
        The VRRegistrationForm now includes:
        1. VR Experience Selection
        2. Personal Information 
        3. Terms & Conditions
        4. Integrated Payment Step
        
        No need for separate payment page redirects!
      */}
      <VRRegistrationForm />
    </div>
  )
}