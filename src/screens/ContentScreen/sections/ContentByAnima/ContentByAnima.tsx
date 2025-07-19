import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  MailIcon,
} from "lucide-react";
import React from "react";

export const ContentByAnima = (): JSX.Element => {
  const footerSections = [
    {
      title: "Company",
      links: [
        {
          text: "Privacy Policies",
          url: "https://nutrasage.in/policies/privacy-policy"
        },
        {
          text: "Terms & Conditions",
          url: "https://nutrasage.in/policies/terms-of-service"
        },
        {
          text: "Returns & Refunds",
          url: "https://nutrasage.in/policies/refund-policy"
        },
        {
          text: "About Us",
          url: "https://nutrasage.in/pages/about-us"
        },
      ],
    },
  ];

  const socialIcons = [
    { icon: <MailIcon className="w-6 h-6" />, alt: "Mail" },
    { icon: <FacebookIcon className="w-6 h-6" />, alt: "Facebook" },
    { icon: <LinkedinIcon className="w-6 h-6" />, alt: "Linkedin" },
    { icon: <InstagramIcon className="w-6 h-6" />, alt: "Instagram" },
  ];

  return (
    <footer className="w-full bg-[#1d0917] mt-auto">
      <div className="container mx-auto flex flex-col md:flex-row items-start justify-between px-6 md:px-8 lg:px-32 py-12 md:py-20">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8 md:mb-0">
          <a href="https://nutrasage.in/" target="_blank" rel="noopener noreferrer">
            <img
              className="h-16 md:h-20 w-auto"
              alt="NutraSage"
              src="https://cdn.shopify.com/s/files/1/0707/7766/7749/files/Logo-footer.png?v=1745320131"
            />
          </a>
        </div>

        {/* Footer Links and Social Icons */}
        <div className="flex flex-col md:flex-row items-start gap-8 md:gap-6 w-full md:w-auto">
          {/* Map through footer sections */}
          <div className="flex gap-8 md:gap-16 w-full md:w-auto">
            {footerSections.map((section, index) => (
              <div
                key={index}
                className="flex flex-col items-start gap-4"
              >
                <div className="relative mt-[-1.00px] [font-family:'DM_Serif_Display',Helvetica] font-normal text-white text-base tracking-[0] leading-[normal]">
                  {section.title}
                </div>

                <div className="flex flex-col items-start gap-3">
                  {section.links.map((link, linkIndex) => (
                    <a
                      key={linkIndex}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${linkIndex === 0 ? "mt-[-1.00px]" : ""} font-desktop-body-s-regular font-[number:var(--desktop-body-s-regular-font-weight)] text-[#fff4fc] text-[length:var(--desktop-body-s-regular-font-size)] tracking-[var(--desktop-body-s-regular-letter-spacing)] leading-[var(--desktop-body-s-regular-line-height)] [font-style:var(--desktop-body-s-regular-font-style)] hover:underline transition-colors hover:text-white`}
                    >
                      {link.text}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Social Media Icons */}
          <div className="flex items-center gap-4 md:gap-[17px] mt-8 md:mt-0">
            {socialIcons.map((social, index) => (
              <a
                key={index}
                href="#"
                aria-label={social.alt}
                className="text-white hover:text-[#e9d6e4] transition-colors"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};