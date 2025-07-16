// src/app/book/page.tsx - Full-width VR booking page
import { VRRegistrationForm } from '@/components/forms/VRRegistrationForm'
import Navbar from '@/components/layout/Navbar'

export default function BookVRPage() {
  return (
    <div className="min-h-screen">
      <VRRegistrationForm />
    </div>
  )
}