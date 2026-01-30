import { useState } from "react";
import { toast } from "react-toastify";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { useMyContext } from "../Context/MyContext";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import { MdClose } from "react-icons/md";

export default function AddExpense({ onCloseModal }) {
  const { state } = useMyContext();
  const { selectedCompanyId } = state;

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [expense, setExpense] = useState({
    name: "",
    category: "",
    amount: "",
    description: "",
    date: "",
    receiptNo: "",
    vendorName: "",
    paymentMethod: "",
    attendantName: "",
    paymentStatus: "",
    receiptFile: null,
  });

  const handleClose = () => {
    // if parent passed a close handler (ExpensePage modal), use it
    if (typeof onCloseModal === "function") return onCloseModal();

    // fallback if this is opened as a page route
    navigate("/expenses");
  };

  const handleBack = () => navigate("/expenses");

  const handleInputChange = (e) => {
    const { name, value, files, type } = e.target;

    // handle file input
    if (type === "file") {
      setExpense((prev) => ({
        ...prev,
        [name]: files?.[0] || null,
      }));
      return;
    }

    setExpense((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        name,
        category,
        amount,
        description,
        date,
        receiptNo,
        vendorName,
        paymentMethod,
        attendantName,
        paymentStatus,
        receiptFile,
      } = expense;

      if (
        !name.trim() ||
        !category.trim() ||
        !String(amount).trim() ||
        isNaN(parseFloat(amount)) ||
        !date ||
        !receiptNo.trim() ||
        !vendorName.trim() ||
        !paymentMethod.trim() ||
        !attendantName.trim() ||
        !paymentStatus.trim()
      ) {
        toast.error("All fields must be filled and contain valid values", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setLoading(false);
        return;
      }

      if (!selectedCompanyId) {
        toast.error("No company selected. Please select a company first.", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setLoading(false);
        return;
      }

      const expenseData = {
        name: name.trim(),
        category: category.trim(),
        amount: parseFloat(amount),
        description: (description || "").trim(),
        date: new Date(date).toISOString(),
        receiptNo: receiptNo.trim(),
        vendorName: vendorName.trim(),
        paymentMethod: paymentMethod.trim(),
        attendantName: attendantName.trim(),
        paymentStatus: paymentStatus.trim(),

        // NOTE: This is just storing the file object reference in state.
        // Firestore cannot store raw File objects.
        // If you want real uploads, we must upload to Firebase Storage and save the URL.
        receiptFile: receiptFile ? { name: receiptFile.name, type: receiptFile.type } : null,
        createdAt: new Date().toISOString(),
      };

      await addDoc(
        collection(db, `companies/${selectedCompanyId}/expenses`),
        expenseData
      );

      toast.success("Expense added successfully", {
        position: toast.POSITION.TOP_RIGHT,
      });

      setExpense({
        name: "",
        category: "",
        amount: "",
        description: "",
        date: "",
        receiptNo: "",
        vendorName: "",
        paymentMethod: "",
        attendantName: "",
        paymentStatus: "",
        receiptFile: null,
      });

      // close modal after success
      handleClose();
    } catch (error) {
      console.error("Error adding expense: ", error);
      toast.error("Failed to add expense. Please try again later.", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-lg overflow-hidden">
        {/* Top Bar (always visible) */}
        <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between z-10">
          <button onClick={handleBack} className="text-blue-500 text-lg cursor-pointer">
            &#8592; Back
          </button>

          <h2 className="text-xl font-bold">Add Expense</h2>

          <button onClick={handleClose} className="text-gray-600 hover:text-gray-900">
            <MdClose size={22} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="max-h-[80vh] overflow-y-auto p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Expense Name
              </label>
              <input
                type="text"
                name="name"
                value={expense.name}
                onChange={handleInputChange}
                className="border rounded-md w-full p-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Expense Category
              </label>
              <input
                type="text"
                name="category"
                value={expense.category}
                onChange={handleInputChange}
                className="border rounded-md w-full p-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Expense Amount
              </label>
              <input
                type="number"
                name="amount"
                value={expense.amount}
                onChange={handleInputChange}
                className="border rounded-md w-full p-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={expense.description}
                onChange={handleInputChange}
                className="border rounded-md w-full p-2"
                required
                rows="4"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Date
              </label>
              <input
                type="datetime-local"
                name="date"
                value={expense.date}
                onChange={handleInputChange}
                className="border rounded-md w-full p-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Receipt No
              </label>
              <input
                type="text"
                name="receiptNo"
                value={expense.receiptNo}
                onChange={handleInputChange}
                className="border rounded-md w-full p-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Vendor Name
              </label>
              <input
                type="text"
                name="vendorName"
                value={expense.vendorName}
                onChange={handleInputChange}
                className="border rounded-md w-full p-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Payment Method
              </label>
              <input
                type="text"
                name="paymentMethod"
                value={expense.paymentMethod}
                onChange={handleInputChange}
                className="border rounded-md w-full p-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Attendant Name
              </label>
              <input
                type="text"
                name="attendantName"
                value={expense.attendantName}
                onChange={handleInputChange}
                className="border rounded-md w-full p-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Payment Status
              </label>
              <input
                type="text"
                name="paymentStatus"
                value={expense.paymentStatus}
                onChange={handleInputChange}
                className="border rounded-md w-full p-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Receipt File
              </label>
              <input
                type="file"
                name="receiptFile"
                onChange={handleInputChange}
                className="border rounded-md w-full p-2"
                accept="image/*, application/pdf"
              />
              <p className="text-xs text-gray-500 mt-1">
                (Note: to actually store the receipt, upload to Firebase Storage and save the URL.)
              </p>
            </div>

            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md w-full"
            >
              Add Expense
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
