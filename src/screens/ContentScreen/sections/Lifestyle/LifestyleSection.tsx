import React from "react";
import { Card, CardContent } from "../../../../components/ui/card";

export const LifestyleSection = (): JSX.Element => {
  const sections = [
    {
      id: 1,
      title: "Exercise",
      content:
        "Holistic nutrition integrates personalized supplementation with regular physical activity for optimal health.\nTo support you further, we'll provide a workout routine customised to your activity levels, ensuring a balanced, effective health journey.",
      imageUrl: "..//hero-1.png",
      imagePosition: "left",
    },
    {
      id: 2,
      title: "Diet",
      content:
        "At NutraSage, we understand that everyone's dietary needs are unique, which is why along with your customized supplements, we'll provide a diet plan tailored to your lifestyle, ensuring you get the right nutrients to maximize your energy, strength, and well-being. Embrace holistic health today—supplements, exercise, and diet, all working together for a healthier you.",
      imageUrl: "..//hero-2.png",
      imagePosition: "right",
    },
  ];

  return (
    <div className="flex flex-col items-start relative self-stretch w-full">
      {sections.map((section) => (
        <Card
          key={section.id}
          className="flex flex-col md:flex-row w-full items-start relative bg-white rounded-none shadow-none border-0"
        >
          {/* Mobile and Tablet: Show image first for both sections */}
          <div className="block md:hidden relative w-full h-[300px] sm:h-[400px]">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${section.imageUrl})`,
                backgroundPosition: "50% 50%",
                backgroundSize: "cover",
              }}
            />
          </div>

          {/* Desktop: Show left image only if imagePosition is left */}
          {section.imagePosition === "left" && (
            <div
              className="hidden md:block relative w-1/2 h-[516px] lg:h-[600px]"
              style={{
                backgroundImage: `url(${section.imageUrl})`,
                backgroundPosition: "50% 50%",
                backgroundSize: "cover",
              }}
            />
          )}

          <CardContent
            className={`flex flex-col h-auto md:h-[516px] lg:h-[600px] items-start justify-center gap-6 relative flex-1 grow p-6 sm:p-8 md:p-12 lg:p-16 ${
              section.imagePosition === "left" ? "md:p-12 lg:p-16" : "md:pl-24 lg:pl-32 md:pr-12 lg:pr-16 md:py-12 lg:py-16"
            }`}
          >
            <div className="flex flex-col w-full md:w-[496px] items-start gap-6 sm:gap-8 relative flex-[0_0_auto]">
              <h2 className="relative self-stretch mt-[-1.00px] font-desktop-heading-xl font-[number:var(--desktop-heading-xl-font-weight)] text-[#1d0917] text-[28px] sm:text-[32px] md:text-[38px] lg:text-[44px] tracking-[var(--desktop-heading-xl-letter-spacing)] leading-[32px] sm:leading-[36px] md:leading-[42px] lg:leading-[48px] [font-style:var(--desktop-heading-xl-font-style)]">
                {section.title}
              </h2>

              <p className="relative self-stretch font-desktop-body-l-regular font-[number:var(--desktop-body-l-regular-font-weight)] text-[#1d0917] text-[14px] sm:text-[16px] md:text-[18px] lg:text-[length:var(--desktop-body-l-regular-font-size)] tracking-[var(--desktop-body-l-regular-letter-spacing)] leading-[20px] sm:leading-[24px] md:leading-[26px] lg:leading-[var(--desktop-body-l-regular-line-height)] [font-style:var(--desktop-body-l-regular-font-style)]">
                {section.content.split("\n").map((text, index) => (
                  <React.Fragment key={index}>
                    {text}
                    {index < section.content.split("\n").length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            </div>
          </CardContent>

          {/* Desktop: Show right image only if imagePosition is right */}
          {section.imagePosition === "right" && (
            <div
              className="hidden md:block relative w-1/2 h-[516px] lg:h-[600px]"
              style={{
                backgroundImage: `url(${section.imageUrl})`,
                backgroundPosition: "50% 50%",
                backgroundSize: "cover",
              }}
            />
          )}
        </Card>
      ))}
    </div>
  );
};