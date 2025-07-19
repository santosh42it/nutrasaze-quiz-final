
import React from "react";

export const Footer = (): JSX.Element => {
  return (
    <footer className="bg-[#1d0917] text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-xl font-bold mb-4 md:mb-0">NutraSage</div>
          <div className="text-sm text-gray-300">
            © 2025 NutraSage. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
