import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";

export const Reviews = (): JSX.Element => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: true,
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(true);
  const [playingStates, setPlayingStates] = useState<{ [key: number]: boolean }>({});

  const testimonials = [
    {
      id: 1,
      quote: '"This is a quote that explains how happy I am with NutraSage"',
      backgroundImage: "url(..//-media-container-landscape-video-2xs.png)",
      videoUrl: "https://cdn.shopify.com/videos/c/o/v/b1c242e8ce564fe38aa76081ea224f52.mp4",
    },
    {
      id: 2,
      quote:
        '"Scientifically proven, used and tested, and more good words, thanks NutraSage"',
      backgroundImage: "url(..//-media-container-landscape-video-2xs-1.png)",
      videoUrl: "https://cdn.shopify.com/videos/c/o/v/b1c242e8ce564fe38aa76081ea224f52.mp4",
    },
    {
      id: 3,
      quote:
        '"My hair and skin never felt better, I am thankful to the personalised guidance"',
      backgroundImage: "url(..//-media-container-landscape-video-2xs-2.png)",
      videoUrl: "https://cdn.shopify.com/videos/c/o/v/b1c242e8ce564fe38aa76081ea224f52.mp4",
    },
    {
      id: 4,
      quote:
        '"My bones and skin never felt better, I am thankful to the personalised guidance"',
      backgroundImage: "url(..//-media-container-landscape-video-2xs-3.png)",
      videoUrl: "https://cdn.shopify.com/videos/c/o/v/b1c242e8ce564fe38aa76081ea224f52.mp4",
    },
  ];

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const handleVideoToggle = (testimonialId: number) => {
    const video = document.getElementById(`video-${testimonialId}`) as HTMLVideoElement;
    if (!video) return;

    setPlayingStates(prev => {
      const newStates = { ...prev };
      
      // If this video is currently playing, pause it
      if (newStates[testimonialId]) {
        video.pause();
        newStates[testimonialId] = false;
      } else {
        // Pause all other videos first
        Object.keys(newStates).forEach(key => {
          const id = parseInt(key);
          if (id !== testimonialId && newStates[id]) {
            const otherVideo = document.getElementById(`video-${id}`) as HTMLVideoElement;
            if (otherVideo) {
              otherVideo.pause();
            }
            newStates[id] = false;
          }
        });
        
        // Play this video
        video.play();
        newStates[testimonialId] = true;
      }
      
      return newStates;
    });
  };

  return (
    <section className="flex flex-col items-start gap-2.5 py-12 md:py-20 relative w-full bg-[#1d0917] overflow-hidden">
      <div className="flex flex-col items-start gap-10 px-4 md:px-8 lg:px-32 w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-24 w-full">
          <div className="flex flex-col items-start gap-5 flex-1">
            <h2 className="font-desktop-heading-xl font-[number:var(--desktop-heading-xl-font-weight)] text-white text-[32px] md:text-[44px] tracking-[var(--desktop-heading-xl-letter-spacing)] leading-[var(--desktop-heading-xl-line-height)] [font-style:var(--desktop-heading-xl-font-style)]">
              Our Reviews
            </h2>
          </div>

          <div className="flex items-end gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              className={`w-[54px] h-[54px] rounded-full border-0 p-0 ${
                prevBtnEnabled ? 'bg-[#fff4fc] hover:bg-[#fff4fc]/90' : 'bg-[#cececf] hover:bg-[#cececf]/90'
              }`}
            >
              <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.939339 10.9393C0.353554 11.5251 0.353554 12.4749 0.939339 13.0607L10.4853 22.6066C11.0711 23.1924 12.0208 23.1924 12.6066 22.6066C13.1924 22.0208 13.1924 21.0711 12.6066 20.4853L4.12132 12L12.6066 3.51472C13.1924 2.92893 13.1924 1.97919 12.6066 1.3934C12.0208 0.807611 11.0711 0.807611 10.4853 1.3934L0.939339 10.9393ZM32 10.5L2 10.5V13.5L32 13.5V10.5Z" fill="#1D0917"/>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              className={`w-[54px] h-[54px] rounded-full border-0 p-0 ${
                nextBtnEnabled ? 'bg-[#fff4fc] hover:bg-[#fff4fc]/90' : 'bg-[#cececf] hover:bg-[#cececf]/90'
              }`}
            >
              <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M31.0607 13.0607C31.6464 12.4749 31.6464 11.5251 31.0607 10.9393L21.5147 1.3934C20.9289 0.807611 19.9792 0.807611 19.3934 1.3934C18.8076 1.97919 18.8076 2.92893 19.3934 3.51472L27.8787 12L19.3934 20.4853C18.8076 21.0711 18.8076 22.0208 19.3934 22.6066C19.9792 23.1924 20.9289 23.1924 21.5147 22.6066L31.0607 13.0607ZM0 13.5H30V10.5H0V13.5Z" fill="#1D0917"/>
              </svg>
            </Button>
          </div>
        </div>

        <div className="w-full overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex-[0_0_100%] md:flex-[0_0_380px] min-w-0 pl-0 md:pl-5 first:pl-0"
              >
                <Card className="h-[400px] md:h-[629px] border-0 overflow-hidden">
                  <CardContent className="p-0 h-full relative">
                    <div
                      className="w-full h-full flex items-center justify-center relative"
                      style={{
                        background: playingStates[testimonial.id] ? 'none' : `linear-gradient(180deg, rgba(15,15,25,0) 0%, rgba(15,15,25,1) 100%), ${testimonial.backgroundImage} 50% 50% / cover`,
                      }}
                    >
                      <video
                        id={`video-${testimonial.id}`}
                        className={`absolute inset-0 w-full h-full object-cover ${playingStates[testimonial.id] ? 'opacity-100' : 'opacity-0'}`}
                        src={testimonial.videoUrl}
                        playsInline
                      />
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleVideoToggle(testimonial.id)}
                        className="w-[60px] h-[60px] rounded-full bg-[#ebd5e5] backdrop-blur-sm border-0 shadow-shadow-primary-downward-base hover:bg-[#ebd5e5] z-10"
                      >
                        {playingStates[testimonial.id] ? (
                          <PauseIcon className="h-6 w-6 text-[#97237b] fill-[#97237b]" />
                        ) : (
                          <PlayIcon className="h-6 w-6 text-[#97237b] fill-[#97237b]" />
                        )}
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full px-6 py-4">
                      <p className="font-desktop-body-xl-regular font-[number:var(--desktop-body-xl-regular-font-weight)] text-white text-[18px] md:text-[24px] tracking-[var(--desktop-body-xl-regular-letter-spacing)] leading-[var(--desktop-body-xl-regular-line-height)]">
                        {testimonial.quote}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};