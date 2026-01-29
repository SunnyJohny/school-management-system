import React from 'react';
import {
  FaTachometerAlt,
  FaBoxes,
  FaMoneyCheckAlt,
  FaShoppingCart,
  FaCashRegister,
  FaFileInvoiceDollar,
  FaBalanceScale,
  FaChartLine,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaMoneyBillWave,
  FaUserGraduate,
  FaUserSlash,
} from 'react-icons/fa';
import UserInformation from './User';
import { useMyContext } from '../Context/MyContext';
import { Link, useNavigate } from 'react-router-dom';

const SalesPageSidePanel = () => {
  const { state, logout } = useMyContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Call logoutUser method from context
    navigate('/'); // Navigate to home page
  };

  return (
    <div className="flex flex-col bg-gray-800 text-white h-full overflow-auto">
      <UserInformation user={state.user} />
      <hr className="my-4 border-t-2 border-white" />

      <div className="flex flex-col flex-grow">
        <Link to="/posscreen" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaTachometerAlt className="text-xl" />
          <p className="ml-2">School Dashboard</p>
        </Link>

        <Link to="/inventory-page" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaBoxes className="text-xl" />
          <p className="ml-2">Inventory</p>
        </Link>

        <Link to="/expenses" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaMoneyCheckAlt className="text-xl" />
          <p className="ml-2">Expenses</p>
        </Link>

        <Link to="/purchases" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaShoppingCart className="text-xl" />
          <p className="ml-2">Goods Purchases</p>
        </Link>

        <Link to="/add-tax" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaMoneyBillWave className="text-xl" />
          <p className="ml-2">Add Tax</p>
        </Link>

        <Link to="/posscreen" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaCashRegister className="text-xl" />
          <p className="ml-2">Pos Screen</p>
        </Link>

        <Link to="/profitandloss" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaFileInvoiceDollar className="text-xl" />
          <p className="ml-2">Profit & Loss Statement</p>
        </Link>

        <Link to="/balance-sheet" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaBalanceScale className="text-xl" />
          <p className="ml-2">Balance Sheet</p>
        </Link>

        <Link to="/cash-flow" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaChartLine className="text-xl" />
          <p className="ml-2">Cash Flow Statement</p>
        </Link>

        <Link to="/fees" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaFileInvoiceDollar className="text-xl" />
          <p className="ml-2">Fees Payments</p>
        </Link>

        <Link to="/graduates" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaUserGraduate className="text-xl" />
          <p className="ml-2">Graduates</p>
        </Link>

        <Link to="/resignees-retirees" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaUserSlash className="text-xl" />
          <p className="ml-2">Resignees / Retirees</p>
        </Link>

        <Link to="/teachers" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaUserCircle className="text-xl" />
          <p className="ml-2">Staff / Teachers</p>
        </Link>

        <Link to="/sign-up" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaUserCircle className="text-xl" />
          <p className="ml-2">Staff Profile</p>
        </Link>

        <Link to="/settings" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaCog className="text-xl" />
          <p className="ml-2">Settings</p>
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center p-2 mb-2 cursor-pointer hover:bg-gray-700 text-left w-full"
        >
          <FaSignOutAlt className="text-xl" />
          <p className="ml-2">Logout</p>
        </button>
      </div>
    </div>
  );
};

export default SalesPageSidePanel;