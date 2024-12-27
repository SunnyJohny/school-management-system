

import React, { useEffect, useState } from 'react';
import ProductsPageSidePanel from '../components/ProductsPagesidePanel';
import { useMyContext } from '../Context/MyContext';
import Cart from '../components/Cart';
import { faChartLine, faShoppingCart, faCalendarAlt, faBox } from '@fortawesome/free-solid-svg-icons';


import { renderStatCard } from './FeesPaid';


const Tooltip = ({ text, children, studentId }) => { // Use `studentId` here
  const { addToCart } = useMyContext();

  const handleAddToCart = () => {
    addToCart(studentId); // Pass `studentId` to `addToCart`
  };

  return (
    <div className="relative group">
      {children}
      <div className="hidden group-hover:flex items-center cursor-pointer absolute top-0 left-1/2 transform -translate-x-1/2 bg-green-300 text-white p-2 rounded-md whitespace-nowrap mt-8">
        <span onClick={handleAddToCart}>{text}</span>
      </div>
    </div>
  );
};


const PosScreen = () => {
  const { addToCart, state } = useMyContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isIpadAndAbove, setIsIpadAndAbove] = useState(window.innerWidth < 768); // State to check screen size

  // Update the screen size on resize
  useEffect(() => {
    const handleResize = () => {
      setIsIpadAndAbove(window.innerWidth < 768); // 768px is the threshold for iPad and below
    };

    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);




  const filteredStudents = state.students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleAddToCart = (productId) => {
    addToCart(productId);
  };

  return (
    <div className="flex h-screen">
      {/* Left Section */}


      <>
        {isIpadAndAbove ? (
          // Render the Cart component for screens larger than 768px (iPad and above)
          <div className="hidden sm:flex">
            <ProductsPageSidePanel />
          </div>
        ) : (
          // Render the Cart component for iPad and below (mobile/tablet)
          <ProductsPageSidePanel />
        )}
      </>


      {/* Center Section */}
      <div className={`${isIpadAndAbove ? 'w-full' : 'w-3/4'} bg-gray-300 p-4 overflow-y-auto`}>





        <div className="flex flex-wrap p-2 md:space-x-4 space-y-4 md:space-y-0">
          {renderStatCard('Total No. of Students', `${78}`, 'blue', faChartLine)}
          {renderStatCard('Total No. of Teachers', `${90}`, 'green', faShoppingCart)}
          {renderStatCard('Total No. of Classes', `${34}`, 'red', faCalendarAlt)}
          {renderStatCard('Total No. of Subjects', `${78}`, 'gray', faBox)}
        </div>


        {/* Student List Title */}
        <h2 className="text-3xl font-bold mb-4 text-center">Student List</h2>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search student..."
          className="w-full p-2 mb-4 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Filtered Student List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white shadow-lg rounded-md p-6 hover:shadow-xl transition-shadow">
              <Tooltip text="Add to Class" studentId={student.id}>
                <div
                  className="text-center flex flex-col items-center cursor-pointer"
                  onClick={() => handleAddToCart(student.id)}
                >
                  {/* Student Photo */}
                  {student.photoURL ? (
                    <img
                      src={student.photoURL}
                      alt={student.name}
                      className="w-16 h-16 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                      <span className="text-gray-500">No Photo</span>
                    </div>
                  )}

                  {/* Student Info */}
                  <p className="text-lg font-bold text-blue-600">{student.name}</p> {/* Colored name */}
                  <p className="text-sm text-green-500">
                    Admission No: {student.admissionNumber}
                  </p> {/* Colored admission number */}
                  <p className="text-sm text-purple-500">Class: {student.class}</p> {/* Colored class */}
                </div>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>



      {/* Right Section - Conditional Rendering
      <>
        {isIpadAndAbove ? (
          // Render the Cart component for screens larger than 768px (iPad and above)
          <div className="hidden sm:flex">
            <Cart />
          </div>
        ) : (
          // Render the Cart component for iPad and below (mobile/tablet)
          <Cart />
        )}
      </> */}
    </div>
  );
};

export default PosScreen;
