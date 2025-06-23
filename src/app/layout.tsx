// src/app/layout.tsx - Fixed hydration issues
import type { Metadata } from 'next'
import { Poppins, Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

// Primary font for headings and important text
const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
})

// Secondary font for body text
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Fix metadataBase to resolve build warnings
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://tickets.ems.com.mt'
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'EMS Trade Fair 2025 | MFCC Ta\' Qali Malta | VIP Tickets & Solar Panels',
  description: 'Join EMS Trade Fair at Malta Fairs & Conventions Centre (MFCC) Ta\' Qali, Malta. June 26 - July 6, 2025. FREE VIP tickets, ice skating, VR games, magic shows, food & exclusive solar panel offers. Book now!',
  keywords: [
    'EMS Trade Fair',
    'MFCC Malta',
    'Malta Fairs Conventions Centre',
    'Ta Qali Malta',
    'Solar Panels Malta',
    'VIP Tickets',
    'Trade Fair Malta 2025',
    'EMS Panels',
    'Malta Events',
    'Ice Skating Malta',
    'VR Games Malta',
    'Magic Shows Malta'
  ],
  authors: [{ name: 'EMS Malta' }],
  creator: 'EMS Malta',
  publisher: 'EMS Malta',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_MT',
    url: baseUrl,
    title: 'EMS Trade Fair 2025 | MFCC Ta\' Qali Malta | FREE VIP Tickets',
    description: 'Malta\'s premier trade fair at MFCC Ta\' Qali. Entertainment, solar panels, VIP experience. June 26 - July 6, 2025. Get your FREE VIP ticket now!',
    siteName: 'EMS Trade Fair',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'EMS Trade Fair 2025 at MFCC Ta\' Qali Malta',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EMS Trade Fair 2025 | MFCC Malta | FREE VIP Tickets',
    description: 'Join us at Malta Fairs & Conventions Centre Ta\' Qali for entertainment, solar panels & VIP experience!',
    images: ['/twitter-image.jpg'],
  },
  alternates: {
    canonical: baseUrl,
  },
  other: {
    'geo.region': 'MT',
    'geo.placename': 'Ta\' Qali, Malta',
    'geo.position': '35.8892;14.4209',
    'ICBM': '35.8892, 14.4209',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <head>
        {/* Additional SEO Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=+35627555597" />
        
        {/* Local Business Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              "name": "EMS Trade Fair 2025",
              "description": "Malta's premier trade fair for Energy Management Solutions Malta and renewable energy at MFCC Ta' Qali",
              "startDate": "2025-07-26T09:00:00+02:00",
              "endDate": "2025-08-06T18:00:00+02:00",
              "eventStatus": "https://schema.org/EventScheduled",
              "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
              "location": {
                "@type": "Place",
                "name": "Malta Fairs & Conventions Centre",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "MFCC",
                  "addressLocality": "Ta' Qali",
                  "addressCountry": "Malta"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": "35.8892",
                  "longitude": "14.4209"
                }
              },
              "organizer": {
                "@type": "Organization",
                "name": "EMS Malta",
                "url": "https://www.ems.com.mt",
                "telephone": "+356-2755-5597"
              },
              "offers": {
                "@type": "Offer",
                "url": baseUrl,
                "price": "0",
                "priceCurrency": "EUR",
                "availability": "https://schema.org/InStock",
                "validFrom": "2025-01-01T00:00:00+02:00"
              },
              "image": [
                `${baseUrl}/event-image.jpg`
              ]
            })
          }}
        />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}