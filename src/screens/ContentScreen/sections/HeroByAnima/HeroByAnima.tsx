import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../../components/ui/button";

export const HeroByAnima = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <section className="relative w-full h-screen max-h-[800px] min-h-[598px] mt-[72px] overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="..//hero.png"
        >
          <source
            src="https://cdn.shopify.com/videos/c/o/v/b1c242e8ce564fe38aa76081ea224f52.mp4"
            type="video/mp4"
          />
        </video>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-8 max-w-[700px] px-4 md:px-8">
          <div className="flex flex-col items-center gap-6 w-full">
            <h1 className="[font-family:'DM_Serif_Display',Helvetica] font-normal text-white text-[32px] md:text-[32px] sm:text-[24px] text-center tracking-[2.50px] leading-9">
              Popping pills won&apos;t fix your health. <br className="hidden md:block" />
              But the right supplement will!
            </h1>

            <p className="max-w-[550px] [font-family:'Open_Sans',Helvetica] font-normal text-white text-lg md:text-lg sm:text-base text-center tracking-[0] leading-[22px]">
              At NutraSage, we don&apos;t just sell supplements, we build
              solutions. Backed by science, powered by nutrition, activated by
              movement.
              <br />
              <strong className="font-extrabold text-xl tracking-wide">
                It&apos;s not magic. It&apos;s a method.
              </strong>
            </p>
          </div>

          <Button 
            onClick={() => navigate('/quiz')}
            className="w-[130px] h-9 rounded-3xl bg-[#913177] text-white font-desktop-body-m-bold shadow-drop-shadow-button-primary"
          >
            Take Quiz
          </Button>
        </div>
      </div>
    </section>
  );
};