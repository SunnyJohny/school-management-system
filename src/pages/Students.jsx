import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import {
  doc,
  serverTimestamp,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { useMyContext } from "../Context/MyContext";
import Spinner from "../components/Spinner";

export default function Students() {
  const { state } = useMyContext();
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);

  const [studentPhoto, setStudentPhoto] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [isPayFeeModalOpen, setIsPayFeeModalOpen] = useState(false);

  const [paymentDetails, setPaymentDetails] = useState({
    items: [],
    totalAmount: 0,
  });

  const [currentPaymentItem, setCurrentPaymentItem] = useState({
    type: "",
    amount: "",
  });

  const [receiptData, setReceiptData] = useState(null);
  const [term, setTerm] = useState("First Term");
  const [paymentMethod, setPaymentMethod] = useState("");

  // ✅ NEW: Results states (Multiple per Grade + Term)
  const [studentResults, setStudentResults] = useState([]);
  const [resultGrade, setResultGrade] = useState("");
  const [resultTerm, setResultTerm] = useState("First Term");
  const [resultPdfFile, setResultPdfFile] = useState(null);
  const [resultUploadLoading, setResultUploadLoading] = useState(false);

  // ✅ Added guardianId + guardianName + guardianAddress + studentAge + dateOfBirth
  const [formData, setFormData] = useState({
    serialNumber: "",
    admissionNumber: "",
    name: "",
    sex: "",
    class: "",
    studentAge: "",
    dateOfBirth: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianId: "",
    guardianName: "",
    guardianAddress: "",
    photoURL: "",
  });

  const {
    admissionNumber,
    name,
    sex,
    class: studentClass,
    studentAge,
    dateOfBirth,
    guardianPhone,
    guardianEmail,
    guardianId,
    guardianName,
    guardianAddress,
  } = formData;

  const navigate = useNavigate();

  // Load existing student data for editing
  useEffect(() => {
    if (isEditing && currentStudentId) {
      const studentToEdit = (state.students || []).find(
        (student) => student.id === currentStudentId
      );
      if (studentToEdit) {
        setFormData({
          serialNumber: studentToEdit.serialNumber || "",
          admissionNumber: studentToEdit.admissionNumber || "",
          name: studentToEdit.name || "",
          sex: studentToEdit.sex || "",
          class: studentToEdit.class || "",
          studentAge: studentToEdit.studentAge || "",
          dateOfBirth: studentToEdit.dateOfBirth || "",
          guardianPhone: studentToEdit.guardianPhone || "",
          guardianEmail: studentToEdit.guardianEmail || "",
          guardianId: studentToEdit.guardianId || "",
          guardianName: studentToEdit.guardianName || "",
          guardianAddress: studentToEdit.guardianAddress || "",
          photoURL: studentToEdit.photoURL || "",
        });
      }
    }
  }, [isEditing, currentStudentId, state.students]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  const handlePhotoChange = (e) => {
    setStudentPhoto(e.target.files[0]);
  };

  const uploadStudentPhoto = async () => {
    if (!studentPhoto) return null;
    const storageRef = ref(storage, `students/${studentPhoto.name}-${Date.now()}`);
    await uploadBytes(storageRef, studentPhoto);
    return await getDownloadURL(storageRef);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Ensure parent is attached
      if (!guardianId?.trim()) {
        toast.error("Please enter/select the Parent/Guardian ID for this student.");
        setLoading(false);
        return;
      }

      let photoURL = formData.photoURL;
      if (studentPhoto) photoURL = await uploadStudentPhoto();

      const studentData = {
        serialNumber: (formData.serialNumber || "").trim(),
        admissionNumber: (admissionNumber || "").trim(),
        name: (name || "").trim(),
        sex: (sex || "").trim(),
        class: (studentClass || "").trim(),

        studentAge: String(studentAge || "").trim(),
        dateOfBirth: String(dateOfBirth || "").trim(),

        guardianPhone: (guardianPhone || "").trim(),
        guardianEmail: (guardianEmail || "").trim(),

        guardianId: (guardianId || "").trim(),
        guardianName: (guardianName || "").trim(),
        guardianAddress: (guardianAddress || "").trim(),

        photoURL: photoURL,
        timestamp: serverTimestamp(),
      };

      if (isEditing && currentStudentId) {
        await updateDoc(
          doc(db, `schools/${state.selectedSchoolId}/students`, currentStudentId),
          studentData
        );
        toast.success("Student updated successfully!");
      } else {
        const studentId = `${Date.now()}`;
        await setDoc(
          doc(db, `schools/${state.selectedSchoolId}/students`, studentId),
          studentData
        );
        toast.success("Student added successfully!");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving student:", error);
      toast.error("Failed to save student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (studentId) => {
    setIsEditing(true);
    setCurrentStudentId(studentId);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = async (studentId) => {
    const ok = window.confirm(
      "Are you sure you want to delete this student? This action cannot be undone."
    );
    if (!ok) return;

    try {
      await deleteDoc(doc(db, `schools/${state.selectedSchoolId}/students`, studentId));
      toast.success("Student deleted successfully!");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student. Please try again.");
    }
  };

  const handleGraduateStudent = async (student) => {
    const cls = (student?.class || "").trim().toLowerCase();
    if (!/grade\s*6|^6$/.test(cls)) {
      toast.error("Only Grade 6 students can be graduated.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to graduate ${student.name}? This will move the student to the 'graduates' collection.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const graduateData = {
        ...student,
        graduatedAt: serverTimestamp(),
        originalStudentId: student.id || null,
      };

      await setDoc(
        doc(db, `schools/${state.selectedSchoolId}/graduates`, student.id || `${Date.now()}`),
        graduateData
      );

      if (student.id) {
        await deleteDoc(doc(db, `schools/${state.selectedSchoolId}/students`, student.id));
      }

      if (selectedStudent?.id === student.id) setSelectedStudent(null);
      toast.success(`${student.name} graduated successfully.`);
    } catch (error) {
      console.error("Error graduating student:", error);
      toast.error("Failed to graduate student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentStudentId(null);
    setStudentPhoto(null);
    setFormData({
      serialNumber: "",
      admissionNumber: "",
      name: "",
      sex: "",
      class: "",
      studentAge: "",
      dateOfBirth: "",
      guardianPhone: "",
      guardianEmail: "",
      guardianId: "",
      guardianName: "",
      guardianAddress: "",
      photoURL: "",
    });
  };

  const handleRowClick = (student) => setSelectedStudent(student);

  const handleCloseDetails = () => {
    setSelectedStudent(null);
    setStudentResults([]);
    setResultGrade("");
    setResultTerm("First Term");
    setResultPdfFile(null);
  };

  const handlePrintStudents = () => window.print();
  const handleReload = () => window.location.reload();

  const handlePayFee = () => setIsPayFeeModalOpen(true);

  const closePayFeeModal = () => {
    setIsPayFeeModalOpen(false);
    setPaymentDetails({ items: [], totalAmount: 0 });
    setCurrentPaymentItem({ type: "", amount: "" });
    setReceiptData(null);
  };

  const handleAddPaymentItem = () => {
    const { type, amount } = currentPaymentItem;
    if (type && amount) {
      setPaymentDetails((prev) => ({
        ...prev,
        items: [...prev.items, { type, amount: parseFloat(amount) }],
        totalAmount: prev.totalAmount + parseFloat(amount),
      }));
      setCurrentPaymentItem({ type: "", amount: "" });
    } else {
      toast.error("Please fill in both type and amount fields.");
    }
  };

  // ✅ Fetch results for selected student
  const fetchStudentResults = async (studentId) => {
    try {
      if (!state.selectedSchoolId || !studentId) return;

      const resultsRef = collection(
        db,
        `schools/${state.selectedSchoolId}/students/${studentId}/results`
      );

      const q = query(resultsRef, orderBy("uploadedAt", "desc"));
      const snap = await getDocs(q);

      const results = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setStudentResults(results);
    } catch (err) {
      console.error("Error fetching student results:", err);
      toast.error("Failed to load student results.");
    }
  };

  // ✅ When a student is opened, load their results
  useEffect(() => {
    if (selectedStudent?.id) {
      fetchStudentResults(selectedStudent.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent?.id]);

  // ✅ handle pdf change
  const handleResultPdfChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed for results.");
      return;
    }
    setResultPdfFile(file);
  };

  // ✅ upload pdf to storage + save in firestore (MULTIPLE per grade+term allowed)
  const handleUploadResultPdf = async () => {
    if (!selectedStudent?.id) {
      toast.error("Select a student first.");
      return;
    }

    if (!resultGrade.trim()) {
      toast.error("Please select a grade for this result.");
      return;
    }

    if (!resultTerm.trim()) {
      toast.error("Please select a term for this result.");
      return;
    }

    if (!resultPdfFile) {
      toast.error("Please choose a scanned PDF file.");
      return;
    }

    setResultUploadLoading(true);

    try {
      const schoolId = state.selectedSchoolId;
      const studentId = selectedStudent.id;

      const cleanGrade = resultGrade.trim().replace(/\s+/g, "_");
      const cleanTerm = resultTerm.trim().replace(/\s+/g, "_");
      const safeName = resultPdfFile.name.replace(/\s+/g, "_");

      const storagePath = `schools/${schoolId}/students/${studentId}/results/${cleanGrade}/${cleanTerm}/${Date.now()}-${safeName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, resultPdfFile);
      const downloadURL = await getDownloadURL(storageRef);

      const resultsRef = collection(
        db,
        `schools/${schoolId}/students/${studentId}/results`
      );

      await addDoc(resultsRef, {
        grade: resultGrade.trim(),
        term: resultTerm.trim(),
        fileName: resultPdfFile.name,
        fileType: resultPdfFile.type,
        fileSize: resultPdfFile.size,
        url: downloadURL,
        storagePath,
        uploadedAt: serverTimestamp(),
      });

      toast.success("Result uploaded successfully!");

      // reset + refresh
      setResultGrade("");
      setResultTerm("First Term");
      setResultPdfFile(null);
      await fetchStudentResults(studentId);
    } catch (err) {
      console.error("Error uploading result pdf:", err);
      toast.error("Failed to upload result. Please try again.");
    } finally {
      setResultUploadLoading(false);
    }
  };

  // ✅ Delete a result (Firestore + Storage)
  const handleDeleteResult = async (result) => {
    if (!selectedStudent?.id) return;

    const ok = window.confirm(
      `Delete this result?\n\n${result?.grade || ""} - ${result?.term || ""}\n${result?.fileName || ""}`
    );
    if (!ok) return;

    try {
      setResultUploadLoading(true);

      const schoolId = state.selectedSchoolId;
      const studentId = selectedStudent.id;

      // delete file from storage (if storagePath exists)
      if (result?.storagePath) {
        const fileRef = ref(storage, result.storagePath);
        await deleteObject(fileRef);
      }

      // delete doc from firestore
      await deleteDoc(
        doc(db, `schools/${schoolId}/students/${studentId}/results`, result.id)
      );

      toast.success("Result deleted successfully!");
      await fetchStudentResults(studentId);
    } catch (err) {
      console.error("Error deleting result:", err);
      toast.error("Failed to delete result.");
    } finally {
      setResultUploadLoading(false);
    }
  };

  // ✅ WhatsApp share (STANDARD: open WhatsApp and let user choose contact)
  const shareResultToWhatsApp = (result) => {
    try {
      const studentName = selectedStudent?.name || "Student";
      const gradeText = result?.grade || "Grade";
      const termText = result?.term || "Term";
      const fileName = result?.fileName || "Result PDF";
      const url = result?.url || "";

      if (!url) {
        toast.error("No result link found to share.");
        return;
      }

      const message = `Hello,\n\nPlease find ${studentName}'s result.\nGrade: ${gradeText}\nTerm: ${termText}\nFile: ${fileName}\n\nDownload: ${url}`;

      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
    } catch (e) {
      console.error("WhatsApp share error:", e);
      toast.error("Failed to share to WhatsApp.");
    }
  };

  const handleSubmitPayment = async () => {
    if (paymentDetails.items.length === 0) {
      toast.error("Please add at least one item to the payment.");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        studentId: selectedStudent?.id || "N/A",
        studentName: selectedStudent?.name || "N/A",
        studentAge: selectedStudent?.studentAge || "N/A",
        dateOfBirth: selectedStudent?.dateOfBirth || "N/A",
        guardianPhone: selectedStudent?.guardianPhone || "N/A",
        guardianEmail: selectedStudent?.guardianEmail || "N/A",
        guardianId: selectedStudent?.guardianId || "N/A",
        guardianName: selectedStudent?.guardianName || "N/A",
        guardianAddress: selectedStudent?.guardianAddress || "N/A",
        studentClass: selectedStudent?.class || "N/A",
        items: paymentDetails.items,
        totalAmount: paymentDetails.totalAmount,
        timestamp: serverTimestamp(),
        paymentMethod: paymentMethod,
        term: term,
        staff: {
          id: state.user?.id || "default_staff_id",
          name: state.user?.name || "default_staff_name",
        },
      };

      const amountInWords = convertToWords(paymentData.totalAmount);
      const receiptId = `receipt_${Math.floor(Math.random() * 1000000)}`;
      const transactionDateTime = new Date().toLocaleString();

      await setDoc(
        doc(db, `schools/${state.selectedSchoolId}/payments`, receiptId),
        paymentData
      );

      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; }
            .header h2 { margin: 0; }
            .receipt-details { margin: 20px 0; }
            .table { width: 100%; border-collapse: collapse; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${state.selectedSchoolName || "School Name"}</h2>
            <h2>${state.selectedSchoolAddress || "School Address"}</h2>
            <h2>${state.selectedSchoolPhoneNumber || "School PhoneNumber"}</h2>
            <h2>${state.selectedSchoolEmail || "School Email"}</h2>
            <p>Receipt Number: ${receiptId}</p>
            <p>Date: ${transactionDateTime}</p>
          </div>
          <div class="receipt-details">
            <p><strong>Student Name:</strong> ${paymentData.studentName}</p>
            <p><strong>Student Class:</strong> ${paymentData.studentClass}</p>
            <p><strong>Student Age:</strong> ${paymentData.studentAge}</p>
            <p><strong>Date of Birth:</strong> ${paymentData.dateOfBirth}</p>
            <p><strong>Guardian Phone:</strong> ${paymentData.guardianPhone}</p>
            <p><strong>Guardian Email:</strong> ${paymentData.guardianEmail}</p>
            <p><strong>Guardian ID:</strong> ${paymentData.guardianId}</p>
            <p><strong>Guardian Name:</strong> ${paymentData.guardianName}</p>
            <p><strong>Guardian Address:</strong> ${paymentData.guardianAddress}</p>
            <p><strong>Total Amount:</strong> ₦${paymentData.totalAmount.toFixed(2)}</p>
            <p><strong>Amount in Words:</strong> ${amountInWords} Only</p>
            <p><strong>Payment Method:</strong> ${paymentData.paymentMethod}</p>
            <p><strong>Term:</strong> ${paymentData.term}</p>
          </div>
          <table class="table">
            <thead>
              <tr><th>Item</th><th>Amount (₦)</th></tr>
            </thead>
            <tbody>
              ${paymentDetails.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.type}</td>
                  <td>${Number(item.amount).toFixed(2)}</td>
                </tr>`
                )
                .join("")}
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>₦${paymentDetails.totalAmount.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          <p>Attendant: ${state.user?.name || "Staff Name"}</p>
          <div class="footer">
            <hr />
            <p style="text-align: center; font-style: italic; margin-top: 20px; font-size: 14px;">Journey to Excellence...</p>
          </div>
          <div class="footer">
            <p><em>Developer Contact : 08030611606</em></p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();

      toast.success("Payment recorded and receipt generated successfully!");
      closePayFeeModal();
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error("Failed to record payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <>
      {receiptData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-lg print:shadow-none">
            <h2 className="text-xl font-bold mb-4">Payment Receipt</h2>
            <div className="text-sm">
              <p>
                <strong>Student Name:</strong> {selectedStudent?.name || "N/A"}
              </p>
              <p>
                <strong>Admission Number:</strong>{" "}
                {selectedStudent?.admissionNumber || "N/A"}
              </p>
              <p>
                <strong>Total Amount Paid:</strong> ₦
                {receiptData?.totalAmount?.toFixed?.(2) || "0.00"}
              </p>
              <h3 className="font-semibold mt-4">Payment Details:</h3>
              <ul className="list-disc pl-6">
                {(receiptData?.items || []).map((item, index) => (
                  <li key={index}>
                    {item.type}: ₦{Number(item.amount).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => window.print()}
                className="btn-primary mr-2 print:hidden"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setReceiptData(null)}
                className="btn-secondary print:hidden"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Pay Fee Modal */}
      {isPayFeeModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg w-11/12 max-w-lg max-h-[90vh] overflow-auto p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">
                Pay Fee for {selectedStudent?.name}
              </h2>
              <MdClose
                size={24}
                onClick={closePayFeeModal}
                className="cursor-pointer text-gray-600 hover:text-gray-800"
              />
            </div>

            {/* Payment Form */}
            <div className="mb-4">
              <label className="block font-medium mb-2">Term</label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="form-control"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>

              <div className="mb-4">
                <label className="block font-medium mb-2">Payment Method</label>
                <select
                  className="input mb-2 border-2 border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="">Select Payment Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Mobile Payment">Mobile Payment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <label className="block font-medium mb-2">Payment Type</label>
              <select
                className="input mb-2 border-2 border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={currentPaymentItem.type}
                onChange={(e) =>
                  setCurrentPaymentItem((prev) => ({
                    ...prev,
                    type: e.target.value,
                  }))
                }
              >
                <option value="">Select Payment Type</option>
                <option value="School Fee">School Fee</option>
                <option value="Admission Fee">Admission Fee</option>
                <option value="Graduation Fee">Graduation Fee</option>
                <option value="Tour">Tour</option>
                <option value="Other">Other</option>
              </select>

              <input
                type="number"
                className="input mb-2 border-2 border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Amount"
                value={currentPaymentItem.amount}
                onChange={(e) =>
                  setCurrentPaymentItem((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
              />
              <button
                onClick={handleAddPaymentItem}
                className="btn-secondary mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                Add Item
              </button>
            </div>

            {/* Payment Summary */}
            <div>
              <h3 className="font-bold">Payment Items</h3>
              <ul className="list-disc pl-6 mb-4">
                {paymentDetails.items.map((item, index) => (
                  <li key={index}>
                    {item.type} - ₦{Number(item.amount).toFixed(2)}
                  </li>
                ))}
              </ul>
              <p className="font-bold">
                Total: ₦{paymentDetails.totalAmount.toFixed(2)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={handleSubmitPayment}
                className="btn-primary px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
              >
                Submit Payment
              </button>
              <button
                onClick={closePayFeeModal}
                className="btn-secondary px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Student Details Modal */}
      {selectedStudent && !isPayFeeModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white rounded-lg w-11/12 max-w-3xl relative max-h-[90vh] overflow-auto">
            {/* ✅ Sticky Top Bar (Pay Fee + Close ON TOP of results) */}
            <div className="sticky top-0 bg-white z-20 border-b p-3 flex items-center justify-between">
              <div className="font-bold text-lg truncate">{selectedStudent.name}</div>
              <div className="flex gap-2">
                <button
                  onClick={handlePayFee}
                  className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Pay Fee
                </button>
                <button
                  onClick={handleCloseDetails}
                  className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            </div>

            {/* ✅ Content: IMAGE ON TOP for ALL screens */}
            <div className="p-4">
              <div className="w-full">
                <img
                  src={selectedStudent.photoURL}
                  alt={selectedStudent.name}
                  className="w-full max-h-[320px] object-contain rounded-lg bg-gray-50"
                />
              </div>

              <div className="mt-4">
                <h2 className="text-xl font-bold">{selectedStudent.name}</h2>

                <div className="mt-2 text-sm space-y-1">
                  <p>
                    <strong>Admission Number:</strong> {selectedStudent.admissionNumber}
                  </p>
                  <p>
                    <strong>Serial Number:</strong> {selectedStudent.serialNumber}
                  </p>
                  <p>
                    <strong>Sex:</strong> {selectedStudent.sex}
                  </p>
                  <p>
                    <strong>Class:</strong> {selectedStudent.class}
                  </p>
                  <p>
                    <strong>Age:</strong> {selectedStudent.studentAge || "N/A"}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong> {selectedStudent.dateOfBirth || "N/A"}
                  </p>
                  <p>
                    <strong>Guardian ID:</strong> {selectedStudent.guardianId || "N/A"}
                  </p>
                  <p>
                    <strong>Guardian Name:</strong> {selectedStudent.guardianName || "N/A"}
                  </p>
                  <p>
                    <strong>Guardian Address:</strong> {selectedStudent.guardianAddress || "N/A"}
                  </p>
                  <p>
                    <strong>Guardian Phone:</strong> {selectedStudent.guardianPhone}
                  </p>
                  <p>
                    <strong>Guardian Email:</strong> {selectedStudent.guardianEmail}
                  </p>
                </div>

                {/* ✅ Results upload + list */}
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-bold text-lg mb-2">Student Results (PDF)</h3>

                  <div className="flex flex-col gap-2">
                    <select
                      value={resultGrade}
                      onChange={(e) => setResultGrade(e.target.value)}
                      className="border border-gray-300 rounded-md p-2"
                    >
                      <option value="">Select Grade</option>
                      <option value="Grade 1">Grade 1</option>
                      <option value="Grade 2">Grade 2</option>
                      <option value="Grade 3">Grade 3</option>
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5</option>
                      <option value="Grade 6">Grade 6</option>
                    </select>

                    <select
                      value={resultTerm}
                      onChange={(e) => setResultTerm(e.target.value)}
                      className="border border-gray-300 rounded-md p-2"
                    >
                      <option value="First Term">First Term</option>
                      <option value="Second Term">Second Term</option>
                      <option value="Third Term">Third Term</option>
                    </select>

                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleResultPdfChange}
                      className="border border-gray-300 rounded-md p-2"
                    />

                    <button
                      type="button"
                      onClick={handleUploadResultPdf}
                      disabled={resultUploadLoading}
                      className={`px-4 py-2 rounded text-white ${
                        resultUploadLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {resultUploadLoading ? "Working..." : "Upload Result PDF"}
                    </button>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Uploaded Results</h4>

                    {studentResults.length === 0 ? (
                      <p className="text-sm text-gray-500">No results uploaded yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {studentResults.map((r) => (
                          <li
                            key={r.id}
                            className="border rounded-md p-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                          >
                            <div className="text-sm">
                              <p className="font-semibold">
                                {r.grade || "Grade"} — {r.term || "Term"}
                              </p>
                              <p className="text-gray-600 break-all">
                                {r.fileName || "Result.pdf"}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                              >
                                Download
                              </a>

                              <button
                                type="button"
                                onClick={() => shareResultToWhatsApp(r)}
                                className="bg-emerald-700 text-white px-3 py-1 rounded hover:bg-emerald-800 text-sm"
                              >
                                Share WhatsApp
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteResult(r)}
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* ✅ Keep X button also (optional) */}
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
                  aria-label="Close"
                >
                  <MdClose size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center m-4">
        <button onClick={handleReload} className="p-2 bg-gray-200 rounded">
          Reload
        </button>
        <h1 className="text-xl font-bold text-center flex-1">Students</h1>
        <button
          onClick={() => navigate("/posscreen")}
          className="p-2 bg-gray-200 rounded"
        >
          Back
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-lg relative max-h-[90vh] overflow-auto">
            <div className="flex justify-between mb-4 sticky top-0 bg-white z-10 py-2">
              <h2 className="text-xl font-bold">
                {isEditing ? "Edit Student" : "Add Student"}
              </h2>

              <button
                type="button"
                onClick={handleCloseModal}
                className="cursor-pointer text-gray-600 hover:text-gray-900"
                aria-label="Close"
              >
                <MdClose size={24} />
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <input
                type="text"
                id="admissionNumber"
                placeholder="Admission Number"
                value={admissionNumber}
                onChange={onChange}
                className="input mb-4"
                required={!isEditing}
              />

              <input
                type="text"
                id="name"
                placeholder="Full Name"
                value={name}
                onChange={onChange}
                className="input mb-4"
                required={!isEditing}
              />

              <select
                id="sex"
                value={sex}
                onChange={onChange}
                className="input mb-4"
                required={!isEditing}
              >
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <select
                id="class"
                value={studentClass}
                onChange={onChange}
                className="input mb-4"
                required={!isEditing}
              >
                <option value="">Select Class</option>
                {(state.classes || []).map((classItem) => (
                  <option key={classItem.id} value={classItem.className}>
                    {classItem.className}
                  </option>
                ))}
              </select>

              <input
                type="number"
                id="studentAge"
                placeholder="Student Age"
                value={studentAge}
                onChange={onChange}
                className="input mb-4"
                min="0"
              />

              <input
                type="date"
                id="dateOfBirth"
                value={dateOfBirth}
                onChange={onChange}
                className="input mb-4"
              />

              <input
                type="text"
                id="guardianId"
                placeholder="Parent/Guardian ID (required)"
                value={guardianId}
                onChange={onChange}
                className="input mb-4"
                required
              />

              <input
                type="text"
                id="guardianName"
                placeholder="Parent/Guardian Name (optional)"
                value={guardianName}
                onChange={onChange}
                className="input mb-4"
              />

              <input
                type="text"
                id="guardianAddress"
                placeholder="Parent/Guardian Home Address"
                value={guardianAddress}
                onChange={onChange}
                className="input mb-4"
              />

              <input
                type="text"
                id="guardianPhone"
                placeholder="Guardian Phone"
                value={guardianPhone}
                onChange={onChange}
                className="input mb-4"
                required={!isEditing}
              />

              <input
                type="email"
                id="guardianEmail"
                placeholder="Guardian Email"
                value={guardianEmail}
                onChange={onChange}
                className="input mb-4"
                required={!isEditing}
              />

              <input type="file" onChange={handlePhotoChange} className="mb-4" />

              <button type="submit" className="btn-primary">
                {isEditing ? "Update Student" : "Add Student"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Students Table */}
      <table className="table-auto w-full mt-4 border border-collapse border-gray-300">
        <thead>
          <tr className="bg-gray-200 border border-gray-300">
            <th className="border border-gray-300 px-4 py-2">S/N</th>
            <th className="border border-gray-300 px-4 py-2">Photo</th>
            <th className="border border-gray-300 px-4 py-2">Admission No.</th>
            <th className="border border-gray-300 px-4 py-2">Date Admited.</th>
            <th className="border border-gray-300 px-4 py-2">Name</th>
            <th className="border border-gray-300 px-4 py-2">Sex</th>
            <th className="border border-gray-300 px-4 py-2">Class</th>
            <th className="border border-gray-300 px-4 py-2">Age</th>
            <th className="border border-gray-300 px-4 py-2">Guardian ID</th>
            <th className="border border-gray-300 px-4 py-2">Guardian Address</th>
            <th className="border border-gray-300 px-4 py-2">Guardian Phone</th>
            <th className="border border-gray-300 px-4 py-2">Guardian Email</th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {(state.students || []).map((student, index) => {
            const isGrade6 =
              /grade\s*6/i.test((student.class || "").trim()) ||
              (student.class || "").trim() === "6";

            return (
              <tr
                key={student.id ?? index}
                onClick={() => handleRowClick(student)}
                className="border border-gray-300 cursor-pointer"
              >
                <td className="border border-gray-300 px-4 py-2">{index + 1}</td>

                <td className="border border-gray-300 px-4 py-2">
                  {student.photoURL ? (
                    <img
                      src={student.photoURL}
                      alt={student.name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    "No Photo"
                  )}
                </td>

                <td className="border border-gray-300 px-4 py-2">
                  {student.admissionNumber}
                </td>

                <td className="border border-gray-300 px-4 py-2">
                  {student.timestamp?.toDate?.().toLocaleDateString() || "Invalid Date"}
                </td>

                <td className="border border-gray-300 px-4 py-2">{student.name}</td>

                <td className="border border-gray-300 px-4 py-2">{student.sex}</td>

                <td className="border border-gray-300 px-4 py-2">{student.class}</td>

                <td className="border border-gray-300 px-4 py-2">
                  {student.studentAge || "N/A"}
                </td>

                <td className="border border-gray-300 px-4 py-2">
                  {student.guardianId || "N/A"}
                </td>

                <td className="border border-gray-300 px-4 py-2">
                  {student.guardianAddress || "N/A"}
                </td>

                <td className="border border-gray-300 px-4 py-2">
                  {student.guardianPhone}
                </td>

                <td className="border border-gray-300 px-4 py-2">
                  {student.guardianEmail}
                </td>

                <td className="border border-gray-300 px-4 py-2 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditStudent(student.id);
                    }}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStudent(student.id);
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>

                  {isGrade6 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGraduateStudent(student);
                      }}
                      className="bg-indigo-600 text-white px-2 py-1 rounded"
                    >
                      Graduate
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-center p-4 space-x-4">
        <button onClick={handleOpenModal} className="btn-blue">
          Add Student
        </button>
        <button onClick={handlePrintStudents} className="btn-green">
          Print Students
        </button>
      </div>
    </>
  );
}

export const convertToWords = (num) => {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convertHundreds = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convertHundreds(n % 100) : "");
  };

  const convertThousands = (n) => {
    if (n < 1000) return convertHundreds(n);
    if (n < 1000000)
      return (
        convertHundreds(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + convertHundreds(n % 1000) : "")
      );
    return (
      convertHundreds(Math.floor(n / 1000000)) +
      " Million" +
      (n % 1000000 ? " " + convertThousands(n % 1000000) : "")
    );
  };

  if (num === 0) return "Zero";

  const naira = Math.floor(num);
  const kobo = Math.round((num - naira) * 100);


  let words = "";

  
  if (naira > 0) {
    words += convertThousands(naira) + " Naira";
  }

  if (kobo > 0) {
    words += (words ? " and " : "") + convertHundreds(kobo) + " Kobo";
  }

  return words || "Zero Naira";
};

