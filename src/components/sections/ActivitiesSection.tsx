// components/sections/ActivitiesSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Snowflake, Gamepad2, Sparkles, UtensilsCrossed } from 'lucide-react';

export const ActivitiesSection = () => (
  <section className="py-20 bg-white relative overflow-hidden">
    {/* Background decorations */}
    <div className="absolute top-0 left-0 w-full h-full">
      <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full opacity-20"></div>
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-gradient-to-br from-blue-200 to-green-200 rounded-full opacity-20"></div>
    </div>
    
    <div className="container mx-auto px-4 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-black mb-6 text-gray-800">
          Entertainment & Fun
        </h2>
        <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
          Amazing activities for kids, adults, and gamers - something for everyone!
        </p>
        <div className="w-32 h-2 bg-gradient-to-r from-pink-400 to-purple-400 mx-auto rounded-full mt-6"></div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Ice Skating */}
        <Card className="group hover:shadow-2xl transition-all transform hover:scale-105 border-4 border-blue-200 overflow-hidden">
          <div className="relative h-48 overflow-hidden">
            <img 
              src="/ice-skating.png" 
              alt="Ice Skating Experience" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-600/80 to-transparent"></div>
            <Snowflake className="absolute top-4 right-4 h-12 w-12 text-white group-hover:rotate-180 transition-transform duration-500" />
          </div>
          <CardHeader className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white">
            <CardTitle className="text-2xl font-bold text-center">Ice Skating</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 text-gray-700">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span>Professional ice rink</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span>Free skate rental</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span>All skill levels welcome</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* VR Games */}
        <Card className="group hover:shadow-2xl transition-all transform hover:scale-105 border-4 border-purple-200 overflow-hidden">
          <div className="relative h-48 overflow-hidden">
            <img 
              src="/vr-games.png" 
              alt="VR Gaming Experience" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-600/80 to-transparent"></div>
            <Gamepad2 className="absolute top-4 right-4 h-12 w-12 text-white group-hover:scale-110 transition-transform" />
          </div>
          <CardHeader className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
            <CardTitle className="text-2xl font-bold text-center">VR Games</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 text-gray-700">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                <span>Latest VR technology</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                <span>Interactive gaming</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                <span>Suitable for all ages</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Magic Shows */}
        <Card className="group hover:shadow-2xl transition-all transform hover:scale-105 border-4 border-pink-200 overflow-hidden">
          <div className="relative h-48 overflow-hidden">
            <img 
              src="/magic-shows.png" 
              alt="Magic Show Performance" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-pink-600/80 to-transparent"></div>
            <Sparkles className="absolute top-4 right-4 h-12 w-12 text-white group-hover:rotate-12 transition-transform" />
          </div>
          <CardHeader className="bg-gradient-to-br from-pink-400 to-red-400 text-white">
            <CardTitle className="text-2xl font-bold text-center">Magic Shows</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 text-gray-700">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
                <span>Professional magicians</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
                <span>Shows every 2 hours</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
                <span>Interactive performances</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Food & Drinks */}
        <Card className="group hover:shadow-2xl transition-all transform hover:scale-105 border-4 border-orange-200 overflow-hidden">
          <div className="relative h-48 overflow-hidden">
            <img 
              src="/foods.png" 
              alt="Food and Drinks Area" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-orange-600/80 to-transparent"></div>
            <UtensilsCrossed className="absolute top-4 right-4 h-12 w-12 text-white group-hover:scale-110 transition-transform" />
          </div>
          <CardHeader className="bg-gradient-to-br from-orange-400 to-yellow-400 text-white">
            <CardTitle className="text-2xl font-bold text-center">Food & Drinks</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 text-gray-700">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                <span>Gourmet food trucks</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                <span>Fresh beverages</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                <span>VIP dining area</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);