import React from "react";
import { Header } from "../../components/ui/header";
import { Footer } from "../../components/ui/footer";
import { HeroByAnima } from "./sections/HeroByAnima/HeroByAnima";
import { Ingredients } from "./sections/Ingredients/Ingredients";
import { LifestyleSection } from "./sections/Lifestyle/LifestyleSection";
import { Reviews } from "./sections/Reviews/Reviews";
import { FaqByAnima } from "./sections/FaqByAnima/FaqByAnima";

export const ContentScreen = (): JSX.Element => {
  return (
    <div className="flex flex-col min-h-screen bg-[#1d0917] overflow-x-hidden">
      <Header />
      <main className="flex-1 pt-24">
        <HeroByAnima />
        <Ingredients />
        <LifestyleSection />
        <Reviews />
        <FaqByAnima />
      </main>
      <Footer />
    </div>
  );
};