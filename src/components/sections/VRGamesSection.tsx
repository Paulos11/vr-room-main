// src/components/sections/VRGamesSection.tsx
'use client'

import { useState, useEffect } from 'react'
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
  const itemsPerView = 4

  useEffect(() => {
    if (!isAutoPlaying) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = vrGames.length - itemsPerView
        return prev >= maxIndex ? 0 : prev + 1
      })
    }, 4000)

    return () => clearInterval(timer)
  }, [isAutoPlaying])

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = vrGames.length - itemsPerView
      return prev >= maxIndex ? 0 : prev + 1
    })
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = vrGames.length - itemsPerView
      return prev <= 0 ? maxIndex : prev - 1
    })
  }

  const visibleGames = vrGames.slice(currentIndex, currentIndex + itemsPerView)

  return (
    <section className="py-16 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
            DISCOVER OUR WORLDS
          </h2>
        </div>

        {/* Games Slider */}
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleGames.map((game) => (
              <Link
                key={game.id}
                href={`/experiences/${game.id}`}
                className="group relative overflow-hidden rounded-lg bg-gray-800 transition-all duration-300 hover:scale-105"
              >
                {/* Game Image */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={game.image}
                    alt={game.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Game Title */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-medium text-sm leading-tight">
                    {game.title}
                  </h3>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-[#01AEED]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: Math.ceil(vrGames.length / itemsPerView) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * itemsPerView)}
              className={`transition-all duration-300 ${
                Math.floor(currentIndex / itemsPerView) === index
                  ? 'w-8 h-2 bg-[#01AEED] rounded-full' 
                  : 'w-2 h-2 bg-white/30 rounded-full hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* View All Games Button */}
        <div className="text-center mt-12">
          <Link
            href="/experiences"
            className="inline-block bg-transparent border-2 border-[#01AEED] text-[#01AEED] hover:bg-[#01AEED] hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
          >
            View All Games
          </Link>
        </div>
      </div>
    </section>
  )
}