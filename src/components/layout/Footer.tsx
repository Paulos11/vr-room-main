// src/components/layout/Footer.tsx
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/vr-room-logo-white.png"
              alt="VR Room Malta"
              width={120}
              height={35}
              className="h-8 w-auto"
            />
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-8 text-sm">
            <Link href="/experiences" className="text-gray-400 hover:text-white transition-colors">
              Experiences
            </Link>
            <Link href="/visit" className="text-gray-400 hover:text-white transition-colors">
              Visit Us
            </Link>
            <Link href="/events" className="text-gray-400 hover:text-white transition-colors">
              Events
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
              Contact
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a 
              href="https://facebook.com/vrroommalta" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#01AEED] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a 
              href="https://instagram.com/vrroommalta" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#01AEED] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm7.808-8.988h-1.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5h1.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 VR Room Malta. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  )
}