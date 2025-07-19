import React from "react";

export const Header = (): JSX.Element => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div 
            className="text-2xl font-bold text-[#1d0917] cursor-pointer" 
            onClick={() => window.location.href = '/'}
          >
            NutraSage
          </div>
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => window.location.href = '/content'}
              className="text-[#1d0917] hover:text-[#913177] transition-colors"
            >
              About Us
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};