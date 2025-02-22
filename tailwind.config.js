/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "voice-bar-1": {
          "0%, 100%": { height: "10px" },
          "50%": { height: "20px" },
        },
        "voice-bar-2": {
          "0%, 100%": { height: "15px" },
          "50%": { height: "32px" },
        },
        "voice-bar-3": {
          "0%, 100%": { height: "12px" },
          "50%": { height: "24px" },
        },
        "voice-bar-4": {
          "0%, 100%": { height: "18px" },
          "50%": { height: "28px" },
        },
      },
      animation: {
        "voice-bar-1": "voice-bar-1 1s ease-in-out infinite",
        "voice-bar-2": "voice-bar-2 0.8s ease-in-out infinite",
        "voice-bar-3": "voice-bar-3 1.2s ease-in-out infinite",
        "voice-bar-4": "voice-bar-4 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
