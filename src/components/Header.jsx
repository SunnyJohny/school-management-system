import { useEffect, useState } from "react";
import { useMyContext } from "../Context/MyContext";
import mylogo from "../assets/svg/logo (1).png";
import { FaBars } from "react-icons/fa";
import ProductsPageSidePanel from "./ProductsPagesidePanel";

export default function Header() {
  const { state, toggleSidePanel } = useMyContext();
  const [time, setTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    console.log("Selected Company Name has changed:", state.selectedSchoolName);
  }, [state.selectedSchoolName]);

  return (
    <div className="bg-white border-b shadow-sm sticky top-0 z-40">
      <header className="flex justify-between items-center px-2 max-w-6xl mx-auto">
        {/* Left Section: Logo */}
        <div className="flex items-center mt-2">
          <div onClick={() => toggleSidePanel()} className="flex items-center justify-center pb-2 cursor-pointer">
            <img 
              src={mylogo} 
              alt="School Logo" 
              className="h-25 w-25 object-cover"
            />
          </div>
        </div>

        {/* Center Section: System Name */}
        <div className="text-lg font-semibold text-center text-gray-800 hidden md:block">
          School Management System
        </div>

        {/* Right Section: Time and Burger Menu */}
        <div className="flex items-center space-x-4">
          <div className="text-lg font-medium text-gray-800 hidden md:block">
            {time.toLocaleTimeString()}
          </div>
          <div className="block md:hidden" onClick={toggleSidePanel}>
            <FaBars className="text-xl cursor-pointer" />
          </div>
        </div>
      </header>

      {/* Conditionally Render ProductsPageSidePanel */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-transform duration-300 ${
          state.isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "300px", zIndex: 50 }}
      >
        <ProductsPageSidePanel />
      </div>
    </div>
  );
}
