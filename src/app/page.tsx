// src/app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock, Snowflake, Gamepad2, Sparkles, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white">
              VIP Experience
            </Badge>
            <h1 className="text-5xl font-bold mb-6">
              EMS Trade Fair
              <span className="block text-3xl font-normal mt-2">VIP Experience 2025</span>
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join us for an exclusive VIP experience at Malta's premier trade fair. 
              Discover cutting-edge EMS panels and enjoy premium entertainment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Register Now
                </Button>
              </Link>
              <Link href="/panels">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Explore Panels
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-white/5 rounded-full"></div>
        </div>
      </section>

      {/* Event Info Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center">
              <CardHeader>
                <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Venue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">Malta Fairs & Conventions Centre</p>
                <p className="text-gray-600">Ta' Qali, Malta</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Operating Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">9:00 AM - 6:00 PM</p>
                <p className="text-gray-600">Daily</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Premium Experiences</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Enjoy exclusive activities designed for our VIP guests while exploring the latest in EMS technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-shadow">
              <CardHeader>
                <Snowflake className="h-16 w-16 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-xl">Ice Rink Experience</CardTitle>
                <CardDescription>
                  Cool off and have fun at our exclusive ice rink facility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Professional-grade ice rink</li>
                  <li>• Skate rental included</li>
                  <li>• Professional instruction available</li>
                  <li>• Family-friendly environment</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-xl transition-shadow">
              <CardHeader>
                <Gamepad2 className="h-16 w-16 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-xl">VR Experiences</CardTitle>
                <CardDescription>
                  Immerse yourself in cutting-edge virtual reality technology
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Latest VR headsets and equipment</li>
                  <li>• Interactive gaming experiences</li>
                  <li>• Educational VR demonstrations</li>
                  <li>• Suitable for all ages</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-xl transition-shadow">
              <CardHeader>
                <Sparkles className="h-16 w-16 text-yellow-500 mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-xl">Magic Shows</CardTitle>
                <CardDescription>
                  Be amazed by professional magical performances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Professional magicians</li>
                  <li>• Interactive performances</li>
                  <li>• Shows every 2 hours</li>
                  <li>• Perfect for networking breaks</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* EMS Panels Section */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Discover EMS Panels</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our revolutionary EMS panel technology at the trade fair
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Zap className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Advanced Technology</h3>
                    <p className="text-gray-600">
                      State-of-the-art EMS panels featuring the latest innovations in electrical management systems.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Zap className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Energy Efficient</h3>
                    <p className="text-gray-600">
                      Designed for maximum energy efficiency and cost savings for your business operations.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Zap className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Professional Installation</h3>
                    <p className="text-gray-600">
                      Complete installation and support services provided by our certified professionals.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Link href="/panels">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Learn More About Panels
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white p-8 rounded-lg shadow-xl">
                <h4 className="text-2xl font-bold mb-4">Interested in Our Panels?</h4>
                <p className="text-gray-600 mb-6">
                  Register your interest and our experts will contact you during the trade fair 
                  to discuss your specific requirements.
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Consultation</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custom Quotes</span>
                    <span className="font-semibold text-green-600">Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span>On-site Demos</span>
                    <span className="font-semibold text-green-600">Included</span>
                  </div>
                </div>
                <Link href="/register">
                  <Button className="w-full mt-6">
                    Register Interest
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Join Us?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Don't miss this exclusive opportunity to experience the best of EMS technology 
            and enjoy premium entertainment at Malta's premier trade fair.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Register for VIP Access
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">EMS Trade Fair</h3>
              <p className="text-gray-400">
                Experience the future of electrical management systems at Malta's premier trade fair.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Event Information</h4>
              <div className="space-y-2 text-gray-400">
                <p>July 26 - August 6, 2025</p>
                <p>Malta Fairs & Conventions Centre</p>
                <p>Ta' Qali, Malta</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/register" className="block text-gray-400 hover:text-white">
                  Register
                </Link>
                <Link href="/panels" className="block text-gray-400 hover:text-white">
                  EMS Panels
                </Link>
                <Link href="/admin" className="block text-gray-400 hover:text-white">
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 EMS Trade Fair. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}