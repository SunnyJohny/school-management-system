import React from 'react';
import { FaDollarSign, FaUsers, FaUserTie, FaChalkboardTeacher, FaCalendarCheck, FaBuilding, FaBalanceScale, FaBug, FaSignOutAlt } from 'react-icons/fa';
import UserInformation from './User';
import { useMyContext } from '../Context/MyContext';
import { Link, useNavigate } from 'react-router-dom';

const InventorySidePanel = ({ onItemSelected }) => {
  const { state, logout } = useMyContext();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout(); 
    navigate('/'); // Navigate to home page
  };

  return (
    <div className="flex flex-col bg-gray-800 text-white p-4 h-screen">
      <UserInformation user={state.user} />
      <hr className="my-4 border-t-2 border-white" />
      {/* Links */}
      <div className="flex flex-col flex-grow"> 
        <Link to="/fees" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaDollarSign className="text-xl" />
          <p className="ml-2">Fees</p>
        </Link>

        <Link to="/students" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaUsers className="text-xl" />
          <p className="ml-2">Students</p>
        </Link>

        <Link to="/teachers" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaUserTie className="text-xl" />
          <p className="ml-2">Teachers</p>
        </Link>

        <Link to="/classes" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaChalkboardTeacher className="text-xl" />
          <p className="ml-2">Classes</p>
        </Link>

        <Link to="/teachersattendance" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaCalendarCheck className="text-xl" />
          <p className="ml-2">Attendance</p>
        </Link>

        <Link to="/add-asset" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaBuilding className="text-xl" />
          <p className="ml-2">Fixed Asset</p>
        </Link>

        <Link to="/add-liability" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaBalanceScale className="text-xl" />
          <p className="ml-2">Liability</p>
        </Link>

        <Link to="/report-bug" className="flex items-center p-2 cursor-pointer hover:bg-gray-700">
          <FaBug className="text-xl" />
          <p className="ml-2">Report Bug</p>
        </Link>

        <Link to="/" onClick={handleLogout} className="flex items-center p-2 mb-2 cursor-pointer hover:bg-gray-700">
          <FaSignOutAlt className="text-xl" />
          <p className="ml-2">Logout</p>
        </Link>
      </div>
    </div>
  );
};

export default InventorySidePanel;