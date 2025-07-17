// src/components/sections/VideoSection.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

export default function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(true) // Start as playing
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Auto-play video when component mounts
  useEffect(() => {
    if (videoRef.current) {
      const playVideo = async () => {
        try {
          await videoRef.current?.play()
          setIsPlaying(true)
        } catch (error) {
          console.log('Auto-play prevented by browser, user interaction required')
          setIsPlaying(false)
        }
      }
      
      // Small delay to ensure video is loaded
      setTimeout(playVideo, 100)
    }
  }, [])

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVideoLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleVideoError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleVideoPlay = () => {
    setIsPlaying(true)
  }

  const handleVideoPause = () => {
    setIsPlaying(false)
  }

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Experience VR Room Malta
          </h2>
        </div>

        {/* Video Container */}
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800 shadow-2xl">
          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            poster="/video-poster.jpg"
            preload="auto"
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            playsInline
            muted
            loop
            autoPlay
            controls={false}
          >
            <source src="/vr-room-malta-experience.mp4" type="video/mp4" />
            <source src="/vr-room-malta-experience.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#01AEED] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-white text-sm">Loading video...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-red-500 text-2xl">⚠</span>
                </div>
                <p className="text-white text-sm mb-2">Video unavailable</p>
                <p className="text-white/60 text-xs">Please try refreshing the page</p>
              </div>
            </div>
          )}

          {/* Play/Pause Button */}
          {!isLoading && !hasError && (
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#01AEED] focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {/* Dark overlay for button visibility */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-200" />
              
              {/* Play/Pause Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`
                  bg-white/20 backdrop-blur-sm rounded-full p-4 sm:p-6 
                  transition-all duration-300 
                  ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}
                  hover:bg-white/30 hover:scale-110
                `}>
                  {isPlaying ? (
                    <Pause className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  ) : (
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" />
                  )}
                </div>
              </div>
            </button>
          )}

          {/* Video Controls Bar (Mobile) */}
          {!isLoading && !hasError && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 sm:hidden">
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePlayPause}
                  className="text-white p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
                <span className="text-white text-sm">
                  {isPlaying ? 'Playing' : 'Paused'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Video Description */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-white/80 text-sm sm:text-base max-w-2xl mx-auto">
            Get a glimpse of the immersive VR experiences waiting for you at VR Room Malta. 
            From thrilling adventures to multiplayer challenges, discover what makes us Malta's 
            premier VR destination.
          </p>
        </div>
      </div>
    </section>
  )
}