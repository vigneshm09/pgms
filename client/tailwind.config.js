/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9ecff",
          200: "#bfdfff",
          500: "#2388ff",
          600: "#1871e0",
          700: "#1257ae",
          800: "#0f478e"
        }
      },
      boxShadow: {
        soft: "0 18px 40px rgba(18, 87, 174, 0.10)"
      }
    }
  },
  plugins: []
};
