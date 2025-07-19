import React from "react";
import { Card, CardContent } from "../../../../components/ui/card";

const steps = [
  {
    number: "01",
    title: "Take the Quiz",
    description: "Answer a few questions designed by doctors and nutrition experts.",
    icon: "/filemagnifyingglass.svg",
    iconAlt: "File magnifying",
  },
  {
    number: "02",
    title: "Get your Personalised Formula",
    description: "Your personalized supplement that gives your body exactly what it needs.",
    icon: "/notepencil.svg",
    iconAlt: "Note pencil",
  },
  {
    number: "03",
    title: "NutraSage Guidance",
    description: "NutraSage guide to support and guide you on your health journey",
    icon: "/handheart.svg",
    iconAlt: "Hand heart",
  },
];

export const FrameByAnima = (): JSX.Element => {
  return (
    <section className="flex items-start gap-16 px-4 md:px-8 lg:px-32 py-[72px] relative self-stretch w-full bg-[#f3f6e3]">
      <div className="flex flex-col md:flex-row items-stretch gap-6 relative flex-1">
        {steps.map((step, index) => (
          <Card key={index} className="flex-1 rounded-xl border-none bg-white">
            <CardContent className="flex flex-col items-start h-full gap-[17px] pt-5 pb-10 px-6">
              <img 
                className="w-16 h-16" 
                alt={step.iconAlt} 
                src={step.icon}
              />

              <div className="flex flex-col items-start gap-2 self-stretch w-full">
                <div className="self-stretch mt-[-1.00px] font-commissioner text-[#3d3d3d] text-lg">
                  Step {step.number}
                </div>

                <h3 className="self-stretch font-['DM_Serif_Display'] text-[#3d3d3d] text-2xl tracking-[2.50px] leading-7">
                  {step.title}
                </h3>
              </div>

              <p className="self-stretch font-commissioner text-[#3d3d3d] text-lg leading-[22px]">
                {step.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};