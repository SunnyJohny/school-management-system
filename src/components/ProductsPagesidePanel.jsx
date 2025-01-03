import React from 'react';
import { FaTachometerAlt, FaDollarSign, FaUsers, FaUserTie, FaChalkboardTeacher, FaCalendarCheck, FaBuilding, FaMoneyCheckAlt, FaMoneyBillWave, FaFileInvoiceDollar, FaBug, FaSignOutAlt } from 'react-icons/fa';
import UserInformation from './User';
import { useMyContext } from '../Context/MyContext';
import { Link, useNavigate } from 'react-router-dom';

const ProductsPageSidePanel = () => {
  const { state, toggleSidePanel, logout } = useMyContext();
  const navigate = useNavigate();

  const handleLinkClick = (path) => {
    toggleSidePanel(); // Close the side panel
    if (path === "/") {
      handleLogout(); // If it's a logout action, perform logout
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col bg-gray-800 text-white h-screen overflow-y-auto">
      <UserInformation user={state.user} />
      <hr className="my-4 border-t-2 border-white" />
      <div className="flex flex-col flex-grow">
        <Link to="/posscreen" onClick={() => handleLinkClick('/posscreen')} className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaTachometerAlt className="text-xl" />
          <p className="ml-2">School Dashboard</p>
        </Link>
        <Link to="/fees" onClick={() => handleLinkClick('/fees')} className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaDollarSign className="text-xl" />
          <p className="ml-2">Fees</p>
        </Link>
        <Link to="/students" onClick={() => handleLinkClick('/students')} className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaUsers className="text-xl" />
          <p className="ml-2">Students</p>
        </Link>
        <Link to="/teachers" onClick={() => handleLinkClick('/teachers')} className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaUserTie className="text-xl" />
          <p className="ml-2">Teachers</p>
        </Link>
        <Link to="/classes" onClick={() => handleLinkClick('/classes')} className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaChalkboardTeacher className="text-xl" />
          <p className="ml-2">Classes</p>
        </Link>
        <Link to="/teachersattendance" onClick={() => handleLinkClick('/teachersattendance')} className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaCalendarCheck className="text-xl" />
          <p className="ml-2">Attendance</p>
        </Link>
        <Link to="/add-asset" onClick={() => handleLinkClick('/add-asset')} className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaBuilding className="text-xl" />
          <p className="ml-2">Fixed Asset</p>
        </Link>
        <Link to="/expenses" onClick={() => handleLinkClick('/expenses')} className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaMoneyCheckAlt className="text-xl" />
          <p className="ml-2">Expenses</p>
        </Link>
        <Link to="/add-tax" onClick={() => handleLinkClick('/add-tax')} className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaMoneyBillWave className="text-xl" />
          <p className="ml-2">Add Tax</p>
        </Link>
        <Link to="/profitandloss" onClick={() => handleLinkClick('/profitandloss')} className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaFileInvoiceDollar className="text-xl" />
          <p className="ml-2">Profit & Loss Statement</p>
        </Link>
        <Link to="/report-bug" onClick={() => handleLinkClick('/report-bug')} className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaBug className="text-xl" />
          <p className="ml-2">Report Bug</p>
        </Link>
        <Link to="/" onClick={() => handleLinkClick('/')} className="flex items-center p-2 mb-2 cursor-pointer hover:bg-gray-700">
          <FaSignOutAlt className="text-xl" />
          <p className="ml-2">Logout</p>
        </Link>
      </div>
    </div>
  );
};

export default ProductsPageSidePanel;
