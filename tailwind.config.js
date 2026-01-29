module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backgroundColor: {
        'green-500': '#00ff00', // Add your green color code
        'yellow-500': '#ffff00', // Add your yellow color code
        // Add more colors as needed
      },
      textColor: {
        'green-500': '#00ff00',
        'yellow-500': '#ffff00',
        // Add more colors as needed
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
