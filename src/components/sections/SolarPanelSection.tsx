// components/sections/SolarPanelSection.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Users, Gift, Phone, Globe, CheckCircle, Battery, Sun } from 'lucide-react';

export const SolarPanelSection = () => (
  <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-200/20 rounded-full"></div>
      <div className="absolute bottom-20 right-20 w-56 h-56 bg-green-200/20 rounded-full"></div>
    </div>
    
    <div className="container mx-auto px-4 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
          <span className="text-orange-500">Exclusive</span>{" "}
          <span className="text-green-600">Solar Panel</span>{" "}
          <span className="text-blue-600">Offers!</span>
        </h2>
        <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto font-medium mb-8">
          Join Us for a Fun-Filled Weekend Packed with Innovation
        </p>
        <div className="w-32 h-2 bg-gradient-to-r from-orange-400 via-green-400 to-blue-400 mx-auto rounded-full"></div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
        {/* Solar Panel & Battery Image */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            <img 
              src="/panels.png" 
              alt="HJT ECH 950W Solar Panel System with EcoFlow Battery" 
              className="w-full h-auto object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-gray-800 mb-2">HJT ECH</h3>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 mb-2">
                      950W
                    </div>
                    <p className="text-sm text-gray-600 font-medium mb-2">
                      Solar Panels
                    </p>
                    <p className="text-sm font-bold text-blue-600">
                      + EcoFlow 10kWh solar battery + hybrid inverter
                    </p>
                  </div>
                  
                  {/* Partner Logos */}
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <img 
                      src="/sun.png" 
                      alt="SmartSun" 
                      className="h-20 w-auto object-contain"
                      loading="lazy"
                    />
                    <img 
                      src="/ecoflow.png" 
                      alt="EcoFlow" 
                      className="h-20 w-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features & Benefits */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
              <Sun className="h-8 w-8 text-orange-500 mr-3" />
              Full System + Battery
            </h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>950W high-performance solar panels (up to 33 units/day)</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>Solar battery included for day & night use</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>Professional installation by EMS experts</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="font-bold text-green-600">Save on your bills from Day 1</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-green-500 p-6 rounded-2xl text-white">
            <h4 className="text-xl font-bold mb-4 flex items-center">
              <Gift className="h-6 w-6 mr-2" />
              Exclusive MFCC Trade Fair Benefits
            </h4>
            <p className="mb-4 text-blue-100">
              Offer available exclusively for visitors to the MFCC Trade Fair in Ta' Qali. 
              Our team will be there to help you:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Check your grant eligibility</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Walk you through how to apply</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Unlock exclusive discounts and free gifts for fair visitors who purchase</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-400/20 rounded-lg">
              <p className="text-sm font-bold text-yellow-100">
                ⚠️ Stock is limited and grant funding is on a first-come basis — don't miss out!
              </p>
            </div>
          </div>
        </div>
      </div>
      

    </div>
  </section>
);