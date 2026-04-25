/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        lo: {
          bg:       "#0A0A0F",
          surface:  "#13131A",
          elevated: "#1C1C26",
          elevated2:"#22222E",
          border:   "#2A2A38",
          borderStrong: "#363648",
          // Text
          text:     "#F4F4F8",
          muted:    "#8F8FA3",
          dim:      "#5A5A6B",
          // Accents
          teal:     "#00E5C3",
          tealDim:  "#0B8973",
          amber:    "#F5A623",
          amberDim: "#8F6114",
          violet:   "#7C5CFC",
          violetDim:"#4A3896",
          // Semantic
          positive: "#00E5C3",
          negative: "#FF5C72",
          warning:  "#F5A623",
          // Categories
          catRoutine: "#8F8FA3",
          catMeal:    "#F5A623",
          catExercise:"#00E5C3",
          catFocus:   "#7C5CFC",
          catClass:   "#5C8FFC",
          catSocial:  "#FC5C9E",
          catWork:    "#FC8B5C",
        },
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        input: '12px',
        chip: '8px',
      },
    },
  },
  plugins: [],
};
