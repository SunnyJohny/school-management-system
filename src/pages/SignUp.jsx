import { useState, useEffect } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import OAuth from "../components/OAuth";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { db } from "../firebase";
import { doc, serverTimestamp, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useMyContext } from '../Context/MyContext';
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";
import { MdClose } from "react-icons/md";

const ConfirmDialog = ({ onConfirm, onCancel }) => (
  <div>
    <p>Are you sure you want to delete this user?</p>
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

export const showConfirmDialog = (onConfirm) => {
  toast.info(
    ({ closeToast }) => (
      <ConfirmDialog
        onConfirm={() => {
          onConfirm();
          closeToast();
        }}
        onCancel={closeToast}
      />
    ),
    {
      position: toast.POSITION.TOP_CENTER,
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
      draggable: false,
    }
  );
};

export default function SignUp() {
  const { state } = useMyContext();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const { name, email, password, role } = formData;
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing && currentUserId) {
      const userToEdit = state.users.find((user) => user.id === currentUserId);
      if (userToEdit) {
        setFormData({
          name: userToEdit.name,
          email: userToEdit.email,
          password: userToEdit.password || "", // Password might not be stored, handle accordingly
          role: userToEdit.role,
        });
      }
    }
  }, [isEditing, currentUserId, state.users]);

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
      const auth = getAuth();

      if (isEditing) {
        const userData = {
          name: name.trim(),
          email: email.trim(),
          role: role,
          timestamp: serverTimestamp(),
        };

        await updateDoc(doc(db, `schools/${state.selectedSchoolId}/users`, currentUserId), userData);
        toast.success("User updated successfully", { position: toast.POSITION.TOP_RIGHT });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        await updateProfile(auth.currentUser, {
          displayName: name,
        });

        const user = userCredential.user;
        const userData = {
          name: name.trim(),
          email: email.trim(),
          role: role,
          timestamp: serverTimestamp(),
        };

        await setDoc(doc(db, `schools/${state.selectedSchoolId}/users`, user.uid), userData);
        toast.success("User added successfully", { position: toast.POSITION.TOP_RIGHT });
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving user: ", error);
      toast.error("Failed to save user. Please try again later.", { position: toast.POSITION.TOP_RIGHT });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    showConfirmDialog(async () => {
      try {
        const userToDelete = state.users[index];
        await deleteDoc(doc(db, `schools/${state.selectedSchoolId}/users`, userToDelete.id));

        toast.success("User deleted successfully", { position: toast.POSITION.TOP_RIGHT });
      } catch (error) {
        console.error("Error deleting user: ", error);
        toast.error("Failed to delete user. Please try again later.", { position: toast.POSITION.TOP_RIGHT });
      }
    });
  };

  const handleEditUser = (userId) => {
    setIsEditing(true);
    setCurrentUserId(userId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "",
    });
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
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
      <div className="flex justify-between items-center m-4">
        <button
          onClick={handleReload}
          className="p-2 bg-gray-200 rounded"
        >
          Reload
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold">USERS</h1>
        </div>
        <button
          onClick={() => navigate("/")}
          className="p-2 bg-gray-200 rounded"
        >
          Back
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:align-middle sm:max-w-lg sm:w-full w-full mx-4 my-8">
              <div className="bg-white p-4">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={handleCloseModal} className="text-gray-500">
                    <MdClose size={24} />
                  </button>
                </div>
                <form onSubmit={onSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={onChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={onChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div>
                  <div className="mb-4 relative">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={onChange}
                      className="border rounded-md w-full p-2"
                      required={!isEditing}
                    />
                    {showPassword ? (
                      <AiFillEyeInvisible
                        className="absolute right-3 top-10 text-xl cursor-pointer"
                        onClick={() => setShowPassword((prevState) => !prevState)}
                      />
                    ) : (
                      <AiFillEye
                        className="absolute right-3 top-10 text-xl cursor-pointer"
                        onClick={() => setShowPassword((prevState) => !prevState)}
                      />
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Role</label>
                    <select
                      id="role"
                      value={role}
                      onChange={onChange}
                      className="border rounded-md w-full p-2"
                      required
                    >
                      <option value="">Select Role</option>
                      <option value="sales rep">Sales Representative</option>
                      <option value="admin">Admin</option>
                      <option value="accountant">Accountant</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <button
                    className="w-full bg-blue-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-blue-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-blue-800"
                    type="submit"
                  >
                    {isEditing ? "Update User" : "Sign up"}
                  </button>
                  <div className="flex items-center my-4 before:border-t before:flex-1 before:border-gray-300 after:border-t after:flex-1 after:border-gray-300">
                    <p className="text-center font-semibold mx-4">OR</p>
                  </div>
                  <OAuth />
                  <div className="flex justify-between whitespace-nowrap text-sm sm:text-lg mt-4">
                    <p>
                      Have an account?
                      <Link
                        to="/sign-in"
                        className="text-red-600 hover:text-red-700 transition duration-200 ease-in-out ml-1"
                      >
                        Sign in
                      </Link>
                    </p>
                    <p>
                      <Link
                        to="/forgot-password"
                        className="text-blue-600 hover:text-blue-800 transition duration-200 ease-in-out"
                      >
                        Forgot password?
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">S/N</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">Timestamp</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.users.map((user, index) => (
              <tr key={user.id}>
                <td className="border px-4 py-2">{index + 1}</td>
                <td className="border px-4 py-2">{user.name}</td>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">{user.role}</td>
                <td className="border px-4 py-2">{new Date(user.timestamp?.toDate()).toLocaleString()}</td>
                <td className="border px-4 py-2 flex justify-around">
                  <button
                    onClick={() => handleEditUser(user.id)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
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
            Add Staff
          </button>

          <button
            onClick={handlePrintUsers}
            className="bg-green-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-green-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-green-800"
          >
            Print Users
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
