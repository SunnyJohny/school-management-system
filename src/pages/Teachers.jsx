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

export default function Teachers() {
  const { state } = useMyContext();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState(null);
  const [teacherPhoto, setTeacherPhoto] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [formData, setFormData] = useState({
    // Core
    staffId: "",
    name: "",
    email: "",
    phone: "",
    sex: "",
    className: "",
    photoURL: "",

    // Biodata
    dob: "",
    maritalStatus: "",
    nationality: "Nigerian",
    stateOfOrigin: "",
    lga: "",
    religion: "",
    qualification: "",
    employmentType: "",
    salary: "",

    // Address
    address: "",

    // IDs
    nin: "",

    // Next of Kin
    nextOfKinName: "",
    nextOfKinPhone: "",
    nextOfKinRelationship: "",

    // Emergency Contact
    emergencyName: "",
    emergencyPhone: "",

    // Guarantor
    guarantorName: "",
    guarantorPhone: "",
    guarantorAddress: "",
    guarantorRelationship: "",

    // Bank Details
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
  });

  const {
    staffId,
    name,
    email,
    phone,
    sex,
    className,
    dob,
    maritalStatus,
    nationality,
    stateOfOrigin,
    lga,
    religion,
    qualification,
    employmentType,
    salary,
    address,
    nin,
    nextOfKinName,
    nextOfKinPhone,
    nextOfKinRelationship,
    emergencyName,
    emergencyPhone,
    guarantorName,
    guarantorPhone,
    guarantorAddress,
    guarantorRelationship,
    bankName,
    bankAccountName,
    bankAccountNumber,
  } = formData;

  const navigate = useNavigate();

  const classesList = Array.isArray(state?.classes) ? state.classes : [];
  const getClassLabel = (c) =>
    c?.name || c?.className || c?.title || c?.level || c?.id || "";

  const resetForm = () => {
    setTeacherPhoto(null);
    setFormData({
      staffId: "",
      name: "",
      email: "",
      phone: "",
      sex: "",
      className: "",
      photoURL: "",

      dob: "",
      maritalStatus: "",
      nationality: "Nigerian",
      stateOfOrigin: "",
      lga: "",
      religion: "",
      qualification: "",
      employmentType: "",
      salary: "",

      address: "",

      nin: "",

      nextOfKinName: "",
      nextOfKinPhone: "",
      nextOfKinRelationship: "",

      emergencyName: "",
      emergencyPhone: "",

      guarantorName: "",
      guarantorPhone: "",
      guarantorAddress: "",
      guarantorRelationship: "",

      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
    });
  };

  useEffect(() => {
    if (isEditing && currentTeacherId) {
      const teacherToEdit = (state.teachers || []).find(
        (teacher) => teacher.id === currentTeacherId,
      );

      if (teacherToEdit) {
        setFormData({
          staffId: teacherToEdit.staffId || "",
          name: teacherToEdit.name || "",
          email: teacherToEdit.email || "",
          phone: teacherToEdit.phone || "",
          sex: teacherToEdit.sex || "",
          className: teacherToEdit.className || teacherToEdit.class || "",
          photoURL: teacherToEdit.photoURL || "",

          dob: teacherToEdit.dob || "",
          maritalStatus: teacherToEdit.maritalStatus || "",
          nationality: teacherToEdit.nationality || "Nigerian",
          stateOfOrigin: teacherToEdit.stateOfOrigin || "",
          lga: teacherToEdit.lga || "",
          religion: teacherToEdit.religion || "",
          qualification: teacherToEdit.qualification || "",
          employmentType: teacherToEdit.employmentType || "",
          salary:
            typeof teacherToEdit.salary !== "undefined" &&
            teacherToEdit.salary !== null
              ? String(teacherToEdit.salary)
              : "",

          address: teacherToEdit.address || "",

          nin: teacherToEdit.nin || "",

          nextOfKinName: teacherToEdit.nextOfKinName || "",
          nextOfKinPhone: teacherToEdit.nextOfKinPhone || "",
          nextOfKinRelationship: teacherToEdit.nextOfKinRelationship || "",

          emergencyName: teacherToEdit.emergencyName || "",
          emergencyPhone: teacherToEdit.emergencyPhone || "",

          guarantorName: teacherToEdit.guarantorName || "",
          guarantorPhone: teacherToEdit.guarantorPhone || "",
          guarantorAddress: teacherToEdit.guarantorAddress || "",
          guarantorRelationship: teacherToEdit.guarantorRelationship || "",

          bankName: teacherToEdit.bankName || "",
          bankAccountName: teacherToEdit.bankAccountName || "",
          bankAccountNumber: teacherToEdit.bankAccountNumber || "",
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
    setTeacherPhoto(e.target.files?.[0] || null);
  };

  const uploadTeacherPhoto = async () => {
    if (!teacherPhoto) return null;
    const storageRef = ref(
      storage,
      `teachers/${teacherPhoto.name}-${Date.now()}`,
    );
    await uploadBytes(storageRef, teacherPhoto);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  // ✅ Optional validations: only validate if user typed something
  const isValidNIN = (v) => {
    const s = String(v || "").trim();
    if (!s) return true;
    const digits = s.replace(/\D/g, "");
    return digits.length === 11;
  };

  const isValidAccountNumber = (v) => {
    const s = String(v || "").trim();
    if (!s) return true;
    const digits = s.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 12;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ No required fields:
      // only do format validations if values are provided
      if (!isValidNIN(nin)) {
        toast.error("NIN should be 11 digits.");
        setLoading(false);
        return;
      }

      if (!isValidAccountNumber(bankAccountNumber)) {
        toast.error("Account number looks invalid (usually 10 digits).");
        setLoading(false);
        return;
      }

      let photoURL = formData.photoURL;
      if (teacherPhoto) {
        photoURL = await uploadTeacherPhoto();
      }

      const salaryNumber =
        salary === "" ? null : Number(String(salary).replace(/,/g, ""));
      const safeSalary = Number.isNaN(salaryNumber) ? null : salaryNumber;

      const teacherData = {
        staffId: staffId?.trim?.() ? staffId.trim() : "",
        name: name?.trim?.() ? name.trim() : "",
        email: email?.trim?.() ? email.trim() : "",
        phone: phone?.trim?.() ? phone.trim() : "",
        sex: sex?.trim?.() ? sex.trim() : "",
        className: className?.trim?.() ? className.trim() : "",
        photoURL: photoURL || "",

        dob: dob?.trim?.() ? dob.trim() : "",
        maritalStatus: maritalStatus?.trim?.() ? maritalStatus.trim() : "",
        nationality: nationality?.trim?.() ? nationality.trim() : "",
        stateOfOrigin: stateOfOrigin?.trim?.() ? stateOfOrigin.trim() : "",
        lga: lga?.trim?.() ? lga.trim() : "",
        religion: religion?.trim?.() ? religion.trim() : "",
        qualification: qualification?.trim?.() ? qualification.trim() : "",
        employmentType: employmentType?.trim?.() ? employmentType.trim() : "",
        salary: safeSalary,

        address: address?.trim?.() ? address.trim() : "",

        nin: nin?.trim?.() ? nin.trim() : "",

        nextOfKinName: nextOfKinName?.trim?.() ? nextOfKinName.trim() : "",
        nextOfKinPhone: nextOfKinPhone?.trim?.() ? nextOfKinPhone.trim() : "",
        nextOfKinRelationship: nextOfKinRelationship?.trim?.()
          ? nextOfKinRelationship.trim()
          : "",

        emergencyName: emergencyName?.trim?.() ? emergencyName.trim() : "",
        emergencyPhone: emergencyPhone?.trim?.() ? emergencyPhone.trim() : "",

        guarantorName: guarantorName?.trim?.() ? guarantorName.trim() : "",
        guarantorPhone: guarantorPhone?.trim?.() ? guarantorPhone.trim() : "",
        guarantorAddress: guarantorAddress?.trim?.()
          ? guarantorAddress.trim()
          : "",
        guarantorRelationship: guarantorRelationship?.trim?.()
          ? guarantorRelationship.trim()
          : "",

        bankName: bankName?.trim?.() ? bankName.trim() : "",
        bankAccountName: bankAccountName?.trim?.()
          ? bankAccountName.trim()
          : "",
        bankAccountNumber: bankAccountNumber?.trim?.()
          ? bankAccountNumber.trim()
          : "",

        timestamp: serverTimestamp(),
      };

      if (isEditing && currentTeacherId) {
        await updateDoc(
          doc(db, `schools/${state.selectedSchoolId}/teachers`, currentTeacherId),
          teacherData,
        );
        toast.success("Teacher updated successfully!");
      } else {
        const teacherId = `${Date.now()}`;
        await setDoc(
          doc(db, `schools/${state.selectedSchoolId}/teachers`, teacherId),
          teacherData,
        );
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
    setIsEditing(false);
    setCurrentTeacherId(null);
    resetForm();
  };

  const handleDeleteTeacher = async (teacherId) => {
    const ok = window.confirm(
      "Are you sure you want to delete this teacher? This action cannot be undone.",
    );
    if (!ok) return;

    try {
      await deleteDoc(
        doc(db, `schools/${state.selectedSchoolId}/teachers`, teacherId),
      );
      toast.success("Teacher deleted successfully!");
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.error("Failed to delete teacher. Please try again.");
    }
  };

  const handleResignTeacher = async (teacher) => {
    const ok = window.confirm(
      `Are you sure ${teacher.name} is resigning? This will move the teacher to the 'resigned' collection.`,
    );
    if (!ok) return;

    setLoading(true);
    try {
      const resignData = {
        ...teacher,
        resignedAt: serverTimestamp(),
        originalTeacherId: teacher.id || null,
      };

      await setDoc(
        doc(
          db,
          `schools/${state.selectedSchoolId}/resigned`,
          teacher.id || `${Date.now()}`,
        ),
        resignData,
      );

      if (teacher.id) {
        await deleteDoc(
          doc(db, `schools/${state.selectedSchoolId}/teachers`, teacher.id),
        );
      }

      if (selectedTeacher?.id === teacher.id) setSelectedTeacher(null);
      toast.success(`${teacher.name} resigned and moved to 'resigned' records.`);
    } catch (err) {
      console.error("Resign action failed:", err);
      toast.error("Failed to process resignation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    resetForm();
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

  if (loading) return <Spinner />;

  const handleReload = () => window.location.reload();

  const short = (text, n = 18) => {
    const s = String(text || "");
    if (!s) return "-";
    if (s.length <= n) return s;
    return `${s.slice(0, n)}...`;
  };

  const teacherClassLabel =
    selectedTeacher?.className || selectedTeacher?.class || "";

  // ✅ Responsive "stacked cards" for mobile
  const TeacherMobileCard = ({ teacher, index }) => {
    return (
      <div
        onClick={() => handleRowClick(teacher)}
        className="border rounded-lg p-3 bg-white shadow-sm cursor-pointer hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          {teacher.photoURL ? (
            <img
              src={teacher.photoURL}
              alt={teacher.name || "Teacher"}
              className="w-12 h-12 object-cover rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
              No Photo
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm">{teacher.name || "-"}</p>
              <span className="text-xs text-gray-500">#{index + 1}</span>
            </div>

            <p className="text-xs text-gray-600">
              <span className="font-medium">Class:</span>{" "}
              {teacher.className || teacher.class || "-"}{" "}
              <span className="ml-2 font-medium">Sex:</span> {teacher.sex || "-"}
            </p>

            <p className="text-xs text-gray-600">
              <span className="font-medium">Phone:</span> {teacher.phone || "-"}
            </p>

            <p className="text-xs text-gray-600">
              <span className="font-medium">Email:</span>{" "}
              {short(teacher.email, 22)}
            </p>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-700">
          <p>
            <span className="font-medium">NIN:</span> {teacher.nin || "-"}
          </p>
          <p>
            <span className="font-medium">Bank:</span> {teacher.bankName || "-"}
          </p>
          <p className="col-span-2">
            <span className="font-medium">Address:</span>{" "}
            <span title={teacher.address || ""}>
              {short(teacher.address, 40)}
            </span>
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditTeacher(teacher.id);
            }}
            className="bg-yellow-500 text-white px-3 py-1 rounded text-xs"
          >
            Edit
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTeacher(teacher.id);
            }}
            className="bg-red-500 text-white px-3 py-1 rounded text-xs"
          >
            Delete
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResignTeacher(teacher);
            }}
            className="bg-indigo-600 text-white px-3 py-1 rounded text-xs"
          >
            Resign
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div>
        {/* ✅ Responsive header */}
        <div className="m-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center justify-between gap-2">
              <button onClick={handleReload} className="p-2 bg-gray-200 rounded">
                Reload
              </button>

              <button
                onClick={() => navigate("/posscreen")}
                className="p-2 bg-gray-200 rounded sm:hidden"
              >
                Back
              </button>
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold">Teachers</h1>
              <p className="text-xs text-gray-500">
                Total: {Number((state.teachers || []).length).toLocaleString()}
              </p>
            </div>

            <div className="hidden sm:flex justify-end">
              <button
                onClick={() => navigate("/posscreen")}
                className="p-2 bg-gray-200 rounded"
              >
                Back
              </button>
            </div>
          </div>

          {/* ✅ action buttons wrap on small screens */}
          <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-end">
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 text-white px-5 py-2 text-sm font-medium rounded shadow-md hover:bg-blue-700 transition"
            >
              Add Teacher
            </button>

            <button
              onClick={handlePrintUsers}
              className="bg-green-600 text-white px-5 py-2 text-sm font-medium rounded shadow-md hover:bg-green-700 transition"
            >
              Print Teachers
            </button>
          </div>
        </div>

        {/* Modal for Adding/Editing Teacher */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-3">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {isEditing ? "Edit Teacher" : "Add Teacher"}
                </h2>
                <button onClick={handleCloseModal}>
                  <MdClose size={24} />
                </button>
              </div>

              <form onSubmit={onSubmit}>
                {/* ✅ Responsive form grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    id="staffId"
                    placeholder="Staff ID (optional)"
                    value={staffId}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />

                  <input
                    type="text"
                    id="name"
                    placeholder="Full Name"
                    value={name}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />

                  <input
                    type="email"
                    id="email"
                    placeholder="Email"
                    value={email}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />

                  <input
                    type="text"
                    id="phone"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />

                  <select
                    id="sex"
                    value={sex}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  >
                    <option value="">Select Sex (optional)</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>

                  <select
                    id="className"
                    value={className}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  >
                    <option value="">Select Class (optional)</option>
                    {classesList.map((c, idx) => {
                      const label = getClassLabel(c);
                      const value = label;
                      return (
                        <option key={c?.id || label || idx} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Biodata */}
                <div className="mt-4 border rounded p-3">
                  <p className="font-semibold mb-3">Biodata</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      id="dob"
                      value={dob}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />

                    <select
                      id="maritalStatus"
                      value={maritalStatus}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    >
                      <option value="">Marital Status (optional)</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>

                    <input
                      type="text"
                      id="nationality"
                      placeholder="Nationality"
                      value={nationality}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />

                    <input
                      type="text"
                      id="stateOfOrigin"
                      placeholder="State of Origin"
                      value={stateOfOrigin}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />

                    <input
                      type="text"
                      id="lga"
                      placeholder="LGA"
                      value={lga}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />

                    <input
                      type="text"
                      id="religion"
                      placeholder="Religion"
                      value={religion}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />

                    <input
                      type="text"
                      id="qualification"
                      placeholder="Qualification (e.g. B.Ed, NCE)"
                      value={qualification}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />

                    <select
                      id="employmentType"
                      value={employmentType}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    >
                      <option value="">Employment Type (optional)</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>

                    <input
                      type="number"
                      id="salary"
                      placeholder="Salary (optional)"
                      value={salary}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />

                    <input
                      type="text"
                      id="nin"
                      placeholder="NIN (11 digits) - optional"
                      value={nin}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="mt-4">
                  <textarea
                    id="address"
                    placeholder="Full Address (optional)"
                    value={address}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                    rows={3}
                  />
                </div>

                {/* Next of Kin */}
                <div className="mt-4 border rounded p-3">
                  <p className="font-semibold mb-3">Next of Kin (optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      id="nextOfKinName"
                      placeholder="Next of Kin Name"
                      value={nextOfKinName}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                    <input
                      type="text"
                      id="nextOfKinPhone"
                      placeholder="Next of Kin Phone"
                      value={nextOfKinPhone}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                    <input
                      type="text"
                      id="nextOfKinRelationship"
                      placeholder="Relationship"
                      value={nextOfKinRelationship}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>
                </div>

                {/* Emergency */}
                <div className="mt-4 border rounded p-3">
                  <p className="font-semibold mb-3">
                    Emergency Contact (optional)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      id="emergencyName"
                      placeholder="Emergency Contact Name"
                      value={emergencyName}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                    <input
                      type="text"
                      id="emergencyPhone"
                      placeholder="Emergency Contact Phone"
                      value={emergencyPhone}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>
                </div>

                {/* Guarantor */}
                <div className="mt-4 border rounded p-3">
                  <p className="font-semibold mb-3">Guarantor (optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      id="guarantorName"
                      placeholder="Guarantor Name"
                      value={guarantorName}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                    <input
                      type="text"
                      id="guarantorPhone"
                      placeholder="Guarantor Phone"
                      value={guarantorPhone}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                    <input
                      type="text"
                      id="guarantorRelationship"
                      placeholder="Relationship (optional)"
                      value={guarantorRelationship}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>

                  <textarea
                    id="guarantorAddress"
                    placeholder="Guarantor Address (optional)"
                    value={guarantorAddress}
                    onChange={onChange}
                    className="border p-2 w-full rounded mt-3"
                    rows={2}
                  />
                </div>

                {/* Bank */}
                <div className="mt-4 border rounded p-3">
                  <p className="font-semibold mb-3">Bank Details (optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      id="bankName"
                      placeholder="Bank Name"
                      value={bankName}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                    <input
                      type="text"
                      id="bankAccountName"
                      placeholder="Account Name"
                      value={bankAccountName}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                    <input
                      type="text"
                      id="bankAccountNumber"
                      placeholder="Account Number"
                      value={bankAccountNumber}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>
                </div>

                {/* Photo */}
                <div className="mt-4">
                  <input
                    type="file"
                    onChange={handlePhotoChange}
                    className="mb-4"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 text-white p-2 w-full rounded"
                >
                  {isEditing ? "Update Teacher" : "Add Teacher"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Row click modal */}
        {selectedTeacher && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-3">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl relative max-h-[85vh] overflow-y-auto">
              <button
                onClick={handleCloseDetails}
                className="absolute top-4 right-4 text-gray-600"
              >
                <MdClose size={24} />
              </button>

              <div className="text-center">
                <img
                  src={
                    selectedTeacher.photoURL || "https://via.placeholder.com/150"
                  }
                  alt={selectedTeacher.name || "Teacher"}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full mx-auto mb-3"
                />
                <h2 className="text-lg sm:text-xl font-bold">
                  {selectedTeacher.name || "-"}
                </h2>
                <p className="text-gray-700 text-sm">{selectedTeacher.email || "-"}</p>
                <p className="text-gray-700 text-sm">{selectedTeacher.phone || "-"}</p>
                <p className="text-gray-700 text-sm">
                  Sex: {selectedTeacher.sex || "-"} | Class:{" "}
                  {teacherClassLabel || "-"}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="border rounded p-3">
                  <p className="font-semibold mb-2">Biodata</p>
                  <p>
                    <strong>Staff ID:</strong> {selectedTeacher.staffId || "-"}
                  </p>
                  <p>
                    <strong>DOB:</strong> {selectedTeacher.dob || "-"}
                  </p>
                  <p>
                    <strong>Marital Status:</strong>{" "}
                    {selectedTeacher.maritalStatus || "-"}
                  </p>
                  <p>
                    <strong>Nationality:</strong> {selectedTeacher.nationality || "-"}
                  </p>
                  <p>
                    <strong>State of Origin:</strong>{" "}
                    {selectedTeacher.stateOfOrigin || "-"}
                  </p>
                  <p>
                    <strong>LGA:</strong> {selectedTeacher.lga || "-"}
                  </p>
                  <p>
                    <strong>Religion:</strong> {selectedTeacher.religion || "-"}
                  </p>
                  <p>
                    <strong>Qualification:</strong>{" "}
                    {selectedTeacher.qualification || "-"}
                  </p>
                  <p>
                    <strong>Employment Type:</strong>{" "}
                    {selectedTeacher.employmentType || "-"}
                  </p>
                  <p>
                    <strong>Salary:</strong>{" "}
                    {typeof selectedTeacher.salary === "number"
                      ? `₦${Number(selectedTeacher.salary || 0).toLocaleString()}`
                      : selectedTeacher.salary || "-"}
                  </p>
                  <p>
                    <strong>NIN:</strong> {selectedTeacher.nin || "-"}
                  </p>
                </div>

                <div className="border rounded p-3">
                  <p className="font-semibold mb-2">Address</p>
                  <p className="text-gray-800">{selectedTeacher.address || "-"}</p>
                </div>

                <div className="border rounded p-3">
                  <p className="font-semibold mb-2">Next of Kin</p>
                  <p>
                    <strong>Name:</strong> {selectedTeacher.nextOfKinName || "-"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedTeacher.nextOfKinPhone || "-"}
                  </p>
                  <p>
                    <strong>Relationship:</strong>{" "}
                    {selectedTeacher.nextOfKinRelationship || "-"}
                  </p>
                </div>

                <div className="border rounded p-3">
                  <p className="font-semibold mb-2">Emergency Contact</p>
                  <p>
                    <strong>Name:</strong> {selectedTeacher.emergencyName || "-"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedTeacher.emergencyPhone || "-"}
                  </p>
                </div>

                <div className="border rounded p-3">
                  <p className="font-semibold mb-2">Guarantor</p>
                  <p>
                    <strong>Name:</strong> {selectedTeacher.guarantorName || "-"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedTeacher.guarantorPhone || "-"}
                  </p>
                  <p>
                    <strong>Relationship:</strong>{" "}
                    {selectedTeacher.guarantorRelationship || "-"}
                  </p>
                  <p className="mt-2">
                    <strong>Address:</strong>{" "}
                    {selectedTeacher.guarantorAddress || "-"}
                  </p>
                </div>

                <div className="border rounded p-3">
                  <p className="font-semibold mb-2">Bank Details</p>
                  <p>
                    <strong>Bank:</strong> {selectedTeacher.bankName || "-"}
                  </p>
                  <p>
                    <strong>Account Name:</strong>{" "}
                    {selectedTeacher.bankAccountName || "-"}
                  </p>
                  <p>
                    <strong>Account Number:</strong>{" "}
                    {selectedTeacher.bankAccountNumber || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => handleEditTeacher(selectedTeacher.id)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDeleteTeacher(selectedTeacher.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>

                <button
                  onClick={() => handleResignTeacher(selectedTeacher)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                  Resign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ MOBILE LIST (cards) */}
        <div className="px-4 sm:px-0 mt-4">
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {(state.teachers || []).map((t, idx) => (
              <TeacherMobileCard key={t.id ?? idx} teacher={t} index={idx} />
            ))}
            {(state.teachers || []).length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                No teachers found.
              </div>
            )}
          </div>

          {/* ✅ DESKTOP/TABLET TABLE */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="table-auto w-full mt-4 border min-w-[1100px]">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-3 py-2">Photo</th>
                  <th className="px-3 py-2">Staff ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Sex</th>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Address</th>
                  <th className="px-3 py-2">NIN</th>
                  <th className="px-3 py-2">Guarantor</th>
                  <th className="px-3 py-2">Guarantor Phone</th>
                  <th className="px-3 py-2">Bank</th>
                  <th className="px-3 py-2">Acct No</th>
                  <th className="px-3 py-2">Acct Name</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>

              <tbody>
                {(state.teachers || []).map((teacher, index) => (
                  <tr
                    key={teacher.id ?? index}
                    onClick={() => handleRowClick(teacher)}
                    className="border cursor-pointer hover:bg-gray-100"
                  >
                    <td className="px-3 py-2">
                      {teacher.photoURL ? (
                        <img
                          src={teacher.photoURL}
                          alt={teacher.name || "Teacher"}
                          className="w-10 h-10 object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-gray-500">No Photo</span>
                      )}
                    </td>

                    <td className="px-3 py-2">{teacher.staffId || "-"}</td>
                    <td className="px-3 py-2">{teacher.name || "-"}</td>
                    <td className="px-3 py-2">{teacher.sex || "-"}</td>
                    <td className="px-3 py-2">
                      {teacher.className || teacher.class || "-"}
                    </td>
                    <td className="px-3 py-2">{teacher.phone || "-"}</td>
                    <td className="px-3 py-2">{teacher.email || "-"}</td>

                    <td className="px-3 py-2" title={teacher.address || ""}>
                      {short(teacher.address, 26)}
                    </td>

                    <td className="px-3 py-2">{teacher.nin || "-"}</td>

                    <td className="px-3 py-2">
                      {teacher.guarantorName || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {teacher.guarantorPhone || "-"}
                    </td>

                    <td className="px-3 py-2">{teacher.bankName || "-"}</td>
                    <td className="px-3 py-2">
                      {teacher.bankAccountNumber || "-"}
                    </td>
                    <td
                      className="px-3 py-2"
                      title={teacher.bankAccountName || ""}
                    >
                      {short(teacher.bankAccountName, 18)}
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTeacher(teacher.id);
                          }}
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
                        >
                          Edit
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeacher(teacher.id);
                          }}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                        >
                          Delete
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResignTeacher(teacher);
                          }}
                          className="bg-indigo-600 text-white px-2 py-1 rounded text-xs"
                        >
                          Resign
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(state.teachers || []).length === 0 && (
                  <tr>
                    <td className="p-3 text-center text-gray-500" colSpan={15}>
                      No teachers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
