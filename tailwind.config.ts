// REPLACE your tailwind.config.ts with this:

import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      // ADD THIS: Helvetica font family
      fontFamily: {
        'helvetica': [
          'Helvetica Neue',
          'Helvetica', 
          'Arial',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif'
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;