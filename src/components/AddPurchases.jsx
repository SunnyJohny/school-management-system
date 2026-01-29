import { useState } from "react";
import { toast } from "react-toastify";
import { addDoc, collection } from 'firebase/firestore';
import { db } from "../firebase";
import { useMyContext } from '../Context/MyContext';

import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import { MdClose } from "react-icons/md";

export default function AddGoodPurchase({ onCloseModal }) {
  const { state } = useMyContext();
  const { selectedCompanyId } = state;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [purchase, setPurchase] = useState({
    itemName: "",
    quantity: 0,
    unitPrice: 0,
    totalCost: 0,
    description: "",
    date: null,
    invoiceNo: "",
    supplierName: "",
    paymentMethod: "",
    attendantName: "",
    paymentStatus: "",
    receiptFile: {},
  });
  
  const handleBack = () => {
    navigate("/purchases");
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPurchase((prevPurchase) => ({
      ...prevPurchase,
      [name]: value,
      ...(name === "quantity" || name === "unitPrice" ? { totalCost: purchase.quantity * purchase.unitPrice } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { itemName, quantity, unitPrice, totalCost, date, invoiceNo, supplierName, paymentMethod, attendantName, paymentStatus } = purchase;

    try {
      if (
        !itemName.trim() ||
        isNaN(parseInt(quantity)) ||
        isNaN(parseFloat(unitPrice)) ||
        !date ||
        !invoiceNo.trim() ||
        !supplierName.trim() ||
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

      const purchaseData = {
        itemName: itemName.trim(),
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        totalCost: parseFloat(totalCost),
        description: purchase.description.trim(),
        date: new Date().toISOString(),

        invoiceNo: invoiceNo.trim(),
        supplierName: supplierName.trim(),
        paymentMethod: paymentMethod.trim(),
        attendantName: attendantName.trim(),
        paymentStatus: paymentStatus.trim(),
        receiptFile: purchase.receiptFile || null,
      };

      await addDoc(collection(db, `companies/${selectedCompanyId}/purchases`), purchaseData);

      toast.success("Good Purchase added successfully", {
        position: toast.POSITION.TOP_RIGHT,
      });

      setPurchase({
        itemName: "",
        quantity: 0,
        unitPrice: 0,
        totalCost: 0,
        description: "",
        date: new Date().toISOString().slice(0, 10),
        invoiceNo: "",
        supplierName: "",
        paymentMethod: "",
        attendantName: "",
        paymentStatus: "",
        receiptFile: null,
      });
    } catch (error) {
      console.error("Error adding purchase: ", error);
      toast.error("Failed to add purchase. Please try again later.", {
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
              <h2 className="text-2xl font-bold mx-auto">Add Good Purchase</h2>
              <button onClick={onCloseModal} className="text-gray-500">
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Item Name</label>
                <input
                  type="text"
                  name="itemName"
                  value={purchase.itemName}
                  onChange={handleInputChange}
                  className="border rounded-md w-full p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={purchase.quantity}
                  onChange={handleInputChange}
                  className="border rounded-md w-full p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Unit Price</label>
                <input
                  type="number"
                  name="unitPrice"
                  value={purchase.unitPrice}
                  onChange={handleInputChange}
                  className="border rounded-md w-full p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Total Cost</label>
                <input
                  type="number"
                  name="totalCost"
                  value={purchase.totalCost}
                  onChange={handleInputChange}
                  className="border rounded-md w-full p-2"
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                <textarea
                  name="description"
                  value={purchase.description}
                  onChange={handleInputChange}
                  className="border rounded-md w-full p-2"
                  rows="4"
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Purchase Date</label>
                <input
                  type="datetime-local"
                  name="date"
                  value={purchase.date}
                  onChange={handleInputChange}
                  className="border rounded-md w-full p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Invoice No</label>
                <input
                  type="text"
                  name="invoiceNo"
                  value={purchase.invoiceNo}
                  onChange={handleInputChange}
                  className="border rounded-md w-full p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Supplier Name</label>
                <input
                  type="text"
                  name="supplierName"
                  value={purchase.supplierName}
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
                  value={purchase.paymentMethod}
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
                  value={purchase.attendantName}
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
                  value={purchase.paymentStatus}
                  onChange={handleInputChange}
                  className="border rounded-md w-full p-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-md"
                disabled={loading}
              >
                {loading ? "Adding Purchase..." : "Add Purchase"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
