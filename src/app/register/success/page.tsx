
// src/app/register/success/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, ArrowLeft, Home } from 'lucide-react'

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
            <h1 className="text-3xl font-bold text-green-700">Registration Successful!</h1>
            <p className="text-lg text-gray-600">
              Thank you for registering for the EMS Trade Fair VIP Experience. 
            </p>
            
            <div className="bg-blue-50 p-6 rounded-lg text-left">
              <h2 className="font-semibold mb-3 text-blue-900">What happens next?</h2>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>We'll review your registration within 24 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>You'll receive an email confirmation once verified</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Your VIP ticket will be generated and sent to you</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Collect your ticket at our booth during the event</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3">Event Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Event:</strong> EMS Trade Fair VIP Experience</p>
                <p><strong>Dates:</strong> July 26 - August 6, 2025</p>
                <p><strong>Venue:</strong> Malta Fairs and Conventions Centre, Ta' Qali</p>
                <p><strong>Our Booth:</strong> EMS Booth - MFCC</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/panels">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Learn About Panels
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
