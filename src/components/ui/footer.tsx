
import React from "react";

export const Footer = (): JSX.Element => {
  return (
    <footer className="bg-[#1d0917] text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <img
              src="https://cdn.shopify.com/s/files/1/0707/7766/7749/files/Logo-footer.png?v=1745320131"
              alt="NutraSage"
              className="h-12 w-auto"
            />
          </div>
          <div className="text-sm text-gray-300">
            © 2025 NutraSage. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
