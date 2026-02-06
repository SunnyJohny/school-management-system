import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { storage } from "../firebase"; // Firebase Storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  doc,
  serverTimestamp,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { useMyContext } from "../Context/MyContext";
import Spinner from "../components/Spinner";

// Firebase Auth (for creating email/password accounts)
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

export default function Users() {
  const { state } = useMyContext();

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [userPhoto, setUserPhoto] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // ✅ Password visibility
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", // ✅ NEW
    role: "", // Admin / Teacher / Accountant / Staff etc
    phone: "",
    sex: "",
    photoURL: "",
  });

  const { name, email, password, role, phone, sex } = formData;
  const navigate = useNavigate();

  // Prefill form when editing
  useEffect(() => {
    if (isEditing && currentUserId) {
      const userToEdit = (state.users || []).find(
        (u) => u.id === currentUserId
      );
      if (userToEdit) {
        setFormData({
          name: userToEdit.name || "",
          email: userToEdit.email || "",
          password: "", // ✅ never prefill password
          role: userToEdit.role || "",
          phone: userToEdit.phone || "",
          sex: userToEdit.sex || "",
          photoURL: userToEdit.photoURL || "",
        });
      }
    }
  }, [isEditing, currentUserId, state.users]);

  const onChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handlePhotoChange = (e) => {
    setUserPhoto(e.target.files[0]);
  };

  const uploadUserPhoto = async () => {
    if (!userPhoto) return null;

    const storageRef = ref(storage, `users/${userPhoto.name}-${Date.now()}`);
    await uploadBytes(storageRef, userPhoto);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!state.selectedSchoolId) {
        toast.error("Please select a school first.");
        setLoading(false);
        return;
      }

      // Validate required sex field
      if (!sex || !sex.trim()) {
        toast.error("Please select sex for the user.");
        setLoading(false);
        return;
      }

      // Validate role
      if (!role || !role.trim()) {
        toast.error("Please select a role for the user.");
        setLoading(false);
        return;
      }

      // Password required only when adding
      if (!isEditing) {
        if (!password || password.length < 6) {
          toast.error("Password is required (min 6 characters).");
          setLoading(false);
          return;
        }
      }

      let photoURL = formData.photoURL;

      if (userPhoto) {
        photoURL = await uploadUserPhoto();
      }

      // Firestore path
      const basePath = `schools/${state.selectedSchoolId}/users`;

      if (isEditing && currentUserId) {
        // Editing: update Firestore fields only
        const userData = {
          name: name.trim(),
          email: email.trim(),
          role: role.trim(),
          phone: phone.trim(),
          sex: sex.trim(),
          photoURL: photoURL,
          updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, basePath, currentUserId), userData);
        toast.success("User updated successfully!");
        handleCloseModal();
        return;
      }

      // Adding: create Auth user + Firestore record
      const auth = getAuth();

      // NOTE: This will sign-in as the newly created user (client-side Firebase behavior)
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const authUid = cred.user.uid;
      const userId = `${Date.now()}`;

      const userData = {
        name: name.trim(),
        email: email.trim(),
        role: role.trim(),
        phone: phone.trim(),
        sex: sex.trim(),
        photoURL: photoURL,
        authUid,
        timestamp: serverTimestamp(),
      };

      await setDoc(doc(db, basePath, userId), userData);

      toast.success("User added successfully!");
      handleCloseModal();
    } catch (error) {
      console.error("Error saving user:", error);

      const msg =
        error?.code === "auth/email-already-in-use"
          ? "That email is already in use."
          : error?.code === "auth/invalid-email"
          ? "Invalid email address."
          : error?.code === "auth/weak-password"
          ? "Password is too weak (min 6 characters)."
          : "Failed to save user. Please try again.";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userId) => {
    setIsEditing(true);
    setCurrentUserId(userId);
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setCurrentUserId(null);
    setShowPassword(false);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "",
      phone: "",
      sex: "",
      photoURL: "",
    });
  };

  const handleDeleteUser = async (userId) => {
    const ok = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );
    if (!ok) return;

    try {
      const basePath = `schools/${state.selectedSchoolId}/users`;
      await deleteDoc(doc(db, basePath, userId));
      toast.success("User deleted successfully!");
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user. Please try again.");
    }
  };

  // "Deactivate" (moves to deactivatedUsers)
  const handleDeactivateUser = async (user) => {
    const ok = window.confirm(
      `Are you sure you want to deactivate ${user.name}? This will move the user to the 'deactivated' collection.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const deactivatedData = {
        ...user,
        deactivatedAt: serverTimestamp(),
        originalUserId: user.id || null,
      };

      const deactivatedPath = `schools/${state.selectedSchoolId}/deactivatedUsers`;
      const usersPath = `schools/${state.selectedSchoolId}/users`;

      await setDoc(
        doc(db, deactivatedPath, user.id || `${Date.now()}`),
        deactivatedData
      );

      if (user.id) {
        await deleteDoc(doc(db, usersPath, user.id));
      }

      if (selectedUser?.id === user.id) setSelectedUser(null);
      toast.success(`${user.name} deactivated and moved to records.`);
    } catch (err) {
      console.error("Deactivate action failed:", err);
      toast.error("Failed to process deactivation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setUserPhoto(null);
    setShowPassword(false);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "",
      phone: "",
      sex: "",
      photoURL: "",
    });
  };

  const handleRowClick = (user) => {
    setSelectedUser(user);
  };

  const handleCloseDetails = () => {
    setSelectedUser(null);
  };

  const handlePrintUsers = () => {
    window.print();
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      <div>
        <div className="flex justify-between items-center m-4">
          <button onClick={handleReload} className="p-2 bg-gray-200 rounded">
            Reload
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold">Users</h1>
          </div>
          <button
            onClick={() => navigate("/posscreen")}
            className="p-2 bg-gray-200 rounded"
          >
            Back
          </button>
        </div>

        {/* Modal for Adding/Editing User */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {isEditing ? "Edit User" : "Add User"}
                </h2>
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

                {/* ✅ Password ONLY when adding */}
                {!isEditing && (
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        placeholder="Password (min 6 chars)"
                        value={password}
                        onChange={onChange}
                        className="border p-2 w-full rounded pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sm bg-gray-200 px-2 py-1 rounded"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  id="phone"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={onChange}
                  className="border p-2 w-full mb-4 rounded"
                  required
                />

                {/* Role field */}
                <select
                  id="role"
                  value={role}
                  onChange={onChange}
                  className="border p-2 w-full mb-4 rounded"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Admin">Admin</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Staff">Staff</option>
                </select>

                {/* Sex field */}
                <select
                  id="sex"
                  value={sex}
                  onChange={onChange}
                  className="border p-2 w-full mb-4 rounded"
                  required
                >
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>

                <input
                  type="file"
                  onChange={handlePhotoChange}
                  className="mb-4"
                />

                <button
                  type="submit"
                  className="bg-blue-600 text-white p-2 w-full rounded"
                >
                  {isEditing ? "Update User" : "Add User"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Selected User Details */}
        {selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md relative">
              <button
                onClick={handleCloseDetails}
                className="absolute top-4 right-4 text-gray-600"
              >
                <MdClose size={24} />
              </button>

              <div className="text-center">
                <img
                  src={
                    selectedUser.photoURL || "https://via.placeholder.com/150"
                  }
                  alt={selectedUser.name}
                  className="w-24 h-24 object-cover rounded-full mx-auto mb-4"
                />
                <h2 className="text-xl font-bold">{selectedUser.name}</h2>
                <p className="text-gray-700">Role: {selectedUser.role}</p>
                <p className="text-gray-700">{selectedUser.email}</p>
                <p className="text-gray-700">{selectedUser.phone}</p>
                <p className="text-gray-700">
                  Sex: {selectedUser.sex || "Not Specified"}
                </p>

                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => handleEditUser(selectedUser.id)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </button>

                  <button
                    onClick={() => handleDeactivateUser(selectedUser)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <table className="table-auto w-full mt-4 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2">Photo</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Sex</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {(state.users || []).map((user, index) => (
              <tr
                key={user.id ?? index}
                onClick={() => handleRowClick(user)}
                className="border cursor-pointer hover:bg-gray-100"
              >
                <td className="px-4 py-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.name}
                      className="w-12 h-12 object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-gray-500">No Photo</span>
                  )}
                </td>

                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.sex || "Not Specified"}</td>
                <td className="px-4 py-2">{user.role || "Not Specified"}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.phone}</td>

                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditUser(user.id);
                    }}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUser(user.id);
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeactivateUser(user);
                    }}
                    className="bg-indigo-600 text-white px-2 py-1 rounded"
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Buttons beneath */}
        <div className="flex justify-center p-2 mb-12 space-x-4">
          <button
            onClick={handleOpenModal}
            className="bg-blue-600 text-white px-7 py-3 text-sm font-medium rounded shadow-md hover:bg-blue-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-blue-800"
          >
            Add User
          </button>

          <button
            onClick={handlePrintUsers}
            className="bg-green-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-green-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-green-800"
          >
            Print Users
          </button>

          <button
            onClick={() => navigate("/")}
            className="bg-red-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-red-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-red-800"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    </>
  );
}
