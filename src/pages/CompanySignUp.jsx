import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useMyContext } from "../Context/MyContext";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";

// Confirmation dialog component
const ConfirmDialog = ({ onConfirm, onCancel }) => (
  <div>
    <p>Are you sure you want to delete this school?</p>
    <div className="flex justify-around mt-4">
      <button
        onClick={onConfirm}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Yes
      </button>
      <button
        onClick={onCancel}
        className="bg-gray-300 text-black px-4 py-2 rounded"
      >
        No
      </button>
    </div>
  </div>
);

// Input field component
const InputField = ({ id, type, value, onChange, placeholder }) => (
  <input
    type={type}
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="mb-6 w-full px-4 py-2 text-xl text-gray-700 bg-white border-gray-300 rounded transition ease-in-out"
  />
);

export default function SchoolSignUp() {
  const { state, updateSelectedSchool } = useMyContext();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSchoolId, setCurrentSchoolId] = useState(null);
  const [formData, setFormData] = useState({
    schoolName: "",
    email: "",
    password: "",
    address: "",
    phoneNumber: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { schoolName, email, password, address, phoneNumber } = formData;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const auth = getAuth();

      let userId;
      if (editMode) {
        await updateDoc(doc(db, "schools", currentSchoolId), {
          schoolName,
          email,
          address,
          phoneNumber,
        });
        userId = currentSchoolId;
        toast.success("School updated successfully");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        userId = user.uid;

        await setDoc(doc(db, "schools", userId), {
          schoolName,
          email,
          address,
          phoneNumber,
          registrationDate: new Date().toISOString(),
        });

        toast.success("Sign up was successful");
      }

      updateSelectedSchool(schoolName, userId);
      closeModal();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (schoolId) => {
    toast.info(
      ({ closeToast }) => (
        <ConfirmDialog
          onConfirm={async () => {
            try {
              await deleteDoc(doc(db, "schools", schoolId));
              toast.success("School deleted successfully");
              closeToast();
            } catch {
              toast.error("Failed to delete school. Please try again later.");
            }
          }}
          onCancel={closeToast}
        />
      ),
      { position: toast.POSITION.TOP_CENTER, autoClose: false }
    );
  };

  const handleEdit = (school) => {
    setFormData({
      schoolName: school.schoolName,
      email: school.email,
      password: "", // Don't prefill passwords for security reasons
      address: school.address,
      phoneNumber: school.phoneNumber,
    });
    setCurrentSchoolId(school.id);
    setEditMode(true);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    console.log("Print functionality coming soon!");
  };

  const closeModal = () => {
    setFormData({ schoolName: "", email: "", password: "", address: "", phoneNumber: "" });
    setEditMode(false);
    setIsModalOpen(false);
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="flex justify-between items-center m-4">
        <button onClick={() => window.location.reload()} className="p-2 bg-gray-200 rounded">
          Reload
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">SCHOOLS</h1>
        <button onClick={() => navigate("/")} className="p-2 bg-gray-200 rounded">
          Back
        </button>
      </div>

      {isModalOpen && (
        <section className="flex justify-center items-center h-screen px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-600 hover:text-gray-900">
              &times;
            </button>
            <h1 className="text-3xl text-center mt-6 font-bold">
              {editMode ? "Edit School" : "School Sign Up"}
            </h1>
            <form onSubmit={handleSignUp} className="mt-8">
              <InputField id="schoolName" type="text" value={schoolName} onChange={handleChange} placeholder="School Name" />
              <InputField id="email" type="email" value={email} onChange={handleChange} placeholder="Email Address" />
              {!editMode && (
                <div className="relative mb-6">
                  <InputField
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handleChange}
                    placeholder="Password"
                  />
                  <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-2 text-gray-600">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              )}
              <InputField id="address" type="text" value={address} onChange={handleChange} placeholder="School Address" />
              <InputField id="phoneNumber" type="text" value={phoneNumber} onChange={handleChange} placeholder="School Phone Number" />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-blue-700 transition duration-150 ease-in-out"
              >
                {editMode ? "Update School" : "Sign Up"}
              </button>
            </form>
          </div>
        </section>
      )}

      {!isModalOpen && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="px-4 py-2 border">S/N</th>
                <th className="px-4 py-2 border">School Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Address</th>
                <th className="px-4 py-2 border">Phone Number</th>
                <th className="px-4 py-2 border">Registration Date</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.schools.map((school, index) => (
                <tr key={school.id}>
                  <td className="border px-4 py-2">{index + 1}</td>
                  <td className="border px-4 py-2">{school.schoolName}</td>
                  <td className="border px-4 py-2">{school.email}</td>
                  <td className="border px-4 py-2">{school.address}</td>
                  <td className="border px-4 py-2">{school.phoneNumber}</td>
                  <td className="border px-4 py-2">{school.registrationDate}</td>
                  <td className="border px-4 py-2 flex space-x-2">
                    <button onClick={() => handleEdit(school)} className="bg-yellow-500 text-white px-2 py-1 rounded">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(school.id)} className="bg-red-500 text-white px-2 py-1 rounded">
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
              className="bg-blue-600 text-white px-7 py-3 text-sm font-medium rounded shadow-md hover:bg-blue-700 transition duration-150 ease-in-out"
            >
              Add School
            </button>
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-green-700 transition duration-150 ease-in-out"
            >
              Print
            </button>
          </div>
        </div>
      )}
    </>
  );
}