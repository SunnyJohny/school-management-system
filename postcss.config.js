module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // Update paths to your components
  theme: {
    extend: {}, // Add custom theme properties here if needed
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/autoprefixer")],
};

