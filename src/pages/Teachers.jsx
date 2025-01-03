import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { storage } from "../firebase"; // Firebase Storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, serverTimestamp, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useMyContext } from "../Context/MyContext";
import Spinner from "../components/Spinner";

export default function Teachers() {
  const { state } = useMyContext();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState(null);
  const [teacherPhoto, setTeacherPhoto] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    phone: "",
    photoURL: "",
  });

  const { name, email, subject, phone } = formData;
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing && currentTeacherId) {
      const teacherToEdit = state.teachers.find((teacher) => teacher.id === currentTeacherId);
      if (teacherToEdit) {
        setFormData({
          name: teacherToEdit.name,
          email: teacherToEdit.email,
          subject: teacherToEdit.subject,
          phone: teacherToEdit.phone,
          photoURL: teacherToEdit.photoURL || "",
        });
      }
    }
  }, [isEditing, currentTeacherId, state.teachers]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  const handlePhotoChange = (e) => {
    setTeacherPhoto(e.target.files[0]);
  };

  const uploadTeacherPhoto = async () => {
    if (!teacherPhoto) return null;

    const storageRef = ref(storage, `teachers/${teacherPhoto.name}-${Date.now()}`);
    await uploadBytes(storageRef, teacherPhoto);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoURL = formData.photoURL;

      if (teacherPhoto) {
        photoURL = await uploadTeacherPhoto();
      }

      const teacherData = {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        phone: phone.trim(),
        photoURL: photoURL,
        timestamp: serverTimestamp(),
      };

      if (isEditing) {
        await updateDoc(doc(db, `schools/${state.selectedSchoolId}/teachers`, currentTeacherId), teacherData);
        toast.success("Teacher updated successfully!");
      } else {
        const teacherId = `${Date.now()}`;
        await setDoc(doc(db, `schools/${state.selectedSchoolId}/teachers`, teacherId), teacherData);
        toast.success("Teacher added successfully!");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving teacher:", error);
      toast.error("Failed to save teacher. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeacher = (teacherId) => {
    setIsEditing(true);
    setCurrentTeacherId(teacherId);
    setIsModalOpen(true);
  };
  const handleOpenModal = () => {
    setIsModalOpen(true);
  }

  const handleDeleteTeacher = async (teacherId) => {
    try {
      await deleteDoc(doc(db, `schools/${state.selectedSchoolId}/teachers`, teacherId));
      toast.success("Teacher deleted successfully!");
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.error("Failed to delete teacher. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setTeacherPhoto(null);
    setFormData({
      name: "",
      email: "",
      subject: "",
      phone: "",
      photoURL: "",
    });
  };


  const handleRowClick = (teacher) => {
    setSelectedTeacher(teacher);
  };

  const handleCloseDetails = () => {
    setSelectedTeacher(null);
  };

  const handlePrintUsers = () => {
    window.print();
  };

  if (loading) {
    return <Spinner />;
  }

  const handleReload = () => {
    window.location.reload();
  };

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
          <h1 className="text-xl font-bold">Teachers</h1>
        </div>
        <button
          onClick={() => navigate("/posscreen")}
          className="p-2 bg-gray-200 rounded"
        >
          Back
        </button>
      </div>

      {/* Modal for Adding/Editing Teacher */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{isEditing ? "Edit Teacher" : "Add Teacher"}</h2>
              <button onClick={handleCloseModal}>
                <MdClose size={24} />
              </button>
            </div>
            <form onSubmit={onSubmit}>
              <input
                type="text"
                id="name"
                placeholder="Full Name"
                value={name}
                onChange={onChange}
                className="border p-2 w-full mb-4 rounded"
                required
              />
              <input
                type="email"
                id="email"
                placeholder="Email"
                value={email}
                onChange={onChange}
                className="border p-2 w-full mb-4 rounded"
                required
              />
              <input
                type="text"
                id="subject"
                placeholder="Subject"
                value={subject}
                onChange={onChange}
                className="border p-2 w-full mb-4 rounded"
                required
              />
              <input
                type="text"
                id="phone"
                placeholder="Phone Number"
                value={phone}
                onChange={onChange}
                className="border p-2 w-full mb-4 rounded"
                required
              />
              <input type="file" onChange={handlePhotoChange} className="mb-4" />
              <button type="submit" className="bg-blue-600 text-white p-2 w-full rounded">
                {isEditing ? "Update Teacher" : "Add Teacher"}
              </button>
            </form>
          </div>
        </div>
      )}

     {/* function TeacherDetailsModal({ selectedTeacher, setSelectedTeacher }) {
  // Function to close the modal
  //  handleCloseDetails = () => {
  //   setSelectedTeacher(null); // Reset the selected teacher to close the modal
  // };

  return ( */}
    <>
      {/* Selected Teacher Details */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md relative">
            {/* Close Button */}
            <button onClick={handleCloseDetails} className="absolute top-4 right-4 text-gray-600">
              <MdClose size={24} />
            </button>
            <div className="text-center">
              <img
                src={selectedTeacher.photoURL || "https://via.placeholder.com/150"}
                alt={selectedTeacher.name}
                className="w-24 h-24 object-cover rounded-full mx-auto mb-4"
              />
              <h2 className="text-xl font-bold">{selectedTeacher.name}</h2>
              <p className="text-gray-700">{selectedTeacher.subject}</p>
              <p className="text-gray-700">{selectedTeacher.email}</p>
              <p className="text-gray-700">{selectedTeacher.phone}</p>
              <p className="text-gray-700">Sex: {selectedTeacher.sex || "Not Specified"}</p>
            </div>
          </div>
        </div>
      )}
    </>
  


      {/* Teachers Table */}
      <table className="table-auto w-full mt-4 border">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2">Photo</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">class</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Subject</th>
            <th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
  {state.teachers.map((teacher, index) => (
    <tr
      key={index}
      onClick={() => handleRowClick(teacher)}
      className="border cursor-pointer hover:bg-gray-100"
    >
      <td className="px-4 py-2">
        {teacher.photoURL ? (
          <img
            src={teacher.photoURL}
            alt={teacher.name}
            className="w-12 h-12 object-cover rounded-full"
          />
        ) : (
          <span className="text-gray-500">No Photo</span>
        )}
      </td>
      <td className="px-4 py-2">{teacher.name}</td>
      <td className="px-4 py-2">{teacher.class}</td>
      <td className="px-4 py-2">{teacher.email}</td>
      <td className="px-4 py-2">{teacher.subject}</td>
      <td className="px-4 py-2">{teacher.phone}</td>
      <td className="px-4 py-2">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering row click
            handleEditTeacher(teacher.id);
          }}
          className="bg-yellow-500 text-white px-2 py-1 rounded"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering row click
            handleDeleteTeacher(teacher.id);
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
            onClick={handleOpenModal}
            className="bg-blue-600 text-white px-7 py-3 text-sm font-medium rounded shadow-md hover:bg-blue-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-blue-800"
          >
            Add Teacher
          </button>

          <button
            onClick={handlePrintUsers}
            className="bg-green-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-green-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-green-800"
          >
            Print Teachers
          </button>

          {/* New Sign In Button */}
          <button
            onClick={() => navigate('/')} // Using navigate to redirect to Sign In
            className="bg-red-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-red-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-red-800"
          >
            Go to Sign In
          </button>
        </div>
    </div>
    </>
  );
}
