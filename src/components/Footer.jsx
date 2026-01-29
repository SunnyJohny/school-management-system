import React from 'react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 w-full bg-gray-800 text-white py-2 text-center">
      <div className="flex justify-center items-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} PIXELFORGE TECHNOLOGIES. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
