import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        body: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", '"Courier New"', "monospace"],
      },
      colors: {
        primary: {
          50: "#f0fdf5",
          100: "#ddfaec",
          200: "#baf5d8",
          300: "#82e8b6",
          400: "#38d487",
          500: "#0fbe61",
          600: "#009A44",
          700: "#007a36",
          800: "#005c28",
          900: "#003818",
          950: "#002410",
        },
        neutral: {
          0: "#ffffff",
          50: "#faf9f7",
          100: "#f3f0eb",
          200: "#e8e3db",
          300: "#d4ccc0",
          400: "#b0a596",
          500: "#8c7f70",
          600: "#6b5f52",
          700: "#4e4439",
          800: "#342c23",
          900: "#1e1812",
          950: "#100e09",
        },
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#f5be1e",
          500: "#e0a008",
          600: "#b47d04",
        },
      },
      spacing: {
        18: "72px",
        22: "88px",
        26: "104px",
        30: "120px",
        36: "144px",
      },
      fontSize: {
        "display-sm": ["2.625rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "display-md": ["3.5rem", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "display-lg": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.04em" }],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "brand-sm": "var(--shadow-brand-sm)",
        "brand-md": "var(--shadow-brand-md)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
    },
  },
  plugins: [],
};

export default config;
