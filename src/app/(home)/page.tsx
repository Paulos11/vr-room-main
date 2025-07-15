// src/app/page.tsx
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/sections/Hero'
import VideoSection from '@/components/sections/VideoSection'
import VRGamesSection from '@/components/sections/VRGamesSection'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <VRGamesSection />
      <VideoSection />
  
    </main>
  )
}