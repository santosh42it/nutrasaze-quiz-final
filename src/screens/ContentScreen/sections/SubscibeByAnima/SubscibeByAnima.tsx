import React from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";

export const SubscibeByAnima = (): JSX.Element => {
  return (
    <section className="w-full py-16 md:py-32 bg-[#fff4fc]">
      <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto px-4 md:px-8">
        <h2 className="text-[32px] md:text-[44px] font-normal text-[#0c0c0d] text-center tracking-[2px] md:tracking-[2.50px] leading-[36px] md:leading-[48px] [font-family:'DM_Serif_Display',Helvetica]">
          Get the latest updates
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-2 w-full">
          <Card className="w-full md:flex-1 border-[#e9d6e4] rounded-[40px] p-0 bg-white shadow-none">
            <CardContent className="p-0">
              <Input
                className="border-none h-12 md:h-16 px-6 md:px-8 rounded-[40px] font-desktop-body-m-regular text-[#6d6d6e]"
                placeholder="Subscribe to our Newsletter"
              />
            </CardContent>
          </Card>

          <Button className="w-full md:w-auto md:flex-1 h-12 md:h-16 rounded-[128px] bg-[#913177] text-white font-desktop-body-m-bold shadow-drop-shadow-button-primary">
            Subscribe
          </Button>
        </div>
      </div>
    </section>
  );
};