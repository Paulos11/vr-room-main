// components/sections/EventInfoSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock } from 'lucide-react';

export const EventInfoSection = () => (
  <section className="py-16 bg-gradient-to-r from-blue-50 to-green-50">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-black mb-4 text-gray-800">Event Details</h2>
        <div className="w-24 h-2 bg-gradient-to-r from-green-400 to-blue-400 mx-auto rounded-full"></div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="text-center hover:shadow-2xl transition-all transform hover:scale-105 border-4 border-green-200">
          <CardHeader>
            <MapPin className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">Venue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-gray-800">Malta Fairs & Conventions Centre</p>
            <p className="text-gray-600 text-lg">Ta' Qali, Malta</p>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:shadow-2xl transition-all transform hover:scale-105 border-4 border-blue-200">
          <CardHeader>
            <Calendar className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-gray-800">July 26 - August 6</p>
            <p className="text-gray-600 text-lg">2025</p>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:shadow-2xl transition-all transform hover:scale-105 border-4 border-purple-200">
          <CardHeader>
            <Clock className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-gray-800">9:00 AM - 6:00 PM</p>
            <p className="text-gray-600 text-lg">Daily</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);