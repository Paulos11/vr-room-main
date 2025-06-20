// src/app/page.tsx - Optimized homepage to reduce bundle size
'use client'

import React, { lazy, Suspense } from 'react'
import { BeautifulLoader } from '@/components/ui/BeautifulLoader'
import { useLoading } from '@/hooks/useLoading'

// Lazy load heavy components to reduce initial bundle
const HeroSection = lazy(() => import('@/components/sections/HeroSection').then(m => ({ default: m.HeroSection })))
const EventInfoSection = lazy(() => import('@/components/sections/EventInfoSection').then(m => ({ default: m.EventInfoSection })))
const ActivitiesSection = lazy(() => import('@/components/sections/ActivitiesSection').then(m => ({ default: m.ActivitiesSection })))
const SolarPanelSection = lazy(() => import('@/components/sections/SolarPanelSection').then(m => ({ default: m.SolarPanelSection })))
const CTASection = lazy(() => import('@/components/sections/CTASection').then(m => ({ default: m.CTASection })))
const FooterSection = lazy(() => import('@/components/sections/FooterSection').then(m => ({ default: m.FooterSection })))

// Lightweight loading skeleton
function SectionSkeleton() {
  return (
    <div className="w-full h-64 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse rounded-lg mb-8"></div>
  )
}

export default function EMSLandingPage() {
  const { isLoading } = useLoading(800) // Reduced to 800ms for faster experience

  if (isLoading) {
    return <BeautifulLoader />
  }

  return (
    <div className="min-h-screen">
      <Suspense fallback={<SectionSkeleton />}>
        <HeroSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <EventInfoSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <ActivitiesSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <SolarPanelSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <CTASection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <FooterSection />
      </Suspense>
    </div>
  )
}