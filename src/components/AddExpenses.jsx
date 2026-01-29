import { useState } from "react";
import { toast } from "react-toastify";
import { addDoc, collection } from 'firebase/firestore';
import { db } from "../firebase";
import { useMyContext } from '../Context/MyContext';



//new  again
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
    amount: 0,
    description: "",
    date: null,
    receiptNo: "",
    vendorName: "",
    paymentMethod: "",
    attendantName: "",
    paymentStatus: "",
    receiptFile: {},
  });
  
  const handleBack = () => {
    navigate("/expenses");
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpense((prevExpense) => ({
      ...prevExpense,
      [name]: value,
    }));
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      // Destructure the expense object for easier validation
      const { name, category, amount, date, receiptNo, vendorName, paymentMethod, attendantName, paymentStatus } = expense;
  
      // Validate input fields
      if (
        !name.trim() ||
        !category.trim() ||
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
  
      const expenseData = {
        name: name.trim(),
        category: category.trim(),
        amount: parseFloat(amount),
        description: expense.description.trim(),
        date: new Date(date).toISOString(), // Ensure the date is in ISO format
        receiptNo: receiptNo.trim(),
        vendorName: vendorName.trim(),
        paymentMethod: paymentMethod.trim(),
        attendantName: attendantName.trim(),
        paymentStatus: paymentStatus.trim(),
        receiptFile: expense.receiptFile || null,
      };
  
      // Add the expense data to the 'expenses' collection in the database
      await addDoc(collection(db, `companies/${selectedCompanyId}/expenses`), expenseData);
  
      toast.success("Expense added successfully", {
        position: toast.POSITION.TOP_RIGHT,
      });
  
      // Reset the form fields
      setExpense({
        name: "",
        category: "",
        amount: 0,
        description: "",
        date: new Date().toISOString().slice(0, 10), // Reset to current date
        receiptNo: "",
        vendorName: "",
        paymentMethod: "",
        attendantName: "",
        paymentStatus: "",
        receiptFile: null,
      });
    } catch (error) {
      console.error("Error adding expense: ", error);
      toast.error("Failed to add expense. Please try again later.", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } finally {
      setLoading(false);
    }
  };
   
  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={handleBack} className="text-blue-500 text-lg cursor-pointer">
                &#8592; Back
              </button>
              <h2 className="text-2xl font-bold mx-auto">Add Expense</h2>
              <button onClick={onCloseModal} className="text-gray-500">
                <MdClose />
              </button>
            </div>

              <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Expense Name</label>
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

              <label className="block text-gray-700 text-sm font-bold mb-2">Expense Category</label>
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
                <label className="block text-gray-700 text-sm font-bold mb-2">Expense Amount</label>
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
                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                <textarea
                  name="description"
                  value={expense.description}
                  onChange={handleInputChange}
                  className="border rounded-md w-full p-2"
                  required
                  rows="4"
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Date</label>
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
                <label className="block text-gray-700 text-sm font-bold mb-2">Receipt No</label>
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
                <label className="block text-gray-700 text-sm font-bold mb-2">Vendor Name</label>
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
                <label className="block text-gray-700 text-sm font-bold mb-2">Payment Method</label>
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
                <label className="block text-gray-700 text-sm font-bold mb-2">Attendant Name</label>
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
                <label className="block text-gray-700 text-sm font-bold mb-2">Payment Status</label>
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
                <label className="block text-gray-700 text-sm font-bold mb-2">Receipt File</label>
                <input
                  type="file"
                  name="receiptFile"
                  onChange={handleInputChange}
                  className="border rounded-md w-full p-2"
                  accept="image/*, application/pdf"
                  required
                />
              </div>
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
                Add Expense
              </button>
            </form>
          </div>
        </div>
      </div>|
    </div>
  );
}
