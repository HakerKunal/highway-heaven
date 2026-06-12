import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        asphalt: "#15111B",
        tar: "#1E1826",
        gravel: "#2A2235",
        wine: "#8A1B2D",
        winedeep: "#5E1220",
        gold: "#DCA73F",
        golddim: "#B8861B",
        cream: "#F6EFE3",
        mist: "#B5AC9E",
        signgreen: "#0B6E4F",
        vegmark: "#1E8E3E",
        nonveg: "#7A3B1E",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sign: ["var(--font-sign)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(236,182,76,0.18)",
        card: "0 4px 24px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
