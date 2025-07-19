import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

interface UserInfo {
  name: string;
  email: string;
}

interface QuizAnswers {
  [key: string]: string;
}

const questions = [
  {
    id: "goals",
    question: "What are your primary health and wellness goals?",
    options: [
      "Increase Energy",
      "Improve Sleep",
      "Better Digestion",
      "Enhance Immunity",
    ],
  },
  {
    id: "lifestyle",
    question: "How would you describe your current lifestyle?",
    options: [
      "Very Active",
      "Moderately Active",
      "Somewhat Active",
      "Mostly Sedentary",
    ],
  },
  {
    id: "diet",
    question: "What type of diet do you follow?",
    options: [
      "Vegetarian",
      "Vegan",
      "Non-vegetarian",
      "No specific diet",
    ],
  },
  {
    id: "sleep",
    question: "How many hours of sleep do you get on average?",
    options: [
      "Less than 6 hours",
      "6-7 hours",
      "7-8 hours",
      "More than 8 hours",
    ],
  },
  {
    id: "stress",
    question: "How would you rate your stress levels?",
    options: [
      "Very High",
      "High",
      "Moderate",
      "Low",
    ],
  },
  {
    id: "supplements",
    question: "Have you taken supplements before?",
    options: [
      "Yes, regularly",
      "Yes, occasionally",
      "Rarely",
      "Never",
    ],
  },
];

export const QuizScreen = (): JSX.Element => {
  const [step, setStep] = useState<number>(0);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "", email: "" });
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showResults, setShowResults] = useState<boolean>(false);

  const handleUserInfoSubmit = () => {
    if (userInfo.name && userInfo.email) {
      setStep(1);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    if (Object.keys(answers).length === questions.length - 1) {
      setShowResults(true);
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const renderUserInfoForm = () => (
    <div className="flex flex-col items-center gap-8 w-full max-w-[500px] mx-auto">
      <h2 className="font-desktop-heading-xl text-[32px] md:text-[44px] text-[#1d0917] text-center tracking-[2px] md:tracking-[4px] leading-[36px] md:leading-[48px]">
        Let's Get Started
      </h2>
      <div className="w-full space-y-4">
        <Input
          type="text"
          placeholder="Your Name"
          value={userInfo.name}
          onChange={(e) => setUserInfo((prev) => ({ ...prev, name: e.target.value }))}
          className="h-12 px-6 rounded-xl border-[#e9d6e4]"
        />
        <Input
          type="email"
          placeholder="Your Email"
          value={userInfo.email}
          onChange={(e) => setUserInfo((prev) => ({ ...prev, email: e.target.value }))}
          className="h-12 px-6 rounded-xl border-[#e9d6e4]"
        />
        <Button
          onClick={handleUserInfoSubmit}
          className="w-full h-12 rounded-3xl bg-[#913177] text-white font-desktop-body-m-bold shadow-drop-shadow-button-primary"
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderQuestion = () => {
    const currentQuestion = questions[step - 1];
    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-[700px] mx-auto">
        <div className="w-full flex justify-between items-center">
          <span className="text-[#913177] font-desktop-body-m-bold">
            Question {step} of {questions.length}
          </span>
          <span className="text-[#913177] font-desktop-body-m-bold">
            {Math.round((step / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-[#f3f6e3] rounded-full">
          <div
            className="h-full bg-[#913177] rounded-full transition-all duration-300"
            style={{ width: `${(step / questions.length) * 100}%` }}
          />
        </div>
        <h2 className="font-desktop-heading-xl text-[28px] md:text-[36px] text-[#1d0917] text-center tracking-[2px] md:tracking-[4px] leading-[32px] md:leading-[40px]">
          {currentQuestion.question}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {currentQuestion.options.map((option) => (
            <Button
              key={option}
              onClick={() => handleAnswerSelect(currentQuestion.id, option)}
              className="h-auto py-4 px-6 rounded-xl bg-white border-2 border-[#e9d6e4] text-[#1d0917] hover:bg-[#f3f6e3] hover:border-[#913177] transition-all duration-300"
            >
              {option}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  const renderResults = () => (
    <div className="flex flex-col items-center gap-8 w-full max-w-[800px] mx-auto">
      <h2 className="font-desktop-heading-xl text-[32px] md:text-[44px] text-[#1d0917] text-center tracking-[2px] md:tracking-[4px] leading-[36px] md:leading-[48px]">
        Your Personalized Recommendations
      </h2>
      <Card className="w-full border-[#e9d6e4] rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <img
                src="/layer-1.svg"
                alt="NutraSage"
                className="w-16 h-16"
              />
              <div>
                <h3 className="font-desktop-heading-xl text-[24px] text-[#1d0917]">
                  NutraSage Custom Formula
                </h3>
                <p className="font-desktop-body-l-regular text-[#3d3d3d]">
                  Tailored to your unique needs
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="font-desktop-body-l-regular text-[#1d0917]">
                Based on your responses, we recommend:
              </p>
              <ul className="list-disc list-inside space-y-2 font-desktop-body-l-regular text-[#3d3d3d]">
                <li>Daily Energy & Focus Blend</li>
                <li>Stress Management Complex</li>
                <li>Sleep Support Formula</li>
              </ul>
            </div>
            <Button className="w-full h-12 rounded-3xl bg-[#913177] text-white font-desktop-body-m-bold shadow-drop-shadow-button-primary">
              Get Your Personalized Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <section className="min-h-screen bg-white pt-[72px]">
      <div className="container mx-auto px-4 py-12">
        {step === 0 && renderUserInfoForm()}
        {step > 0 && !showResults && renderQuestion()}
        {showResults && renderResults()}
      </div>
    </section>
  );
};