// src/components/sections/VideoSection.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react'

interface VideoSectionProps {
  className?: string
}

export default function VideoSection({ className = '' }: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const [isIntersecting, setIsIntersecting] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  // Intersection Observer for autoplay
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && videoRef.current && !isPlaying) {
          handleAutoPlay()
        }
      },
      { threshold: 0.5 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [isPlaying])

  // Auto-play when video comes into view
  const handleAutoPlay = useCallback(async () => {
    if (!videoRef.current) return

    try {
      await videoRef.current.play()
      setIsPlaying(true)
    } catch (error) {
      console.log('Auto-play prevented by browser')
      setIsPlaying(false)
    }
  }, [])

  // Update progress
  const updateProgress = useCallback(() => {
    if (!videoRef.current) return
    
    const current = videoRef.current.currentTime
    const total = videoRef.current.duration
    
    setCurrentTime(current)
    setProgress((current / total) * 100)
  }, [])

  // Video event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsLoading(false)
    }
  }, [])

  const handleCanPlayThrough = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    setIsPlaying(false)
  }, [])

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    updateProgress()
  }, [updateProgress])

  // Control handlers
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return

    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const seekTo = useCallback((percentage: number) => {
    if (!videoRef.current) return

    const seekTime = (percentage / 100) * duration
    videoRef.current.currentTime = seekTime
  }, [duration])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = (clickX / rect.width) * 100
    seekTo(percentage)
  }, [seekTo])

  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.current.requestFullscreen()
    }
  }, [])

  // Control visibility
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }, [])

  const handleMouseMove = useCallback(() => {
    showControlsTemporarily()
  }, [showControlsTemporarily])

  const handleMouseLeave = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    setShowControls(false)
  }, [])

  // Format time
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  return (
    <section className={`py-12 sm:py-16 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Experience VR Room Malta
          </h2>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto">
            Immerse yourself in our cutting-edge virtual reality experiences
          </p>
        </div>

        {/* Video Container */}
        <div 
          ref={containerRef}
          className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-800 shadow-2xl group"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            poster="/video-poster.jpg"
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlayThrough={handleCanPlayThrough}
            onError={handleError}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            playsInline
            muted={isMuted}
            loop
          >
            <source src="/vr-room-malta-experience.mp4" type="video/mp4" />
            <source src="/vr-room-malta-experience.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>

          {/* Loading State */}
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
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-[#01AEED] text-white rounded-lg text-sm hover:bg-[#01AEED]/90 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}

          {/* Play Button Overlay */}
          {!isLoading && !hasError && !isPlaying && (
            <button
              onClick={togglePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group cursor-pointer"
              aria-label="Play video"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </button>
          )}

          {/* Custom Controls */}
          {!isLoading && !hasError && (
            <div className={`
              absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 
              transition-opacity duration-300
              ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}
            `}>
              {/* Progress Bar */}
              <div 
                className="w-full bg-white/20 rounded-full h-1 mb-4 cursor-pointer group"
                onClick={handleProgressClick}
              >
                <div 
                  className="bg-[#01AEED] h-full rounded-full transition-all duration-150 group-hover:h-1.5"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={togglePlayPause}
                    className="text-white hover:text-[#01AEED] transition-colors p-1"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-[#01AEED] transition-colors p-1"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  
                  <div className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-[#01AEED] transition-colors p-1"
                  aria-label="Fullscreen"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Video Description */}
        <div className="text-center mt-8">
          <p className="text-white/80 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            Get a glimpse of the immersive VR experiences waiting for you at VR Room Malta. 
            From thrilling adventures to multiplayer challenges, discover what makes us Malta's 
            premier VR destination in the heart of Bugibba.
          </p>
        </div>
      </div>
    </section>
  )
}