import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

import magicui from "./src/components/magicui/tailwind-extend.json";

/** Colours come from CSS variables (HSL channels) in src/index.css, so themes switch at runtime. */
const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // `md` is the sidebar breakpoint (900px); tables stack into cards below `sm` (640px).
    screens: { sm: "640px", md: "900px", lg: "1100px", xl: "1280px" },
    extend: {
      colors: {
        bg: token("bg"),
        surface: { DEFAULT: token("surface"), 2: token("surface-2") },
        ink: { DEFAULT: token("ink"), 2: token("ink-2") },
        line: token("line"),
        brand: { DEFAULT: token("brand"), soft: token("brand-soft"), ink: token("brand-ink") },
        ok: token("ok"),
        warn: token("warn"),
        bad: token("bad"),
        chat: { bg: token("chat-bg"), in: token("bubble-in"), out: token("bubble-out") },
        // shadcn-style aliases used by the vendored Magic UI components
        background: token("background"),
        foreground: token("foreground"),
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        primary: { DEFAULT: token("primary"), foreground: token("primary-foreground") },
        secondary: { DEFAULT: token("secondary"), foreground: token("secondary-foreground") },
        muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
        accent: { DEFAULT: token("accent"), foreground: token("accent-foreground") },
        card: { DEFAULT: token("card"), foreground: token("card-foreground") },
        destructive: { DEFAULT: token("destructive"), foreground: token("primary-foreground") },
      },
      fontFamily: {
        sans: ["Hind", '"Noto Sans Tamil"', "system-ui", "sans-serif"],
        display: ['"Bricolage Grotesque"', "Hind", '"Noto Sans Tamil"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
      },
      keyframes: {
        ...magicui.keyframes,
        skeleton: { "0%, 100%": { opacity: "1" }, "50%": { opacity: ".45" } },
        "typing-dot": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: ".5" },
          "30%": { transform: "translateY(-3px)", opacity: "1" },
        },
      },
      animation: {
        ...magicui.animation,
        skeleton: "skeleton 1.4s ease-in-out infinite",
        "typing-dot": "typing-dot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
