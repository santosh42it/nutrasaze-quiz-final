import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../../components/ui/accordion";

export const FaqByAnima = (): JSX.Element => {
  // FAQ data for mapping
  const faqItems = [
    {
      question: "How are my vitamins personalized?",
      answer: "Lorem Ipsum",
      isOpen: true,
    },
    {
      question: "How long does it take to notice a difference?",
      answer: "Lorem Ipsum",
      isOpen: false,
    },
    {
      question: "Do I have to subscribe",
      answer: "Lorem Ipsum",
      isOpen: false,
    },
    {
      question: "How sustainable is your packaging?",
      answer: "Lorem Ipsum",
      isOpen: false,
    },
  ];

  return (
    <section className="py-[72px] px-8 md:px-16 lg:px-32 bg-white w-full">
      <div className="max-w-[1184px] mx-auto">
        <h2 className="mb-16 [font-family:'DM_Serif_Display',Helvetica] font-normal text-[#0c0c0d] text-[44px] tracking-[2.50px] leading-[48px]">
          Frequently Asked Questions
        </h2>

        <Accordion
          type="single"
          collapsible
          defaultValue="item-0"
          className="w-full"
        >
          {faqItems.map((item, index) => (
            <AccordionItem
              key={`item-${index}`}
              value={`item-${index}`}
              className="border-b border-[#e5e5e5]"
            >
              <AccordionTrigger className="py-6 flex justify-between">
                <span className="text-left [font-family:'DM_Serif_Display',Helvetica] font-normal text-[32px] tracking-[2.50px] leading-9 text-[#1d0917] group-data-[state=open]:text-[#913177]">
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <p className="font-desktop-body-xl-regular text-[#3d3d3d] text-[length:var(--desktop-body-xl-regular-font-size)] tracking-[var(--desktop-body-xl-regular-letter-spacing)] leading-[var(--desktop-body-xl-regular-line-height)]">
                  {item.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
