import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, serverTimestamp, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useMyContext } from "../Context/MyContext";
import Spinner from "../components/Spinner";

export default function Classes() {
  const { state } = useMyContext();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClassId, setCurrentClassId] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  const [formData, setFormData] = useState({
    className: "",
    numberOfStudents: "",
  });

  const classOptions = [
    "Daycare",
    "Preschool One",
    "Preschool Two",
    "Preschool Three",
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
  ];

  const { className, numberOfStudents } = formData;
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing && currentClassId) {
      const classToEdit = state.classes.find((cls) => cls.id === currentClassId);
      if (classToEdit) {
        setFormData({
          className: classToEdit.className,
          numberOfStudents: classToEdit.numberOfStudents,
        });
      }
    }
  }, [isEditing, currentClassId, state.classes]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if the class already exists
      const classExists = state.classes.some(cls => cls.className === className.trim());
      if (classExists) {
        toast.error("Class already exists!");
        setLoading(false);
        return;
      }

      const classData = {
        className: className.trim(),
        numberOfStudents: parseInt(numberOfStudents, 10),
        timestamp: serverTimestamp(),
      };

      if (isEditing) {
        await updateDoc(doc(db, `schools/${state.selectedSchoolId}/classes`, currentClassId), classData);
        toast.success("Class updated successfully!");
      } else {
        const classId = `${Date.now()}`;
        await setDoc(doc(db, `schools/${state.selectedSchoolId}/classes`, classId), classData);
        toast.success("Class added successfully!");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error("Failed to save class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClass = (classId) => {
    setIsEditing(true);
    setCurrentClassId(classId);
    setIsModalOpen(true);
  };

  const handleDeleteClass = async (classId) => {
    try {
      await deleteDoc(doc(db, `schools/${state.selectedSchoolId}/classes`, classId));
      toast.success("Class deleted successfully!");
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setFormData({
      className: "",
      numberOfStudents: "",
    });
  };

  const handleRowClick = (cls) => {
    setSelectedClass(cls);
  };

  const handleCloseDetails = () => {
    setSelectedClass(null);
  };

  const handlePrintClasses = () => {
    window.print();
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (loading) {
    return <Spinner />;
  }

  // Mapping of class names to their order
  const classOrderMap = classOptions.reduce((acc, className, index) => {
    acc[className] = index;
    return acc;
  }, {});

  // Sort classes based on the order in classOptions
  const sortedClasses = [...state.classes].sort((a, b) => {
    return classOrderMap[a.className] - classOrderMap[b.className];
  });

  return (
    <>
      <div>
        <div className="flex justify-between items-center m-4">
          <button
            onClick={handleReload}
            className="p-2 bg-gray-200 rounded"
          >
            Reload
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold">Classes</h1>
          </div>
          <button
            onClick={() => navigate("/")}
            className="p-2 bg-gray-200 rounded"
          >
            Back
          </button>
        </div>

        {/* Modal for Adding/Editing Class */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{isEditing ? "Edit Class" : "Add Class"}</h2>
                <button onClick={handleCloseModal}>
                  <MdClose size={24} />
                </button>
              </div>
              <form onSubmit={onSubmit}>
                <select
                  id="className"
                  value={className}
                  onChange={onChange}
                  className="border p-2 w-full mb-4 rounded"
                  required
                >
                  <option value="" disabled>Select Class</option>
                  {classOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  id="numberOfStudents"
                  placeholder="Number of Students"
                  value={numberOfStudents}
                  onChange={onChange}
                  className="border p-2 w-full mb-4 rounded"
                  required
                />
                <button type="submit" className="bg-blue-600 text-white p-2 w-full rounded">
                  {isEditing ? "Update Class" : "Add Class"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Selected Class Details */}
        {selectedClass && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md relative">
              {/* Close Button */}
              <button onClick={handleCloseDetails} className="absolute top-4 right-4 text-gray-600">
                <MdClose size={24} />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold">{selectedClass.className}</h2>
                <p className="text-gray-700">Number of Students: {selectedClass.numberOfStudents}</p>
              </div>
            </div>
          </div>
        )}

        {/* Classes Table */}
        <table className="table-auto w-full mt-4 border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2">S/N</th>
              <th className="border px-4 py-2">Class Name</th>
              <th className="border px-4 py-2">Number of Students</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedClasses.map((cls, index) => (
              <tr
                key={index}
                onClick={() => handleRowClick(cls)}
                className="border cursor-pointer hover:bg-gray-100"
              >
                <td className="border px-4 py-2">{index + 1}</td>
                <td className="border px-4 py-2">{cls.className}</td>
                <td className="border px-4 py-2">{cls.numberOfStudents}</td>
                <td className="border px-4 py-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering row click
                      handleEditClass(cls.id);
                    }}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering row click
                      handleDeleteClass(cls.id);
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-center p-2 mb-12 space-x-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-7 py-3 text-sm font-medium rounded shadow-md hover:bg-blue-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-blue-800"
          >
            Add Class
          </button>

          <button
            onClick={handlePrintClasses}
            className="bg-green-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-green-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-green-800"
          >
            Print Classes
          </button>

          <button
            onClick={() => navigate('/posscreen')}
            className="bg-red-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-red-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-red-800"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    </>
  );
}