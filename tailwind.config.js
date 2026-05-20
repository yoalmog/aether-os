/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {

      colors: {
        cyber: "#22d3ee",
        neon: "#3b82f6",
        darkbg: "#020617",
      },

      boxShadow: {
        glow: "0 0 20px rgba(34,211,238,0.35)",
      },

      animation: {
        float: "float 6s ease-in-out infinite",
        pulseSlow: "pulse 4s infinite",
      },

      keyframes: {
        float: {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
      },

      backdropBlur: {
        xs: "2px",
      },
    },
  },

  plugins: [],
}
