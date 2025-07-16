// src/app/experiences/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import { Users } from 'lucide-react'

// Featured VR Experiences
const featuredExperiences = [
  {
    id: 'vr-bike',
    title: 'VR Bike Experience',
    category: 'Sports Simulation',
    image: '/experiences/vr-bike.jpg',
    description: 'Pedal through stunning virtual landscapes and challenging terrains.',
  
    rating: 5,
    color: 'from-green-600 to-emerald-800'
  },
  {
    id: 'vr-warship',
    title: 'VR Warship Battle',
    category: 'Naval Combat',
    image: '/experiences/vr-warship.jpg',
    description: 'Command a naval fleet in epic sea battles and strategic combat.',
 
    rating: 5,
    color: 'from-blue-600 to-navy-800'
  }
]

// All VR Games - Real games from your images
const allGames = [
  { id: 1, title: 'City Hurricane', image: '/vr-bike/city-hurricane.jpg' },
  { id: 2, title: 'V-Racer Hoverbike', image: '/vr-bike/v-racer-hoverbike.jpg' },
  { id: 3, title: 'Knight on the Water', image: '/vr-bike/knight-on-the-water.jpg' },
  { id: 4, title: 'Desert Racing', image: '/vr-bike/desert-racing.jpg' },
  { id: 5, title: 'Fantasy Runner', image: '/vr-bike/fantasy-runner.jpg' },
  { id: 6, title: 'Overspeed Racing', image: '/vr-bike/overspeed-racing.jpg' },
  { id: 7, title: 'LaTale', image: '/vr-games/latale.jpg' },
  { id: 8, title: 'Ocean Guardians', image: '/vr-games/ocean-guardians.jpg' },
  { id: 9, title: 'VR Carnie', image: '/vr-games/vr-carnie.jpg' },
  { id: 10, title: 'Christmas Town', image: '/vr-games/christmas-town.jpg' },
  { id: 11, title: 'Dinosaur Island', image: '/vr-games/dinosaur-island.jpg' },
  { id: 12, title: 'Haunted House', image: '/vr-games/haunted-house.jpg' },
  
]

export default function ExperiencesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      
      {/* Header */}
      <div className="pt-24 pb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          VR <span className="text-[#01AEED]">Experiences</span>
        </h1>
        <p className="text-gray-300 px-4">
          Discover immersive virtual reality experiences
        </p>
      </div>

      {/* Featured Experiences */}
      <section className="px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Featured Experiences
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {featuredExperiences.map((experience) => (
              <div key={experience.id} className="group relative overflow-hidden rounded-xl">
                {/* Background Image */}
                <div className="relative aspect-[3/2]">
                  <Image
                    src={experience.image}
                    alt={experience.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${experience.color} opacity-60`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  {/* Top Content */}
                  <div>
                    <span className="inline-block bg-white/20 text-white px-2 py-1 rounded text-xs font-medium mb-2">
                      {experience.category}
                    </span>
                    
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      {experience.title}
                    </h3>
                    
                    <p className="text-white/90 text-sm leading-relaxed">
                      {experience.description}
                    </p>
                  </div>

                  {/* Bottom Content */}
                  <div className="flex items-center justify-between">
                    {/* Game Info */}
                    <div className="flex items-center gap-3 text-white text-xs">
                      
                    </div>

                    {/* Book Button */}
                    <Link
                      href={`/book?experience=${experience.id}`}
                      className="bg-[#01AEED] hover:bg-[#01AEED]/90 text-white px-4 py-2 rounded text-sm font-semibold transition-all duration-200"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Games Grid */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            All VR Games
          </h2>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
            {allGames.map((game) => (
              <Link
                key={game.id}
                href={`/book?game=${game.id}`}
                className="group flex flex-col items-center text-center transition-all duration-300 hover:scale-105"
              >
                {/* Game Image Circle */}
                <div className="relative w-20 h-20 mb-2 overflow-hidden rounded-full ring-1 ring-gray-600 group-hover:ring-[#01AEED] transition-all duration-300">
                  <Image
                    src={game.image}
                    alt={game.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                
                {/* Game Name */}
                <h3 className="text-white text-xs font-medium leading-tight group-hover:text-[#01AEED] transition-colors duration-300">
                  {game.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-[#01AEED]/10 border border-[#01AEED]/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-3">
              Ready for Your VR Adventure?
            </h2>
            <p className="text-gray-300 mb-4">
              Book your immersive experience today
            </p>
            <Link
              href="/book"
              className="inline-block bg-[#01AEED] hover:bg-[#01AEED]/90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              Book Your Experience
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}