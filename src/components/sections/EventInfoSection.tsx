// components/sections/EventInfoSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock } from 'lucide-react';

export const EventInfoSection = () => (
  <section className="py-8 bg-gradient-to-r from-blue-50 to-green-50">
    <div className="container mx-auto px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-black mb-2 text-gray-800">Event Details</h2>
        <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-blue-400 mx-auto rounded-full"></div>
      </div>
             
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center hover:shadow-lg transition-all transform hover:scale-105 border-2 border-green-200">
          <CardHeader className="pb-2">
            <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <CardTitle className="text-sm font-bold">Venue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-bold text-gray-800">Malta Fairs & Conventions Centre</p>
            <p className="text-gray-600 text-xs">Ta' Qali, Malta</p>
          </CardContent>
        </Card>
                 
        <Card className="text-center hover:shadow-lg transition-all transform hover:scale-105 border-2 border-blue-200">
          <CardHeader className="pb-2">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <CardTitle className="text-sm font-bold">Dates</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-bold text-gray-800">June 26 - July 6</p>
            <p className="text-gray-600 text-xs">2025</p>
          </CardContent>
        </Card>
                 
        <Card className="text-center hover:shadow-lg transition-all transform hover:scale-105 border-2 border-purple-200">
          <CardHeader className="pb-2">
            <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <CardTitle className="text-sm font-bold">Hours</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-bold text-gray-800">9:00 AM - 6:00 PM</p>
            <p className="text-gray-600 text-xs">Daily</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);