// components/sections/CTASection.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Ticket, Phone } from 'lucide-react';

export const CTASection = () => (
  <section className="py-16 md:py-20 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 relative overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-400/10 to-pink-400/10"></div>
      <div className="absolute top-10 right-10 w-32 md:w-40 h-32 md:h-40 bg-white/10 rounded-full animate-bounce"></div>
      <div className="absolute bottom-10 left-10 w-24 md:w-32 h-24 md:h-32 bg-white/10 rounded-full animate-pulse"></div>
    </div>
    
    <div className="container mx-auto px-4 text-center relative z-10">
      <Badge className="mb-6 md:mb-8 bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold text-lg md:text-xl px-6 md:px-8 py-2 md:py-3">
        <Crown className="w-5 h-5 md:w-6 md:h-6 mr-2" />
        LIMITED TIME OFFER
      </Badge>
      
      <h2 className="text-4xl md:text-5xl lg:text-7xl font-black mb-6 md:mb-8 text-white drop-shadow-2xl">
        Get Your FREE
        <span className="block text-yellow-300">VIP Ticket Now!</span>
      </h2>
      
      <p className="text-lg md:text-xl lg:text-3xl mb-8 md:mb-12 text-white/90 max-w-4xl mx-auto font-medium">
        Don't miss this exclusive opportunity - Limited VIP tickets available!
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center">
        <Link href="/register">
          <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-lg md:text-2xl px-8 md:px-12 py-4 md:py-6 rounded-full hover:scale-110 transform transition-all shadow-2xl">
            <Ticket className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3" />
            Get Your Tickets
          </Button>
        </Link>
        <a href="tel:+35627555597">
          <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 font-black text-lg md:text-2xl px-8 md:px-12 py-4 md:py-6 rounded-full hover:scale-110 transform transition-all shadow-2xl">
            <Phone className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3" />
            Call for More Info
          </Button>
        </a>
      </div>
      
      <div className="mt-8 md:mt-12 text-white/80 text-sm md:text-lg">
        <p className="mb-1 md:mb-2">T&C Apply</p>
      </div>
    </div>
  </section>
);