import { useEffect, useMemo, useState } from "react";
import { useMyContext } from "../Context/MyContext";
import mylogo from "../assets/svg/springfield_golden_tulip_academy-removebg-preview.png";
import { FaBars, FaSyncAlt, FaArrowLeft } from "react-icons/fa";
import ProductsPageSidePanel from "./ProductsPagesidePanel";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const { state, toggleSidePanel, refreshData } = useMyContext();
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const [canGoBack, setCanGoBack] = useState(false);

  // ✅ Make it stable so it won’t trigger exhaustive-deps warning
  const AUTH_PATHS = useMemo(
    () => ["/sign-in", "/sign-up", "/forgot-password"],
    []
  );

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ Track last "good" page (non-auth page)
  useEffect(() => {
    const path = location.pathname;

    // save only if it's NOT an auth page
    if (!AUTH_PATHS.includes(path)) {
      sessionStorage.setItem("lastGoodPath", path);
    }

    // show back button only when not on root/auth pages
    const isRootPath = path === "/" || AUTH_PATHS.includes(path);
    setCanGoBack(!isRootPath);
  }, [location.pathname, AUTH_PATHS]);

  const handleBack = () => {
    const prevPath = sessionStorage.getItem("lastGoodPath");

    // If current page is already the saved path, fallback to home
    if (prevPath && prevPath !== location.pathname) {
      navigate(prevPath);
      return;
    }

    // fallback
    navigate("/");
  };

  const handleBurgerClick = () => {
    if (state.user) toggleSidePanel();
    else console.log("User is not signed in. Burger menu is disabled.");
  };

  return (
    <div className="bg-white border-b shadow-sm sticky top-0 z-40">
      <header className="flex justify-between items-center px-2 max-w-6xl mx-auto">
        {/* Left: Logo only */}
        <div className="flex items-center mt-2">
          <div
            className="flex items-center justify-center pb-2 cursor-pointer"
            onClick={() => {
              if (location.pathname !== "/") navigate("/");
            }}
            role="button"
            aria-label="Go home"
          >
            <img
              src={mylogo}
              alt="School Logo"
              className="object-contain"
              style={{ width: "80%", maxWidth: 150, height: "auto" }}
            />
          </div>
        </div>

        {/* Center: System name */}
        <div className="text-xl font-bold text-center text-gray-800 hidden md:block">
          <span className="relative">
            <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-lg opacity-50"></span>
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              School Management System
            </span>
          </span>
        </div>

        {/* Right: Back, Time, Reload, Burger */}
        <div className="flex items-center space-x-3">
          {canGoBack && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center text-blue-800 text-xl bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
              title="Go back"
              aria-label="Go back"
            >
              <FaArrowLeft />
            </button>
          )}

          <div className="text-lg font-medium text-gray-800 hidden md:block">
            {time.toLocaleTimeString()}
          </div>

          <button
            onClick={refreshData}
            className="flex items-center justify-center text-blue-800 text-xl bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
            title="Refresh"
            aria-label="Refresh data"
          >
            <FaSyncAlt />
          </button>

          <div className="block md:hidden" onClick={handleBurgerClick}>
            <FaBars
              className={`text-xl cursor-pointer ${
                state.user ? "text-gray-800" : "text-gray-400 cursor-not-allowed"
              }`}
              title={state.user ? "Open menu" : "Sign in to use the menu"}
            />
          </div>
        </div>
      </header>

      {/* Side panel */}
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
