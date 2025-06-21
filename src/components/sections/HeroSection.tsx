// components/sections/HeroSection.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Ticket, Phone, Globe } from 'lucide-react';

export const HeroSection = () => (
  <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-green-400 via-blue-400 to-purple-500">
    {/* Background Image */}
    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90" 
         style={{ backgroundImage: 'url(/hero.jpg)' }}>
    </div>
    
    {/* Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-green-400/80 via-blue-400/80 to-purple-500/80"></div>
    
    {/* Animated Background Elements */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full animate-bounce"></div>
      <div className="absolute top-20 right-20 w-24 h-24 bg-yellow-300/30 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-pink-300/20 rounded-full animate-bounce delay-1000"></div>
      <div className="absolute bottom-32 right-32 w-28 h-28 bg-green-300/25 rounded-full animate-pulse delay-500"></div>
      
      {/* Large Central Balloon */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/15 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen text-center">
      <Badge className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold text-lg px-6 py-2 animate-pulse">
        <Crown className="w-5 h-5 mr-2" />
        LIMITED VIP TICKETS
      </Badge>
      
      <h1 className="text-6xl md:text-8xl font-black mb-6 text-white drop-shadow-2xl">
        <span className="block text-green-300">EMS</span>
        <span className="text-4xl md:text-5xl font-bold">AT MFCC!</span>
      </h1>
      
      <div className="text-2xl md:text-3xl font-bold mb-8 text-white bg-gradient-to-r from-green-600 to-blue-600 px-6 py-3 rounded-full">
        26th July - 6th August
      </div>
      
      <p className="text-xl md:text-2xl mb-8 max-w-3xl text-white/90 font-medium">
        Join Us for a Fun-Filled Weekend Packed with Innovation, Entertainment & Exclusive Solar Panel Offers!
      </p>
      
      {/* Special Offer Alert */}
      <div className="mb-8 bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-sm text-white p-4 rounded-2xl border-2 border-white/30 shadow-2xl max-w-2xl">
        <div className="flex items-center justify-center mb-2">
          <Crown className="w-6 h-6 mr-2 text-yellow-300" />
          <span className="font-black text-xl">SPECIAL OFFER</span>
        </div>
        <p className="text-lg font-bold">
          <span className="text-yellow-300">FREE VIP TICKETS</span> for all EMS customers!
        </p>
        <p className="text-sm opacity-90 mt-1">
          Existing customers get exclusive VIP access at no cost
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
        <Link href="/register">
          <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-xl px-8 py-4 rounded-full hover:scale-105 transform transition-all shadow-2xl">
            <Ticket className="w-6 h-6 mr-2" />
            Get VIP Tickets
          </Button>
        </Link>
        <a href="tel:+35627555597">
          <Button size="lg" variant="outline" className="border-4 border-white text-white font-bold text-xl px-8 py-4 rounded-full hover:bg-white hover:text-blue-600 transition-all">
            <Phone className="w-6 h-6 mr-2" />
            Call +356 2755 5597
          </Button>
        </a>
      </div>
      
      <div className="text-white/80 text-lg">
        <Globe className="w-5 h-5 inline mr-2" />
        www.tickets.ems.com.mt
      </div>
    </div>
  </section>
);