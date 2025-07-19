module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "character-primaryinverse": "var(--character-primaryinverse)",
        "characterdisabled-placeholder-25":
          "var(--characterdisabled-placeholder-25)",
        "characterprimary-85": "var(--characterprimary-85)",
        "charactertitle-85": "var(--charactertitle-85)",
        hitbox: "var(--hitbox)",
        "neutral-2": "var(--neutral-2)",
        "neutral-5": "var(--neutral-5)",
        "primarybrand-blackmain": "var(--primarybrand-blackmain)",
        "semanticerror-low": "var(--semanticerror-low)",
        "semanticerror-strong": "var(--semanticerror-strong)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        commissioner: ["Commissioner", "sans-serif"],
        "body-regular-l": "var(--body-regular-l-font-family)",
        "button-m": "var(--button-m-font-family)",
        "desktop-body-l-regular": "var(--desktop-body-l-regular-font-family)",
        "desktop-body-m-bold": "var(--desktop-body-m-bold-font-family)",
        "desktop-body-m-regular": "var(--desktop-body-m-regular-font-family)",
        "desktop-body-s-regular": "var(--desktop-body-s-regular-font-family)",
        "desktop-body-xl-regular": "var(--desktop-body-xl-regular-font-family)",
        "desktop-heading-xl": "var(--desktop-heading-xl-font-family)",
        "h5-regular": "var(--h5-regular-font-family)",
        sans: [
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      boxShadow: {
        "drop-shadow-button-primary": "var(--drop-shadow-button-primary)",
        "shadow-primary-downward-base": "var(--shadow-primary-downward-base)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
  },
  plugins: [],
  darkMode: ["class"],
};