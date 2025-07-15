// src/app/contact/page.tsx
'use client'

import { useState } from 'react'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Form submitted:', formData)
    // Reset form
    setFormData({ name: '', email: '', phone: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      
      {/* Header */}
      <div className="pt-24 pb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Contact <span className="text-[#01AEED]">Us</span>
        </h1>
        <p className="text-gray-300 px-4">
          Get in touch with VR Room Malta
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left Side - Map and Contact Info */}
          <div className="space-y-6">
            
            {/* Map */}
            <div className="bg-gray-800/50 rounded-xl overflow-hidden">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d201.86515422589244!2d14.414296435023731!3d35.95082343697155!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2snp!4v1752585025473!5m2!1sen!2snp" 
                width="100%" 
                height="300" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>

            {/* Contact Info */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Get in Touch</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#01AEED] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Location</p>
                    <p className="text-gray-300 text-sm">
                      Bugibba, Malta<br />
                      St. Paul's Bay
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#01AEED] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Phone</p>
                    <p className="text-gray-300 text-sm">+356 1234 5678</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#01AEED] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Email</p>
                    <p className="text-gray-300 text-sm">info@vrroommalta.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[#01AEED] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Opening Hours</p>
                    <div className="text-gray-300 text-sm">
                      <p>Mon - Thu: 10:00 AM - 10:00 PM</p>
                      <p>Fri - Sat: 10:00 AM - 11:00 PM</p>
                      <p>Sunday: 11:00 AM - 9:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Send us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-white text-sm font-medium mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#01AEED] transition-colors"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#01AEED] transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-white text-sm font-medium mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#01AEED] transition-colors"
                  placeholder="+356 1234 5678"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-white text-sm font-medium mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#01AEED] transition-colors resize-none"
                  placeholder="Tell us about your VR experience needs, group size, or any questions you have..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#01AEED] hover:bg-[#01AEED]/90 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
              >
                Send Message
              </button>
            </form>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <div className="bg-[#01AEED]/10 border border-[#01AEED]/20 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-3">
              Ready to Book Your VR Experience?
            </h3>
            <p className="text-gray-300 mb-4">
              Skip the form and book directly online or call us now
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/book"
                className="inline-block bg-[#01AEED] hover:bg-[#01AEED]/90 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200"
              >
                Book Online
              </a>
              <a
                href="tel:+35612345678"
                className="inline-block bg-transparent border border-[#01AEED] text-[#01AEED] hover:bg-[#01AEED] hover:text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}