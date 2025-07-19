import React from "react";

export const Header = (): JSX.Element => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-center items-center px-6 py-6 max-w-7xl mx-auto">
          <div 
            className="cursor-pointer transition-opacity hover:opacity-80" 
            onClick={() => window.open('https://nutrasage.in', '_blank')}
          >
            <img
              src="https://cdn.shopify.com/s/files/1/0707/7766/7749/files/Logo_3.png?v=1745153339"
              alt="NutraSage"
              className="h-14 md:h-20 w-auto max-h-14 md:max-h-20"
            />
          </div>
        </div>
      </div>
    </header>
  );
};