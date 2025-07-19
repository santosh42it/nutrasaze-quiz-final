import React from "react";
import { Card, CardContent } from "../../../../components/ui/card";

export const DivWrapperByAnima = (): JSX.Element => {
  const benefitCards = [
    {
      id: 1,
      title: "Higher\nEnergy",
      image: "..//energy.png",
      className: "col-span-1 row-span-2 h-[486px]"
    },
    {
      id: 2,
      title: "Better\nSleep",
      image: "..//sleep.png",
      className: "h-[232px]"
    },
    {
      id: 3,
      title: "Gut\nHealth",
      image: "..//frame-14205.png",
      className: "col-span-1 row-span-2 h-[486px]"
    },
    {
      id: 4,
      title: "Glowing Skin\n& Fuller Hair",
      image: "..//skin.png",
      className: "h-[232px]"
    },
    {
      id: 5,
      title: "Faster\nRecovery",
      image: "..//frame-14206.png",
      className: "h-[232px]"
    },
    {
      id: 6,
      title: "Balanced\nMetabolism",
      image: "..//frame-14209.png",
      className: "h-[232px]"
    }
  ];

  const renderCardTitle = (title: string) => {
    return title.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < title.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <section className="flex flex-col items-start gap-6 md:gap-10 px-4 md:px-8 lg:px-32 py-8 md:py-24 relative w-full bg-white">
      <h2 className="font-['DM_Serif_Display'] text-[28px] md:text-[44px] tracking-[2px] md:tracking-[4px] leading-[32px] md:leading-[48px] text-[#1d0917]">
        Feel the Difference
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 w-full">
        {benefitCards.map((card, index) => (
          <Card 
            key={card.id} 
            className={`relative rounded-xl overflow-hidden p-0 ${
              index === 0 ? "sm:col-span-2 lg:col-span-1" : ""
            } ${card.className}`}
          >
            <CardContent className="p-0 h-full">
              <div
                className="w-full h-full relative"
                style={{
                  background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%), url(${card.image}) center/cover no-repeat`,
                }}
              >
                <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 font-['DM_Serif_Display'] text-white text-[20px] md:text-[32px] tracking-[2px] md:tracking-[2.5px] leading-6 md:leading-9">
                  {renderCardTitle(card.title)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};