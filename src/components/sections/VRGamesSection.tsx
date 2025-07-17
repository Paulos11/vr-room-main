'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const vrGames = [
  {
    id: 1,
    title: 'City Hurricane',
    image: '/vr-bike/city-hurricane.jpg',
    category: 'Racing'
  },
  {
    id: 2,
    title: 'V-Racer Hoverbike',
    image: '/vr-bike/v-racer-hoverbike.jpg',
    category: 'Racing'
  },
  {
    id: 3,
    title: 'Knight on the Water',
    image: '/vr-bike/knight-on-the-water.jpg',
    category: 'Racing'
  },
  {
    id: 4,
    title: 'Desert Racing',
    image: '/vr-bike/desert-racing.jpg',
    category: 'Racing'
  },
  {
    id: 5,
    title: 'Fantasy Runner',
    image: '/vr-bike/fantasy-runner.jpg',
    category: 'Racing'
  },
  {
    id: 6,
    title: 'Overspeed Racing',
    image: '/vr-bike/overspeed-racing.jpg',
    category: 'Racing'
  },
  {
    id: 7,
    title: 'LaTale',
    image: '/vr-games/latale.jpg',
    category: 'Adventure'
  },
  {
    id: 8,
    title: 'Ocean Guardians',
    image: '/vr-games/ocean-guardians.jpg',
    category: 'Adventure'
  },
  {
    id: 9,
    title: 'VR Carnie',
    image: '/vr-games/vr-carnie.jpg',
    category: 'Family'
  },
  {
    id: 10,
    title: 'Christmas Town',
    image: '/vr-games/christmas-town.jpg',
    category: 'Family'
  },
  {
    id: 11,
    title: 'Dinosaur Island',
    image: '/vr-games/dinosaur-island.jpg',
    category: 'Adventure'
  },
  {
    id: 12,
    title: 'Haunted House',
    image: '/vr-games/haunted-house.jpg',
    category: 'Horror'
  }
]

export default function VRGamesSection() {
  const [currentPage, setCurrentPage] = useState(0)
  const [cardsPerPage, setCardsPerPage] = useState(4)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchEndX, setTouchEndX] = useState(0)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate responsive cards per page
  useEffect(() => {
    const updateCardsPerPage = () => {
      if (window.innerWidth < 640) {
        setCardsPerPage(1)
      } else if (window.innerWidth < 1024) {
        setCardsPerPage(2)
      } else {
        setCardsPerPage(4)
      }
    }

    updateCardsPerPage()
    window.addEventListener('resize', updateCardsPerPage)
    return () => window.removeEventListener('resize', updateCardsPerPage)
  }, [])

  // Reset to first page when cards per page changes
  useEffect(() => {
    setCurrentPage(0)
  }, [cardsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(vrGames.length / cardsPerPage)

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = currentPage * cardsPerPage
    const endIndex = startIndex + cardsPerPage
    return vrGames.slice(startIndex, endIndex)
  }

  // Navigation functions
  const goToNextPage = () => {
    setCurrentPage(prev => (prev + 1) % totalPages)
  }

  const goToPrevPage = () => {
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages)
  }

  const goToPage = (pageIndex: number) => {
    setCurrentPage(pageIndex)
  }

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || totalPages <= 1) return

    autoPlayRef.current = setInterval(() => {
      goToNextPage()
    }, 4000)

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlaying, totalPages, currentPage])

  // Pause auto-play on user interaction
  const pauseAutoPlay = () => {
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 8000) // Resume after 8 seconds
  }

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return
    
    const distance = touchStartX - touchEndX
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      goToNextPage()
      pauseAutoPlay()
    } else if (isRightSwipe) {
      goToPrevPage()
      pauseAutoPlay()
    }

    setTouchStartX(0)
    setTouchEndX(0)
  }

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 tracking-wide">
            DISCOVER OUR WORLDS
          </h2>
          <p className="text-white/60 text-sm sm:text-base">
            Immerse yourself in cutting-edge VR experiences
          </p>
        </div>

        {/* Games Grid Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Games Grid */}
          <div className={`
            grid gap-4 transition-all duration-500 ease-in-out
            ${cardsPerPage === 1 ? 'grid-cols-1' : ''}
            ${cardsPerPage === 2 ? 'grid-cols-2' : ''}
            ${cardsPerPage === 4 ? 'grid-cols-4' : ''}
          `}>
            {getCurrentPageItems().map((game, index) => (
              <div key={`${currentPage}-${game.id}`} className="group">
                <Link
                  href={`/experiences/${game.id}`}
                  className="block relative overflow-hidden rounded-lg bg-gray-800 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#01AEED] focus:ring-offset-2 focus:ring-offset-gray-900"
                  onClick={pauseAutoPlay}
                >
                  {/* Game Image */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-gray-700">
                    <Image
                      src={game.image}
                      alt={game.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      quality={75}
                      loading="lazy"
                    />
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                      <span className="text-white text-xs font-medium">
                        {game.category}
                      </span>
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>

                  {/* Game Title */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <h3 className="text-white font-medium text-sm sm:text-base leading-tight">
                      {game.title}
                    </h3>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-[#01AEED]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </div>
            ))}
          </div>

          {/* Navigation Arrows - Desktop */}
          {totalPages > 1 && (
            <>
              <button
                onClick={() => {
                  goToPrevPage()
                  pauseAutoPlay()
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#01AEED] hidden lg:block"
                aria-label="Previous games"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => {
                  goToNextPage()
                  pauseAutoPlay()
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#01AEED] hidden lg:block"
                aria-label="Next games"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Navigation Arrows */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-6 lg:hidden">
            <button
              onClick={() => {
                goToPrevPage()
                pauseAutoPlay()
              }}
              className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#01AEED]"
              aria-label="Previous games"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => {
                goToNextPage()
                pauseAutoPlay()
              }}
              className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#01AEED]"
              aria-label="Next games"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Page Indicators (Hidden on mobile) */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 sm:mt-8 gap-2 sm:block hidden">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  goToPage(index)
                  pauseAutoPlay()
                }}
                className={`transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#01AEED] focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  currentPage === index
                    ? 'w-6 sm:w-8 h-2 bg-[#01AEED] rounded-full'
                    : 'w-2 h-2 bg-white/30 rounded-full hover:bg-white/50'
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Swipe Instructions for Mobile */}
        <div className="text-center mt-4 sm:hidden">
          <p className="text-white/40 text-xs">
            Swipe left or right to browse games
          </p>
        </div>

        {/* View All Games Button */}
        <div className="text-center mt-8 sm:mt-12">
          <Link
            href="/experiences"
            className="inline-block bg-transparent border-2 border-[#01AEED] text-[#01AEED] hover:bg-[#01AEED] hover:text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#01AEED] focus:ring-offset-2 focus:ring-offset-gray-900 text-sm sm:text-base active:scale-95"
          >
            View All Games
          </Link>
        </div>
      </div>
    </section>
  )
}
