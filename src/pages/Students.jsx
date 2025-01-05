import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, serverTimestamp, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
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
    items: [], // { type: 'school fee', amount: 0 }
    totalAmount: 0,
  });
  const [currentPaymentItem, setCurrentPaymentItem] = useState({ type: "", amount: "" });
  const [receiptData, setReceiptData] = useState(null);

  const [term, setTerm] = useState("First Term");  // Set the default term
  const [paymentMethod, setPaymentMethod] = useState("");


  const [formData, setFormData] = useState({
    admissionNumber: "",
    name: "",
    sex: "",
    class: "",
    guardianPhone: "",
    guardianEmail: "",
    photoURL: "",
  });


  const {
    // serialNumber,
    admissionNumber,
    name,
    sex,
    class: studentClass,
    guardianPhone,
    guardianEmail,
  } = formData;

  const navigate = useNavigate();

  // Load existing student data for editing
  useEffect(() => {
    if (isEditing && currentStudentId) {
      const studentToEdit = state.students.find((student) => student.id === currentStudentId);
      if (studentToEdit) {
        setFormData({
          serialNumber: studentToEdit.serialNumber || "",
          admissionNumber: studentToEdit.admissionNumber || "",
          name: studentToEdit.name || "",
          sex: studentToEdit.sex || "",
          class: studentToEdit.class || "",
          guardianPhone: studentToEdit.guardianPhone || "",
          guardianEmail: studentToEdit.guardianEmail || "",
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
      let photoURL = formData.photoURL;
      if (studentPhoto) photoURL = await uploadStudentPhoto();

      const studentData = {
        admissionNumber: admissionNumber.trim(),
        name: name.trim(),
        sex: sex.trim(),
        class: studentClass.trim(),
        guardianPhone: guardianPhone.trim(),
        guardianEmail: guardianEmail.trim(),
        photoURL: photoURL,
        timestamp: serverTimestamp(),
      };

      if (isEditing) {
        await updateDoc(doc(db, `schools/${state.selectedSchoolId}/students`, currentStudentId), studentData);
        toast.success("Student updated successfully!");
      } else {
        const studentId = `${Date.now()}`;
        await setDoc(doc(db, `schools/${state.selectedSchoolId}/students`, studentId), studentData);
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
    try {
      await deleteDoc(doc(db, `schools/${state.selectedSchoolId}/students`, studentId));
      toast.success("Student deleted successfully!");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student. Please try again.");
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setStudentPhoto(null);
    setFormData({
      serialNumber: "",
      admissionNumber: "",
      name: "",
      sex: "",
      class: "",
      guardianPhone: "",
      guardianEmail: "",
      photoURL: "",
    });
  };

  const handleRowClick = (student) => setSelectedStudent(student);
  const handleCloseDetails = () => setSelectedStudent(null);
  const handlePrintStudents = () => window.print();
  const handleReload = () => window.location.reload();

  if (loading) return <Spinner />;
  // Handle opening the Pay Fee modal
  const handlePayFee = () => setIsPayFeeModalOpen(true);

  // Handle closing the Pay Fee modal
  const closePayFeeModal = () => {
    setIsPayFeeModalOpen(false); // Close the modal properly
    setPaymentDetails({ items: [], totalAmount: 0 }); // Reset payment details
    setCurrentPaymentItem({ type: "", amount: "" }); // Reset payment input
    setReceiptData(null); // Clear receipt data if any
  };

  // Handle adding an item to the payment list
  const handleAddPaymentItem = () => {
    const { type, amount } = currentPaymentItem;
    if (type && amount) {
      setPaymentDetails((prev) => ({
        ...prev,
        items: [...prev.items, { type, amount: parseFloat(amount) }],
        totalAmount: prev.totalAmount + parseFloat(amount),
      }));
      setCurrentPaymentItem({ type: "", amount: "" }); // Reset input fields
    } else {
      toast.error("Please fill in both type and amount fields.");
    }
  };





  // const amountInWords = convertToWords(paymentData.totalAmount);

  const handleSubmitPayment = async () => {
    if (paymentDetails.items.length === 0) {
      toast.error("Please add at least one item to the payment.");
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        studentId: selectedStudent?.id || "N/A",
        studentName: selectedStudent?.name || "N/A",
        guardianPhone: selectedStudent?.guardianPhone || "N/A",
        studentClass: selectedStudent?.class || "N/A",
        items: paymentDetails.items,
        totalAmount: paymentDetails.totalAmount,
        timestamp: serverTimestamp(),
        paymentMethod: paymentMethod, // Dynamic payment method
        term: term, // Correct term from state
        staff: {
          id: state.user?.id || "default_staff_id",
          name: state.user?.name || "default_staff_name",
        },
      };

      const amountInWords = convertToWords(paymentData.totalAmount);

      const receiptId = `receipt_${Math.floor(Math.random() * 1000000)}`;
      const transactionDateTime = new Date().toLocaleString();

      await setDoc(doc(db, `schools/${state.selectedSchoolId}/payments`, receiptId), paymentData);

      // Generate Receipt
      const printWindow = window.open("", "_blank");
      console.log("Selected Term:", term);

      printWindow.document.write(`
    <html>
    <head>
      <title>Payment Receipt</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          line-height: 1.6;
        }
        .header {
          text-align: center;
        }
        .header h2 {
          margin: 0;
        }
        .receipt-details {
          margin: 20px 0;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
        }
        .table th, .table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .table th {
          background-color: #f2f2f2;
        }
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
        <p><strong>Guardian Phone:</strong> ${paymentData.guardianPhone}</p>
        <p><strong>Total Amount:</strong> ₦${paymentData.totalAmount.toFixed(2)}</p>
        <p><strong>Amount in Words:</strong> ${amountInWords} Only</p>
        <p><strong>Payment Method:</strong> ${paymentData.paymentMethod}</p>
        <p><strong>Term:</strong> ${paymentData.term}</p>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Amount (₦)</th>
          </tr>
        </thead>
        <tbody>
          ${paymentDetails.items
          .map(
            (item) => `
            <tr>
              <td>${item.type}</td>
              <td>${item.amount.toFixed(2)}</td>
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
        <p style="text-align: center; font-style: italic; margin-top: 20px; font-size: 14px;">
          Aspiring for Excellence...
        </p>
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





  return (
    <>

      {receiptData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-lg print:shadow-none">
            <h2 className="text-xl font-bold mb-4">Payment Receipt</h2>
            <div className="text-sm">
              <p><strong>Student Name:</strong> {selectedStudent?.name || "N/A"}</p>
              <p><strong>Admission Number:</strong> {selectedStudent?.admissionNumber || "N/A"}</p>
              <p><strong>Total Amount Paid:</strong> ${receiptData.totalAmount.toFixed(2)}</p>
              <h3 className="font-semibold mt-4">Payment Details:</h3>
              <ul className="list-disc pl-6">
                {receiptData.items.map((item, index) => (
                  <li key={index}>
                    {item.type}: ${item.amount.toFixed(2)}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-11/12 max-w-lg max-h-[90vh] overflow-auto p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Pay Fee for {selectedStudent?.name}</h2>
              <MdClose size={24} onClick={closePayFeeModal} className="cursor-pointer text-gray-600 hover:text-gray-800" />
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
                onChange={(e) => setCurrentPaymentItem((prev) => ({ ...prev, type: e.target.value }))}
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
                onChange={(e) => setCurrentPaymentItem((prev) => ({ ...prev, amount: e.target.value }))}
              />
              <button onClick={handleAddPaymentItem} className="btn-secondary mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
                Add Item
              </button>
            </div>

            {/* Payment Summary */}
            <div>
              <h3 className="font-bold">Payment Items</h3>
              <ul className="list-disc pl-6 mb-4">
                {paymentDetails.items.map((item, index) => (
                  <li key={index}>
                    {item.type} - ${item.amount.toFixed(2)}
                  </li>
                ))}
              </ul>
              <p className="font-bold">Total: ${paymentDetails.totalAmount.toFixed(2)}</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end mt-4 space-x-2">
              <button onClick={handleSubmitPayment} className="btn-primary px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
                Submit Payment
              </button>
              <button onClick={closePayFeeModal} className="btn-secondary px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Render Student Details Modal */}
      {selectedStudent && !isPayFeeModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-3xl flex">
            <div className="w-1/2">
              <img src={selectedStudent.photoURL} alt={selectedStudent.name} className="w-full h-auto rounded-lg" />
            </div>
            <div className="w-1/2 ml-4 pl-6">
              <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
              <p><strong>Admission Number:</strong> {selectedStudent.admissionNumber}</p>
              <p><strong>Serial Number:</strong> {selectedStudent.serialNumber}</p>
              <p><strong>Sex:</strong> {selectedStudent.sex}</p>
              <p><strong>Class:</strong> {selectedStudent.class}</p>
              <p><strong>Guardian Phone:</strong> {selectedStudent.guardianPhone}</p>
              <p><strong>Guardian Email:</strong> {selectedStudent.guardianEmail}</p>
              <button onClick={handlePayFee} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
                Pay Fee
              </button>
              <button onClick={handleCloseDetails} className="bg-red-500 text-white px-4 py-2 rounded ml-2 mt-4">
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="flex justify-between items-center m-4">
        <button onClick={handleReload} className="p-2 bg-gray-200 rounded">
          Reload
        </button>
        <h1 className="text-xl font-bold text-center flex-1">Students</h1>
        <button onClick={() => navigate("/posscreen")} className="p-2 bg-gray-200 rounded">
          Back
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-lg">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">{isEditing ? "Edit Student" : "Add Student"}</h2>
              <MdClose size={24} onClick={handleCloseModal} className="cursor-pointer" />
            </div>
            <form onSubmit={onSubmit}>
              <input
                type="text"
                id="admissionNumber"
                placeholder="Admission Number"
                value={admissionNumber}
                onChange={onChange}
                className="input mb-4"
                required={!isEditing} // Required only when adding a new student
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
                {state.classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.className}>
                    {classItem.className}
                  </option>
                ))}
              </select>

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
              <input
                type="file"
                onChange={handlePhotoChange}
                className="mb-4"
              />
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
      <th className="border border-gray-300 px-4 py-2">Guardian Phone</th>
      <th className="border border-gray-300 px-4 py-2">Guardian Email</th>
      <th className="border border-gray-300 px-4 py-2">Actions</th>
    </tr>
  </thead>

  <tbody>
    {state.students.map((student, index) => (
      <tr key={student.id} onClick={() => handleRowClick(student)} className="border border-gray-300 cursor-pointer">
        <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
        <td className="border border-gray-300 px-4 py-2">
          {student.photoURL ? (
            <img src={student.photoURL} alt={student.name} className="w-12 h-12 rounded-full" />
          ) : (
            "No Photo"
          )}
        </td>
        <td className="border border-gray-300 px-4 py-2">{student.admissionNumber}</td>
        <td className="border border-gray-300 px-4 py-2">{student.timestamp?.toDate?.().toLocaleDateString() || 'Invalid Date'}</td>
        <td className="border border-gray-300 px-4 py-2">{student.name}</td>
        <td className="border border-gray-300 px-4 py-2">{student.sex}</td>
        <td className="border border-gray-300 px-4 py-2">{student.class}</td>
        <td className="border border-gray-300 px-4 py-2">{student.guardianPhone}</td>
        <td className="border border-gray-300 px-4 py-2">{student.guardianEmail}</td>
        <td className="border border-gray-300 px-4 py-2">
          <button onClick={() => handleEditStudent(student.id)} className="bg-yellow-500 text-white px-2 py-1 rounded">
            Edit
          </button>
          <button onClick={() => handleDeleteStudent(student.id)} className="bg-red-500 text-white px-2 py-1 rounded">
            Delete
          </button>
        </td>
      </tr>
    ))}
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
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convertHundreds = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convertHundreds(n % 100) : "");
  };

  const convertThousands = (n) => {
    if (n < 1000) return convertHundreds(n);
    if (n < 1000000) return convertHundreds(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convertHundreds(n % 1000) : "");
    return convertHundreds(Math.floor(n / 1000000)) + " Million" + (n % 1000000 ? " " + convertThousands(n % 1000000) : "");
  };

  if (num === 0) return "Zero";

  const naira = Math.floor(num); // Extract the whole naira part
  const kobo = Math.round((num - naira) * 100); // Extract and round the kobo part

  let words = "";

  // Convert naira to words
  if (naira > 0) {
    words += convertThousands(naira) + " Naira";
  }

  // Convert kobo to words
  if (kobo > 0) {
    words += (words ? " and " : "") + convertHundreds(kobo) + " Kobo";
  }

  return words || "Zero Naira";
};
