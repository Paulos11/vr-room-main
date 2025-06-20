// pages/index.tsx or app/page.tsx
'use client';
import React from 'react';
import { HeroSection } from '@/components/sections/HeroSection';
import { EventInfoSection } from '@/components/sections/EventInfoSection';
import { ActivitiesSection } from '@/components/sections/ActivitiesSection';
import { SolarPanelSection } from '@/components/sections/SolarPanelSection';
import { CTASection } from '@/components/sections/CTASection';
import { FooterSection } from '@/components/sections/FooterSection';
import { BeautifulLoader } from '@/components/ui/BeautifulLoader';
import { useLoading } from '@/hooks/useLoading';

export default function EMSLandingPage() {
  const { isLoading } = useLoading(1000); // 1.5 second fast loader

  if (isLoading) {
    return <BeautifulLoader />;
  }

  return (
    <div className="min-h-screen">
      <HeroSection />
      <EventInfoSection />
      <ActivitiesSection />
      <SolarPanelSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}