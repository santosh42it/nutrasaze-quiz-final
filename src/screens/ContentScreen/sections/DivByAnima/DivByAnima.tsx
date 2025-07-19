import React from "react";
import { Card, CardContent } from "../../../../components/ui/card";

export const DivByAnima = (): JSX.Element => {
  // Feature card data for mapping
  const featureCards = [
    {
      id: 1,
      title: "Personalised Nutrition",
      description:
        "NutraSage offers doctor-recommended supplements tailored to your unique health needs, ensuring you get exactly what your body requires.",
      icon: "/empathize-line.svg",
      altText: "Empathize line",
      bgColor: "bg-white",
    },
    {
      id: 2,
      title: "Holistic Health Approach",
      description:
        "We believe in combining supplements with a balanced diet and regular exercise, offering personalized diet plans and workout routines to support your fitness journey",
      icon: "/microscope-line.svg",
      altText: "Microscope line",
      bgColor: "bg-[#f3f6e3]",
    },
    {
      id: 3,
      title: "Cost-Effective Solution",
      description:
        "Instead of multiple supplements, NutraSage provides a single, all-in-one solution that delivers maximum results, saving you both time and money.",
      icon: "/hand-coin-line.svg",
      altText: "Hand coin line",
      bgColor: "bg-[#f3f6e3]",
    },
    {
      id: 4,
      title: "Trusted Quality",
      description:
        "Our supplements are crafted using the highest quality ingredients, backed by science, and designed to help you achieve lasting health and wellness",
      icon: "/test-tube-line.svg",
      altText: "Test tube line",
      bgColor: "bg-white",
    },
  ];

  return (
    <section className="flex flex-col items-center gap-8 md:gap-16 px-4 md:px-8 lg:px-32 py-8 md:py-12 w-full bg-[#fff4fc]">
      <h2 className="font-desktop-heading-xl font-[number:var(--desktop-heading-xl-font-weight)] text-[#1d0917] text-[32px] md:text-[44px] text-center tracking-[var(--desktop-heading-xl-letter-spacing)] leading-[36px] md:leading-[48px] [font-style:var(--desktop-heading-xl-font-style)]">
        Why NutraSage?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
        {featureCards.map((card) => (
          <Card
            key={card.id}
            className={`${card.bgColor} border-none rounded-2xl shadow-none h-auto md:h-[200px]`}
          >
            <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 p-6">
              <img className="w-12 h-12 md:w-16 md:h-16" alt={card.altText} src={card.icon} />
              <div className="flex flex-col items-start gap-2">
                <h3 className="[font-family:'DM_Serif_Display',Helvetica] font-normal text-[#1e2307] text-lg md:text-xl tracking-[1.50px] leading-6">
                  {card.title}
                </h3>
                <p className="font-desktop-body-l-regular font-[number:var(--desktop-body-l-regular-font-weight)] text-[#0c0c0d] text-base md:text-[length:var(--desktop-body-l-regular-font-size)] tracking-[var(--desktop-body-l-regular-letter-spacing)] leading-[var(--desktop-body-l-regular-line-height)] [font-style:var(--desktop-body-l-regular-font-style)]">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};