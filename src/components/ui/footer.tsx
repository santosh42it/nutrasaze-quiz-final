import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1d0917] py-4 px-4 text-center mt-auto">
      <img 
        src="https://cdn.shopify.com/s/files/1/0707/7766/7749/files/Logo-footer.png?v=1745320131" 
        alt="NutraSage" 
        className="h-8 mx-auto mb-3"
      />
      <p className="text-white text-sm">
        © 2025 NutraSage. All rights reserved.
      </p>
    </footer>
  );
};