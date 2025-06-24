// components/sections/FooterSection.tsx
import React from 'react';
import { Calendar, MapPin, Clock, Ticket, Zap, Camera, Phone, Globe } from 'lucide-react';

export const FooterSection = () => (
  <footer className="bg-gray-900 text-white py-16">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-2xl font-bold mb-4 text-green-400">About EMS</h3>
          <p className="text-gray-400 text-lg">
EMS delivers innovative energy solutions to reduce consumption in Malta and Gozo's commercial and industrial sectors.
          </p>
        </div>
        
        <div>
          <h4 className="text-xl font-semibold mb-4">Event Info</h4>
          <div className="space-y-2 text-gray-400">
            <p><Calendar className="w-4 h-4 inline mr-2" />June 26 - July 6, 2025</p>
            <p><MapPin className="w-4 h-4 inline mr-2" />MFCC, Ta' Qali, Malta</p>
            <p><Clock className="w-4 h-4 inline mr-2" />6:30 PM Onwards</p>
          </div>
        </div>
        
        <div>
          <h4 className="text-xl font-semibold mb-4">Quick Links</h4>
          <div className="space-y-2">
            <a href="#" className="block text-gray-400 hover:text-white transition-colors">
              <Ticket className="w-4 h-4 inline mr-2" />Get VIP Tickets
            </a>
            <a href="#" className="block text-gray-400 hover:text-white transition-colors">
              <Zap className="w-4 h-4 inline mr-2" />Solar Panel Offers
            </a>
            <a href="#" className="block text-gray-400 hover:text-white transition-colors">
              <Camera className="w-4 h-4 inline mr-2" />Gallery
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="text-xl font-semibold mb-4">Contact</h4>
          <div className="space-y-2 text-gray-400">
            <p><Phone className="w-4 h-4 inline mr-2" />+356 2755 5597</p>
            <p><Globe className="w-4 h-4 inline mr-2" />www.ems.com.mt</p>
            <p><Ticket className="w-4 h-4 inline mr-2" />tickets.ems.com.mt</p>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-800 mt-12 pt-8 text-center">
        <p className="text-gray-400">&copy; 2025 EMS. All rights reserved.</p>
      </div>
    </div>
  </footer>
);