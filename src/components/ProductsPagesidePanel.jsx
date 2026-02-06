import React from 'react';
import {
  FaTachometerAlt,
  FaDollarSign,
  FaUsers,
  FaUserTie,
  FaChalkboardTeacher,
  FaCalendarCheck,
  FaBuilding,
  FaMoneyCheckAlt,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaBug,
  FaSignOutAlt,
  FaUserPlus,
} from 'react-icons/fa';
import UserInformation from './User';
import { useMyContext } from '../Context/MyContext';
import { Link, useNavigate } from 'react-router-dom';

const ProductsPageSidePanel = () => {
  const { state, toggleSidePanel, logout } = useMyContext();
  const navigate = useNavigate();

  const handleLinkClick = () => {
    // Close the side panel only on small screens
    if (window.innerWidth <= 768) {
      toggleSidePanel();
    }
  };

  const handleLogout = () => {
    // Close the side panel before logging out
    if (window.innerWidth <= 768) {
      toggleSidePanel();
    }
    logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col bg-gray-800 text-white h-screen overflow-y-auto">
      <UserInformation user={state.user} />
      <hr className="my-4 border-t-2 border-white" />

      <div className="flex flex-col flex-grow">
        <Link
          to="/posscreen"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaTachometerAlt className="text-xl" />
          <p className="ml-2">School Dashboard</p>
        </Link>

        <Link
          to="/fees"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaDollarSign className="text-xl" />
          <p className="ml-2">Fees</p>
        </Link>

        <Link
          to="/students"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaUsers className="text-xl" />
          <p className="ml-2">Students</p>
        </Link>

        <Link
          to="/teachers"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaUserTie className="text-xl" />
          <p className="ml-2">Teachers</p>
        </Link>

        <Link
          to="/classes"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaChalkboardTeacher className="text-xl" />
          <p className="ml-2">Classes</p>
        </Link>

        <Link
          to="/teachersattendance"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaCalendarCheck className="text-xl" />
          <p className="ml-2">Attendance</p>
        </Link>

        {/* ✅ Users / Staff accounts (no admin constraint) */}
        <Link
          to="/users"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaUserPlus className="text-xl" />
          <p className="ml-2">Users</p>
        </Link>

        {/* New Links for Resignees/Retirees and Graduates */}
        <Link
          to="/resignees-retirees"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaUsers className="text-xl" />
          <p className="ml-2">Resignees/Retirees</p>
        </Link>

        <Link
          to="/graduates"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaUsers className="text-xl" />
          <p className="ml-2">Graduates</p>
        </Link>

        <Link
          to="/add-asset"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaBuilding className="text-xl" />
          <p className="ml-2">Fixed Asset</p>
        </Link>

        <Link
          to="/expenses"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaMoneyCheckAlt className="text-xl" />
          <p className="ml-2">Expenses</p>
        </Link>

        <Link
          to="/add-tax"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaMoneyBillWave className="text-xl" />
          <p className="ml-2">Add Tax</p>
        </Link>

        <Link
          to="/profitandloss"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaFileInvoiceDollar className="text-xl" />
          <p className="ml-2">Profit & Loss Statement</p>
        </Link>

        <Link
          to="/report-bug"
          onClick={handleLinkClick}
          className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
        >
          <FaBug className="text-xl" />
          <p className="ml-2">Report Bug</p>
        </Link>

        <Link
          to="/"
          onClick={handleLogout}
          className="flex items-center p-2 mb-2 cursor-pointer hover:bg-gray-700"
        >
          <FaSignOutAlt className="text-xl" />
          <p className="ml-2">Logout</p>
        </Link>
      </div>
    </div>
  );
};

export default ProductsPageSidePanel;
