// src/components/sections/Hero.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const heroSlides = [
  {
    id: 1,
    image: '/hero/1.jpg',
    title: 'Full-Body VR with Friends',
    subtitle: 'SANDBOX VR',
    description: 'The Experience Everyone\'s Raving About',
    subDescription: 'Come see why we\'re rated 5 stars by 150,000+ guests worldwide.',
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Slides */}
      <div className="absolute inset-0">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            {/* Dark overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Subtitle */}
          <div className="mb-4">
            <span className="text-white/80 text-sm font-medium tracking-widest uppercase">
              {heroSlides[currentSlide].subtitle}
            </span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
            {heroSlides[currentSlide].title}
          </h1>
          
          {/* Description */}
          <h2 className="text-xl md:text-2xl lg:text-3xl text-white/90 font-light mb-4">
            {heroSlides[currentSlide].description}
          </h2>
          
          {/* Sub Description */}
          <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            {heroSlides[currentSlide].subDescription}
          </p>

          {/* CTA Button */}
          <Link
            href="/book"
            className="inline-block bg-[#01AEED] hover:bg-[#01AEED]/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            {heroSlides[currentSlide].buttonText}
          </Link>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 ${
              index === currentSlide 
                ? 'w-8 h-2 bg-white rounded-full' 
                : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  )
}