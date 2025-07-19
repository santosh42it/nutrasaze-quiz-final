import React from "react";

export const Header = (): JSX.Element => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-center items-center h-[72px]">
          <a href="https://nutrasage.in/" className="flex items-center">
            <img
              src="https://cdn.shopify.com/s/files/1/0707/7766/7749/files/Logo_3.png?v=1745153339"
              alt="NutraSage"
              className="h-12 w-auto"
            />
          </a>
        </div>
      </div>
    </header>
  );
};