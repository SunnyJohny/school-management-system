import React, { useEffect } from 'react';
import { useMyContext } from '../Context/MyContext';

const UserInformation = () => {
  const { state } = useMyContext();
  const user = state.user; // Extract user from state
  const userName = user ? user.name : ''; // Use conditional to prevent error if user is null
  const userRole = user ? user.role : '';
  const userID = user && user.userID ? user.userID.substring(0, 4) : ''; // Ensure userID is defined before using substring

  // useEffect hook to log the user in state when it changes
  useEffect(() => {
    console.log('Updated User in State:', userName, user);
  }, [user, userName]); // Include userName in the dependency array

  return (
    <div className="flex flex-col p-4 items-center">
      {/* Circular Image */}
      <div className="bg-gray-500 w-12 h-12 rounded-full mb-2">
        {/* You can add an image here if needed */}
      </div>
      
      {/* User Information */}
      <div className="text-center">
        <p className="text-lg font-bold mb-2">{userName}</p>
        {/* Add conditional check for user role */}
        <p className="text-sm mb-1">{userRole}</p>
        <p className="text-sm">User ID: {userID}...</p>
      </div>
    </div>
  );
};

export default UserInformation;
