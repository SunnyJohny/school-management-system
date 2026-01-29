import React, { useEffect, useState } from 'react';
import ProductsPageSidePanel from '../components/ProductsPagesidePanel';
import { useMyContext } from '../Context/MyContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faShoppingCart, faCalendarAlt, faBox } from '@fortawesome/free-solid-svg-icons';

const renderStatCard = (title, value, color, icon, onClick) => (
  <div 
    className={`bg-${color}-500 text-white p-4 rounded-md inline-block m-2 cursor-pointer hover:bg-${color}-700 transition-colors`} 
    onClick={onClick}
  >
    <div className="text-sm">{title}</div>
    <div className="text-2xl font-bold">{value}</div>
    <FontAwesomeIcon icon={icon} className="text-2xl mt-2" />
  </div>
);

const PosScreen = () => {
  const { state } = useMyContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isIpadAndAbove, setIsIpadAndAbove] = useState(window.innerWidth < 768); // State to check screen size
  const [selectedCategory, setSelectedCategory] = useState('students');

  useEffect(() => {
    const handleResize = () => {
      setIsIpadAndAbove(window.innerWidth < 768); // 768px is the threshold for iPad and below
    };

    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ensure state properties are defined to prevent runtime errors
  const students = state.students || [];
  const teachers = state.teachers || [];
  const classes = state.classes || [];
  const subjects = state.subjects || [];

  // Helper function to compare classes
  const compareClasses = (a, b) => {
    if (a.class < b.class) return -1;
    if (a.class > b.class) return 1;
    return 0;
  };

  const filteredStudents = students
    .filter((student) => student.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort(compareClasses);

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClasses = classes.filter((classItem) =>
    classItem.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderList = () => {
    switch (selectedCategory) {
      case 'students':
        return (
          <>
            <h2 className="text-3xl font-bold mb-4 text-center">Student List</h2>
            <input
              type="text"
              placeholder="Search student..."
              className="w-full p-2 mb-4 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="bg-white shadow-lg rounded-md p-6 hover:shadow-xl transition-shadow">
                  <div className="text-center flex flex-col items-center cursor-pointer">
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
                    <p className="text-lg font-bold text-blue-600">{student.name}</p> {/* Colored name */}
                    <p className="text-sm text-green-500">Admission No: {student.admissionNumber}</p> {/* Colored admission number */}
                    <p className="text-sm text-purple-500">Class: {student.class}</p> {/* Colored class */}
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      case 'teachers':
        return (
          <>
            <h2 className="text-3xl font-bold mb-4 text-center">Teacher List</h2>
            <input
              type="text"
              placeholder="Search teacher..."
              className="w-full p-2 mb-4 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {filteredTeachers.map((teacher) => (
                <div key={teacher.id} className="bg-white shadow-lg rounded-md p-6 hover:shadow-xl transition-shadow flex flex-col items-center">
                  {teacher.photoURL ? (
                    <img
                      src={teacher.photoURL}
                      alt={teacher.name}
                      className="w-16 h-16 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                      <span className="text-gray-500">No Photo</span>
                    </div>
                  )}
                  <div className="text-center cursor-pointer">
                    <p className="text-lg font-bold text-blue-600">{teacher.name}</p> {/* Colored name */}
                    <p className="text-sm text-green-500">Subject: {teacher.subject}</p> {/* Colored subject */}
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      case 'classes':
        return (
          <>
            <h2 className="text-3xl font-bold mb-4 text-center">Class List</h2>
            <input
              type="text"
              placeholder="Search class..."
              className="w-full p-2 mb-4 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {filteredClasses.map((classItem) => (
                <div key={classItem.id} className="bg-white shadow-lg rounded-md p-6 hover:shadow-xl transition-shadow">
                  <div className="text-center flex flex-col items-center cursor-pointer">
                    <p className="text-lg font-bold text-blue-600">{classItem.className}</p>
                    <p className="text-sm text-green-500">Students: {classItem.numberOfStudents}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      case 'subjects':
        return (
          <>
            <h2 className="text-3xl font-bold mb-4 text-center">Subject List</h2>
            <input
              type="text"
              placeholder="Search subject..."
              className="w-full p-2 mb-4 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="bg-white shadow-lg rounded-md p-6 hover:shadow-xl transition-shadow">
                  <div className="text-center flex flex-col items-center cursor-pointer">
                    <p className="text-lg font-bold text-blue-600">{subject.name}</p> {/* Colored name */}
                    <p className="text-sm text-green-500">Code: {subject.code}</p> {/* Colored code */}
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Section */}
        <>
          {isIpadAndAbove ? (
            // Render the Cart component for screens larger than 768px (iPad and above)
            <div className="hidden sm:flex h-full overflow-y-auto">
              <ProductsPageSidePanel />
            </div>
          ) : (
            // Render the Cart component for iPad and below (mobile/tablet)
            <div className="h-full overflow-y-auto">
              <ProductsPageSidePanel />
            </div>
          )}
        </>

        {/* Center Section */}
        <div className="flex-1 bg-gray-300 p-4 overflow-y-auto">
          <div className="flex flex-wrap p-2 md:space-x-4 space-y-4 md:space-y-0">
            {renderStatCard('Total No. of Students', `${students.length}`, 'blue', faChartLine, () => setSelectedCategory('students'))}
            {renderStatCard('Total No. of Teachers', `${teachers.length}`, 'green', faShoppingCart, () => setSelectedCategory('teachers'))}
            {renderStatCard('Total No. of Classes', `${classes.length}`, 'red', faCalendarAlt, () => setSelectedCategory('classes'))}
            {renderStatCard('Total No. of Subjects', `${subjects.length}`, 'gray', faBox, () => setSelectedCategory('subjects'))}
          </div>
          {renderList()}
        </div>
      </div>
    </div>
  );
};

export default PosScreen;