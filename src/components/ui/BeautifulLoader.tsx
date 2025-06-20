// components/ui/BeautifulLoader.tsx
import React from 'react';

export const BeautifulLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-400 via-blue-400 to-purple-500 backdrop-blur-md">
      {/* Blurred Background Overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-lg"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-16 h-16 bg-white/15 rounded-full animate-bounce-fast delay-75"></div>
        <div className="absolute top-20 right-20 w-12 h-12 bg-yellow-300/25 rounded-full animate-pulse-fast delay-150"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 bg-pink-300/20 rounded-full animate-bounce-fast delay-200"></div>
        <div className="absolute bottom-32 right-32 w-14 h-14 bg-green-300/25 rounded-full animate-pulse-fast delay-300"></div>
        <div className="absolute top-1/2 left-10 w-8 h-8 bg-white/20 rounded-full animate-bounce-fast delay-400"></div>
        <div className="absolute top-1/3 right-10 w-10 h-10 bg-blue-300/25 rounded-full animate-pulse-fast delay-500"></div>
      </div>
      
      {/* Main Loader Container */}
      <div className="relative flex flex-col items-center z-10">
        {/* 3D Balloon */}
        <div className="relative mb-6 animate-float-fast">
          {/* Multiple Balloon Shadows for depth */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-60 h-16 bg-black/30 rounded-full blur-2xl"></div>
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-56 h-14 bg-black/20 rounded-full blur-xl"></div>
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-52 h-12 bg-black/15 rounded-full blur-lg"></div>
          
          {/* Main Balloon */}
          <div className="relative w-72 h-72 bg-gradient-to-b from-white via-gray-50 to-gray-200 rounded-full shadow-2xl drop-shadow-2xl transform rotate-1 hover:rotate-0 transition-all duration-500">
            {/* Enhanced Balloon Shadows */}
            <div className="absolute inset-0 rounded-full shadow-inner opacity-20"></div>
            <div className="absolute -inset-1 rounded-full shadow-2xl opacity-30 blur-sm"></div>
            
            {/* Balloon Highlight */}
            <div className="absolute top-12 left-12 w-20 h-20 bg-gradient-to-br from-white via-white/80 to-transparent rounded-full opacity-90 blur-[1px]"></div>
            
            {/* Balloon Secondary Highlight */}
            <div className="absolute top-16 right-16 w-12 h-12 bg-white/70 rounded-full blur-sm"></div>
            
            {/* Balloon Reflection */}
            <div className="absolute inset-6 bg-gradient-to-t from-transparent via-white/40 to-white/70 rounded-full"></div>
            
            {/* Additional depth shadow inside */}
            <div className="absolute bottom-8 left-8 right-8 h-16 bg-gradient-to-t from-gray-300/30 to-transparent rounded-full blur-sm"></div>
            
            {/* Center Text on Balloon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-black drop-shadow-lg">
                  <span className="block text-green-600 animate-pulse-fast">EMS</span>
                  <span className="text-2xl md:text-3xl font-bold text-blue-600">at MFCC!</span>
                </h1>
              </div>
            </div>
            
            {/* Balloon String */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-gray-500 to-gray-700 rounded-full animate-sway-fast shadow-lg"></div>
            
            {/* String End */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-600 rounded-full shadow-lg animate-sway-fast"></div>
          </div>
        </div>
        
        {/* Loading Content Below Balloon */}
        <div className="text-center space-y-3 animate-fade-in-up-fast">
          {/* Fast Loading Animation */}
          <div className="flex items-center justify-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce-fast"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce-fast delay-75"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce-fast delay-150"></div>
            </div>
          </div>
          
          <p className="text-white/90 text-base md:text-lg font-medium animate-pulse-fast">
            Loading...
          </p>
        </div>
        
    
      </div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Small Floating Balloons with faster animation */}
        <div className="absolute top-1/4 left-1/4 w-6 h-8 bg-gradient-to-b from-red-400 to-red-500 rounded-full animate-float-fast opacity-70"></div>
        <div className="absolute top-1/3 right-1/4 w-5 h-7 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full animate-float-slower-fast opacity-60"></div>
        <div className="absolute bottom-1/3 left-1/3 w-6 h-8 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-full animate-float-fast opacity-50"></div>
        <div className="absolute bottom-1/4 right-1/3 w-4 h-6 bg-gradient-to-b from-pink-400 to-pink-500 rounded-full animate-float-slower-fast opacity-60"></div>
      </div>
    </div>
  );
};

// CSS Animations (add to your globals.css)
export const loaderStyles = `
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(2deg);
  }
  50% {
    transform: translateY(-20px) rotate(-1deg);
  }
}

@keyframes float-slow {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
}

@keyframes float-slower {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes sway {
  0%, 100% {
    transform: translateX(-50%) rotate(-2deg);
  }
  50% {
    transform: translateX(-50%) rotate(2deg);
  }
}

@keyframes fade-in-up {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progress {
  0% {
    stroke-dasharray: 0, 100;
  }
  100% {
    stroke-dasharray: 60, 100;
  }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

.animate-float-slow {
  animation: float-slow 6s ease-in-out infinite;
}

.animate-float-slower {
  animation: float-slower 8s ease-in-out infinite;
}

.animate-sway {
  animation: sway 3s ease-in-out infinite;
}

.animate-fade-in-up {
  animation: fade-in-up 1s ease-out;
}

.animate-progress {
  animation: progress 3s ease-in-out infinite;
}
`;