// // src/app/page.tsx
// import { Suspense } from 'react'
// import dynamic from 'next/dynamic'
// import Hero from '@/components/sections/Hero'

// // Lazy load components that are below the fold
// const VRGamesSection = dynamic(() => import('@/components/sections/VRGamesSection'), {
//   loading: () => (
//     <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="mb-8 sm:mb-12">
//           <div className="h-8 bg-gray-700 rounded-lg w-64 loading-skeleton"></div>
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           {Array.from({ length: 4 }).map((_, i) => (
//             <div key={i} className="aspect-[16/9] bg-gray-700 rounded-lg loading-skeleton"></div>
//           ))}
//         </div>
//       </div>
//     </section>
//   ),
//   ssr: false // Disable SSR for this component to improve initial load
// })

// const VideoSection = dynamic(() => import('@/components/sections/VideoSection'), {
//   loading: () => (
//     <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-8 sm:mb-12">
//           <div className="h-8 bg-gray-700 rounded-lg w-80 mx-auto loading-skeleton"></div>
//         </div>
//         <div className="relative w-full aspect-video rounded-lg bg-gray-700 loading-skeleton"></div>
//       </div>
//     </section>
//   ),
//   ssr: false
// })

// // Loading component for Suspense fallback
// function PageLoadingSkeleton() {
//   return (
//     <main className="min-h-screen">
//       {/* Hero skeleton */}
//       <section className="relative h-screen bg-gray-900 flex items-center justify-center">
//         <div className="text-center">
//           <div className="h-12 bg-gray-700 rounded-lg w-96 mx-auto mb-4 loading-skeleton"></div>
//           <div className="h-6 bg-gray-700 rounded-lg w-64 mx-auto mb-8 loading-skeleton"></div>
//           <div className="h-12 bg-blue-600 rounded-lg w-48 mx-auto loading-skeleton"></div>
//         </div>
//       </section>
      
//       {/* Games section skeleton */}
//       <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="mb-8 sm:mb-12">
//             <div className="h-8 bg-gray-700 rounded-lg w-64 loading-skeleton"></div>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//             {Array.from({ length: 4 }).map((_, i) => (
//               <div key={i} className="aspect-[16/9] bg-gray-700 rounded-lg loading-skeleton"></div>
//             ))}
//           </div>
//         </div>
//       </section>
      
//       {/* Video section skeleton */}
//       <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-8 sm:mb-12">
//             <div className="h-8 bg-gray-700 rounded-lg w-80 mx-auto loading-skeleton"></div>
//           </div>
//           <div className="relative w-full aspect-video rounded-lg bg-gray-700 loading-skeleton"></div>
//         </div>
//       </section>
//     </main>
//   )
// }

// export default function HomePage() {
//   return (
//     <Suspense fallback={<PageLoadingSkeleton />}>
//       <main className="min-h-screen">
//         {/* Hero loads immediately as it's above the fold */}
//         <Hero />
        
//         {/* These components are lazy loaded */}
//         <VRGamesSection />
//         <VideoSection />
//       </main>
//     </Suspense>
//   )
// }


import React from 'react'

const page = () => {
  return (
    <div>
      In Maintainance Mode
    </div>
  )
}

export default page
