// src/components/sections/VRGamesSection.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const vrGames = [
  // VR Bike Racing Games
  {
    id: 1,
    title: 'City Hurricane',
    image: '/vr-bike/city-hurricane.jpg',
  },
  {
    id: 2,
    title: 'V-Racer Hoverbike',
    image: '/vr-bike/v-racer-hoverbike.jpg',
  },
  {
    id: 3,
    title: 'Knight on the Water',
    image: '/vr-bike/knight-on-the-water.jpg',
  },
  {
    id: 4,
    title: 'Desert Racing',
    image: '/vr-bike/desert-racing.jpg',
  },
  {
    id: 5,
    title: 'Fantasy Runner',
    image: '/vr-bike/fantasy-runner.jpg',
  },
  {
    id: 6,
    title: 'Overspeed Racing',
    image: '/vr-bike/overspeed-racing.jpg',
  },
  // VR Adventure & Family Games
  {
    id: 7,
    title: 'LaTale',
    image: '/vr-games/latale.jpg',
  },
  {
    id: 8,
    title: 'Ocean Guardians',
    image: '/vr-games/ocean-guardians.jpg',
  },
  {
    id: 9,
    title: 'VR Carnie',
    image: '/vr-games/vr-carnie.jpg',
  },
  {
    id: 10,
    title: 'Christmas Town',
    image: '/vr-games/christmas-town.jpg',
  },
  {
    id: 11,
    title: 'Dinosaur Island',
    image: '/vr-games/dinosaur-island.jpg',
  },
  {
    id: 12,
    title: 'Haunted House',
    image: '/vr-games/haunted-house.jpg',
  }
]

export default function VRGamesSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [itemsPerView, setItemsPerView] = useState(4)

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(2) // Mobile: 2 cards
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2) // Tablet: 2 cards
      } else {
        setItemsPerView(4) // Desktop: 4 cards
      }
    }

    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])

  const maxIndex = Math.max(0, vrGames.length - itemsPerView)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }, [maxIndex])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }, [maxIndex])

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const timer = setInterval(() => {
      nextSlide()
    }, 4000)

    return () => clearInterval(timer)
  }, [isAutoPlaying, nextSlide])

  // Reset index when itemsPerView changes
  useEffect(() => {
    setCurrentIndex(0)
  }, [itemsPerView])

  const totalSlides = Math.ceil(vrGames.length / itemsPerView)
  const currentSlide = Math.floor(currentIndex / itemsPerView)

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-wide">
            DISCOVER OUR WORLDS
          </h2>
        </div>

        {/* Games Slider Container */}
        <div className="relative overflow-hidden">
          <div 
            className="relative"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Slider Track */}
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ 
                transform: `translateX(-${(currentIndex * 100) / itemsPerView}%)`,
                width: `${(vrGames.length * 100) / itemsPerView}%`
              }}
            >
              {vrGames.map((game) => (
                <div
                  key={game.id}
                  className="px-2 sm:px-3"
                  style={{ width: `${100 / vrGames.length}%` }}
                >
                  <Link
                    href={`/experiences/${game.id}`}
                    className="group relative block overflow-hidden rounded-lg bg-gray-800 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#01AEED] focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    {/* Game Image */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={game.image}
                        alt={game.title}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Game Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <h3 className="text-white font-medium text-xs sm:text-sm leading-tight">
                        {game.title}
                      </h3>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-[#01AEED]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </div>
              ))}
            </div>

            {/* Navigation Arrows - Hidden on small mobile */}
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#01AEED] hidden sm:block"
              aria-label="Previous games"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#01AEED] hidden sm:block"
              aria-label="Next games"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Arrows */}
        <div className="flex justify-center gap-4 mt-4 sm:hidden">
          <button
            onClick={prevSlide}
            className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#01AEED]"
            aria-label="Previous games"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={nextSlide}
            className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#01AEED]"
            aria-label="Next games"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center mt-6 sm:mt-8 gap-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * itemsPerView)}
              className={`transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#01AEED] focus:ring-offset-2 focus:ring-offset-gray-900 ${
                currentSlide === index
                  ? 'w-6 sm:w-8 h-2 bg-[#01AEED] rounded-full' 
                  : 'w-2 h-2 bg-white/30 rounded-full hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Touch/Swipe Instructions for Mobile */}
        <div className="text-center mt-4 sm:hidden">
          <p className="text-white/60 text-xs">
            Swipe left or right to browse games
          </p>
        </div>

        {/* View All Games Button */}
        <div className="text-center mt-8 sm:mt-12">
          <Link
            href="/experiences"
            className="inline-block bg-transparent border-2 border-[#01AEED] text-[#01AEED] hover:bg-[#01AEED] hover:text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#01AEED] focus:ring-offset-2 focus:ring-offset-gray-900 text-sm sm:text-base"
          >
            View All Games
          </Link>
        </div>
      </div>
    </section>
  )
}