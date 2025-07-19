import React from "react";
import { Button } from "../../../../components/ui/button";

export const SectionComponentNodeByAnima = (): JSX.Element => {
  return (
    <section className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-[125px] px-4 md:px-32 py-8 md:py-12 w-full bg-white border-b border-[#e9d6e4]">
      <div className="flex flex-col items-start gap-6 md:gap-8 w-full md:w-auto">
        <h2 className="self-stretch font-desktop-heading-xl text-[#1d0917] text-[32px] md:text-[44px] tracking-[2px] md:tracking-[4px] leading-[36px] md:leading-[48px]">
          Premium Quality Ingredients
        </h2>

        <div className="flex flex-col max-w-full md:max-w-[556px] items-start gap-6">
          <p className="font-desktop-body-xl-regular text-black text-[18px] md:text-[24px] leading-[24px] md:leading-[28px]">
            Our formulas are crafted with premium, bioavailable ingredients that are:
            <br />- Vegan
            <br />- Non-GMO
            <br />- Gluten-free
            <br />- Made in India to GMP ISO-9000 Standards
          </p>
        </div>

        <Button className="h-9 rounded-3xl px-4 py-[6.4px] bg-[#913177] text-white font-desktop-body-m-bold text-[16px] leading-[20px] shadow-drop-shadow-button-primary">
          Learn More About Our Ingredients
        </Button>
      </div>

      <div 
        className="relative w-full md:w-[479px] h-[300px] md:h-[479px] bg-cover bg-center bg-no-repeat" 
        style={{ 
          backgroundImage: "url(../frame-14220.png)",
          backgroundPosition: "center",
          backgroundSize: "cover"
        }} 
      />
    </section>
  );
};