'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const heroSlides = [
  {
    id: 1,
    image: '/hero/1.jpg',
    title: 'VR with Friends',
    subtitle: 'VR ROOM MALTA',
    description: 'The Experience Everyone\'s Raving About',
    subDescription: 'Come see why we\'re rated 5 stars.',
    buttonText: 'Book an Experience'
  },
  {
    id: 2,
    image: '/hero/2.jpg',
    title: 'Immersive Virtual Reality',
    subtitle: 'VR ROOM MALTA',
    description: 'Step into Infinite Worlds',
    subDescription: 'Experience cutting-edge VR technology in the heart of Bugibba.',
    buttonText: 'Explore Games'
  },
  {
    id: 3,
    image: '/hero/3.jpg',
    title: 'Multiplayer Adventures',
    subtitle: 'VR ROOM MALTA',
    description: 'Team Up with Friends',
    subDescription: 'Battle dragons, solve puzzles, and create unforgettable memories together.',
    buttonText: 'Book Now'
  }
]

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadedImages, setLoadedImages] = useState<number[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Preload images
  useEffect(() => {
    const preloadImages = async () => {
      const promises = heroSlides.map((slide, index) => {
        return new Promise<void>((resolve) => {
          const img = new window.Image()
          img.onload = () => {
            setLoadedImages(prev => [...prev, index])
            resolve()
          }
          img.onerror = () => resolve() // Continue even if image fails
          img.src = slide.image
        })
      })
      
      await Promise.all(promises)
      setIsLoaded(true)
    }

    preloadImages()
  }, [])

  // Auto-slide functionality
  useEffect(() => {
    if (!isLoaded) return

    const startTimer = () => {
      timerRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
      }, 6000)
    }

    startTimer()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isLoaded])

  // Handle manual slide change
  const handleSlideChange = (index: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setCurrentSlide(index)
    
    // Restart timer after manual change
    setTimeout(() => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      timerRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
      }, 6000)
    }, 1000)
  }

  if (!isLoaded) {
    return (
      <section className="relative h-screen overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#01AEED] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Loading Experience...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Slides */}
      <div className="absolute inset-0">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {loadedImages.includes(index) && (
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
                quality={85}
              />
            )}
            {/* Dark overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Subtitle */}
          <div className="mb-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <span className="text-white/80 text-xs sm:text-sm font-medium tracking-widest uppercase">
              {heroSlides[currentSlide].subtitle}
            </span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight opacity-0 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            {heroSlides[currentSlide].title}
          </h1>
          
          {/* Description */}
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 font-light mb-3 sm:mb-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            {heroSlides[currentSlide].description}
          </h2>
          
          {/* Sub Description */}
          <p className="text-base sm:text-lg md:text-xl text-white/80 mb-8 sm:mb-12 max-w-2xl mx-auto opacity-0 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            {heroSlides[currentSlide].subDescription}
          </p>

          {/* CTA Button */}
          <div className="opacity-0 animate-fade-in" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
            <Link
              href="/book"
              className="inline-block bg-[#01AEED] hover:bg-[#01AEED]/90 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
            >
              {heroSlides[currentSlide].buttonText}
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Indicators (Hidden on mobile) */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-20 sm:block hidden">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleSlideChange(index)}
            className={`transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
              index === currentSlide
                ? 'w-8 h-2 bg-white rounded-full'
                : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

// Add these animations to your globals.css
/*
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}
*/
