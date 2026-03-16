/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#0c0f14", card: "#111621", hover: "#151922" },
        accent: { green: "#10b981", blue: "#3b82f6", red: "#ef4444", amber: "#f59e0b", purple: "#a855f7" },
      },
    },
  },
  plugins: [],
};
