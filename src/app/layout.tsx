// src/app/layout.tsx - Updated for VR Room Malta
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ConsentWrapper } from '@/components/ConsentWrapper'

// Load Gordita Montserrat alternative (Inter is similar and more accessible)
const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

// Fix metadataBase to resolve build warnings
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://vrroommalta.com'
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'VR Room Malta | Virtual Reality Gaming in Bugibba | Opening This Wednesday',
  description: 'Experience cutting-edge virtual reality games at VR Room Malta in Bugibba! Just 50 meters from Bugibba Square. Immersive, unforgettable VR adventures await. Book your session today!',
  keywords: [
    'VR Room Malta',
    'Virtual Reality Malta',
    'VR Gaming Malta',
    'Bugibba Entertainment',
    'VR Experience Malta',
    'Virtual Reality Games',
    'Malta Gaming',
    'VR Adventure Malta',
    'Bugibba Square',
    'Malta VR Center'
  ],
  authors: [{ name: 'VR Room Malta' }],
  creator: 'VR Room Malta',
  publisher: 'VR Room Malta',
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
    title: 'VR Room Malta | Virtual Reality Gaming in Bugibba',
    description: 'Malta\'s premier VR gaming destination in Bugibba. Cutting-edge virtual reality experiences just 50 meters from Bugibba Square.',
    siteName: 'VR Room Malta',
    images: [
      {
        url: '/vr-room-malta-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'VR Room Malta - Virtual Reality Gaming in Bugibba',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VR Room Malta | Virtual Reality Gaming in Bugibba',
    description: 'Experience cutting-edge VR games at Malta\'s newest VR destination in Bugibba!',
    images: ['/vr-room-malta-hero.jpg'],
  },
  alternates: {
    canonical: baseUrl,
  },
  other: {
    'geo.region': 'MT',
    'geo.placename': 'Bugibba, Malta',
    'geo.position': '35.9503;14.4124',
    'ICBM': '35.9503, 14.4124',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Google Analytics with Consent Management */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17267533077"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied', 
                analytics_storage: 'denied',
                functionality_storage: 'denied',
                personalization_storage: 'denied',
                security_storage: 'granted',
                wait_for_update: 500,
              });
              
              gtag('js', new Date());
              gtag('config', 'AW-17267533077', {
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false
              });
            `,
          }}
        />
        
        {/* Additional SEO Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#01AEED" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Local Business Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "VR Room Malta",
              "description": "Malta's premier virtual reality gaming center in Bugibba",
              "openingHours": "Mo-Su 10:00-22:00",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "50 meters from Bugibba Square",
                "addressLocality": "Bugibba",
                "addressRegion": "Northern Region",
                "addressCountry": "Malta"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "35.9503",
                "longitude": "14.4124"
              },
              "url": baseUrl,
              "telephone": "+356-XXXX-XXXX",
              "priceRange": "€€",
              "image": [
                `${baseUrl}/vr-room-malta-hero.jpg`
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "1"
              }
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
      <body className={`${inter.className} font-sans antialiased bg-white`}>
        <ConsentWrapper>
          {children}
          <Toaster />
        </ConsentWrapper>
      </body>
    </html>
  )
}