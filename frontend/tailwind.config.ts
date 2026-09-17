import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#14110e",
        bgraise: "#1c1814",
        bgcard: "#211c17",
        line: "#332c24",
        linesoft: "#2a241d",
        gold: "#E8540B",
        goldbright: "#FF7A3D",
        golddim: "rgba(232,84,11,.14)",
        ink: "#f0eae0",
        inkmid: "#b5ab9a",
        inkdim: "#7d7466",
        green: "#7da97a",
        greendim: "rgba(125,169,122,.15)",
        red: "#c07a6a",
        reddim: "rgba(192,122,106,.15)",
      },
      fontFamily: {
        display: ["var(--font-urbanist)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
