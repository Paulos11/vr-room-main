// src/components/sections/VideoSection.tsx
'use client'

export default function VideoSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      
      {/* Section Title */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Experience VR Room Malta
        </h2>
      </div>

      {/* Full Width Video Container */}
      <div className="relative w-full aspect-video">
        <video
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster="/video-poster.jpg"
          preload="metadata"
        >
          <source src="/vr-room-malta-experience.mp4" type="video/mp4" />
          <source src="/vr-room-malta-experience.webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>
        
        {/* The custom play button overlay is removed as it's not needed for an autoplaying video. */}
        
      </div>
      
    </section>
  )
}