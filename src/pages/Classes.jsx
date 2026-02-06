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
  "Creche",
  "Nursery 1",
  "Nursery 2",
  "Nursery 3",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
];


  const { className, numberOfStudents } = formData;
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing && currentClassId) {
      const classToEdit = (state.classes || []).find((cls) => cls.id === currentClassId);
      if (classToEdit) {
        setFormData({
          className: classToEdit.className || "",
          numberOfStudents: classToEdit.numberOfStudents || "",
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
      const trimmedName = (className || "").trim();
      if (!trimmedName) {
        toast.error("Please provide a class name.");
        setLoading(false);
        return;
      }

      // Check duplicates, ignoring case, and ignoring the currently edited class (if any)
      const classExists = (state.classes || []).some(
        (cls) =>
          cls.className?.toLowerCase() === trimmedName.toLowerCase() &&
          (!isEditing || cls.id !== currentClassId)
      );

      if (classExists) {
        toast.error("Class already exists!");
        setLoading(false);
        return;
      }

      const classData = {
        className: trimmedName,
        // numberOfStudents is kept for backward compatibility but UI now reads live count from students
        numberOfStudents: parseInt(numberOfStudents, 10) || 0,
        timestamp: serverTimestamp(),
      };

      if (isEditing && currentClassId) {
        await updateDoc(
          doc(db, "schools", state.selectedSchoolId, "classes", currentClassId),
          classData
        );
        toast.success("Class updated successfully!");
      } else {
        const classId = `${Date.now()}`;
        await setDoc(
          doc(db, "schools", state.selectedSchoolId, "classes", classId),
          classData
        );
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
    const ok = window.confirm(
      "Are you sure you want to delete this class? This action cannot be undone."
    );
    if (!ok) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "schools", state.selectedSchoolId, "classes", classId));
      toast.success("Class deleted successfully!");
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentClassId(null);
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
    // Prefer not to reload - context should be real-time; provide manual refresh fallback
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

  // Sort classes based on the order in classOptions (safeguard missing names)
  const sortedClasses = [...(state.classes || [])].sort((a, b) => {
    const ia = classOrderMap.hasOwnProperty(a.className) ? classOrderMap[a.className] : 999;
    const ib = classOrderMap.hasOwnProperty(b.className) ? classOrderMap[b.className] : 999;
    return ia - ib;
  });

  // New: compute live student count for a given class name using state.students (keeps in sync with real-time updates)
  const countStudentsForClass = (classItem) => {
    if (!classItem || !classItem.className) return 0;
    const students = state.students || [];
    // match by class name (case-insensitive, trimmed) to be robust
    const target = classItem.className.trim().toLowerCase();
    return students.filter((s) => (s.class || "").trim().toLowerCase() === target).length;
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center m-4">
          <button onClick={handleReload} className="p-2 bg-gray-200 rounded">
            Reload
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold">Classes</h1>
          </div>
          <button onClick={() => navigate("/")} className="p-2 bg-gray-200 rounded">
            Back
          </button>
        </div>

        {/* Modal for Adding/Editing Class */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
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
                  <option value="" disabled>
                    Select Class
                  </option>
                  {classOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                {/* numberOfStudents remains editable for legacy reasons, but UI will show live count */}
                <input
                  type="number"
                  id="numberOfStudents"
                  placeholder="Stored Number of Students (optional)"
                  value={numberOfStudents}
                  onChange={onChange}
                  className="border p-2 w-full mb-4 rounded"
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md relative">
              {/* Close Button */}
              <button onClick={handleCloseDetails} className="absolute top-4 right-4 text-gray-600">
                <MdClose size={24} />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold">{selectedClass.className}</h2>
                <p className="text-gray-700">
                  Number of Students: {countStudentsForClass(selectedClass)}
                </p>
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
                key={cls.id ?? index}
                onClick={() => handleRowClick(cls)}
                className="border cursor-pointer hover:bg-gray-100"
              >
                <td className="border px-4 py-2">{index + 1}</td>
                <td className="border px-4 py-2">{cls.className}</td>

                {/* Live count derived from state.students */}
                <td className="border px-4 py-2">
                  {countStudentsForClass(cls)}
                </td>

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
            onClick={() => {
              setIsModalOpen(true);
              setIsEditing(false);
              setCurrentClassId(null);
              setFormData({ className: "", numberOfStudents: "" });
            }}
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
            onClick={() => navigate("/posscreen")}
            className="bg-red-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-red-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-red-800"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    </>
  );
}