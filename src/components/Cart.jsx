import React, { useState } from 'react';
import { useMyContext } from '../Context/MyContext';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CartItem = ({ id, name, fee = 50000 }) => {
  const { increaseQuantity, decreaseQuantity, removeFromCart } = useMyContext();

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1">
        <h3>{name}</h3>
      </div>
      <div className="flex items-center">
        <span className="mr-2">₦{fee}</span>
        <FaMinus className="cursor-pointer text-sm" onClick={() => decreaseQuantity(id)} />
        <FaPlus className="cursor-pointer text-sm" onClick={() => increaseQuantity(id)} />
        <FaTrash className="ml-4 cursor-pointer text-pink-500" onClick={() => removeFromCart(id)} />
      </div>
    </div>
  );
};

const OverallTotal = ({
  total,
  onClearItems,
  onPrintReceipt,
  selectedPaymentMethod,
  setSelectedTerm,
  setSelectedPaidItem,
  setSelectedPaymentMethod,
  isProcessing,
}) => (
  <div className="flex flex-col mt-4 items-end">
    <p className="text-lg font-bold mb-2">Fees Total: ₦{total}</p>
    <select
      className="bg-white border border-gray-300 mb-4 rounded-md py-2 px-4"
      onChange={(e) => setSelectedTerm(e.target.value)}
    >
      <option value="First Term">First Term</option>
      <option value="Second Term">Second Term</option>
      <option value="Third Term">Third Term</option>
    </select>
    <select
      className="bg-white border border-gray-300 mb-4 rounded-md py-2 px-4"
      onChange={(e) => setSelectedPaidItem(e.target.value)}
    >
      <option value="Admission">Admission</option>
      <option value="School Fees">School Fees</option>
      <option value="Examination Fee">Examination Fee</option>
      <option value="Medical">Medical</option>
      <option value="Graduation">Graduation</option>
      <option value="Activity Fees">Activity Fees</option>
      <option value="Others">Others</option>
    </select>
    <select
      className="bg-white border border-gray-300 mb-4 rounded-md py-2 px-4"
      value={selectedPaymentMethod}
      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
    >
      <option value="Cash">Cash</option>
      <option value="Bank Transfer">Bank Transfer</option>
      <option value="POS">POS</option>
      <option value="Cheque">Cheque</option>
    </select>
    <div className="flex gap-4">
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md"
        onClick={onPrintReceipt}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Generate Receipt'}
      </button>
      <button className="bg-red-500 text-white px-8 py-2 rounded-md" onClick={onClearItems}>
        Clear
      </button>
    </div>
  </div>
);

const Cart = () => {
  const { state, clearCart } = useMyContext();
  const { cart } = state;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Cash');
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedPaidItem, setSelectedPaidItem] = useState('Admission');
  const [isProcessing, setIsProcessing] = useState(false);
  const overallTotal = cart.reduce((acc, item) => acc + item.fee, 0);
  const db = getFirestore();

  const handlePrintReceipt = async () => {
    const receiptNumber = Math.floor(Math.random() * 1000000);
    const transactionDateTime = new Date().toLocaleString();
    setIsProcessing(true);
  
    if (cart.length === 0) {
      toast.error('No items in the cart.');
      setIsProcessing(false);
      return;
    }
  
    const student = cart[0]; // Assuming all items in the cart belong to the same student
    const paidItems = cart.map((item) => ({
      itemName: item.paidItem,
      amount: item.fee,
    }));
  
    const receiptDoc = {
      receiptId: `receipt_${receiptNumber}`,
      date: transactionDateTime,
      term: selectedTerm,
      student: {
        id: student.id,
        name: student.name,
      },
      paidItems,
      totalFees: overallTotal,
      paymentMethod: selectedPaymentMethod,
      staff: {
        id: state.user?.id || 'default_staff_id',
        name: state.user?.name || 'default_staff_name',
      },
    };
  
    try {
      await addDoc(collection(db, `schools/${state.selectedSchoolId}/receipts`), receiptDoc);
  
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
        <head>
          <title>Receipt</title>
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
            <h2>${state.selectedSchoolName || 'School Name'}</h2>
            <p>Receipt Number: ${receiptNumber}</p>
            <p>Date: ${transactionDateTime}</p>
          </div>
          <div class="receipt-details">
            <p><strong>Student Name:</strong> ${student.name}</p>
            <p><strong>Term:</strong> ${selectedTerm}</p>
            <p><strong>Total Fees:</strong> ₦${overallTotal.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${selectedPaymentMethod}</p>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Paid Item</th>
                <th>Fee Paid (₦)</th>
              </tr>
            </thead>
            <tbody>
              ${paidItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.itemName}</td>
                  <td>${item.amount.toFixed(2)}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
          <p>Attendant: ${state.user?.name || 'Staff Name'}</p>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
  
      toast.success('Receipt generated successfully!');
      clearCart();
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  

  return (
    <div>
      <div>
        {cart.map((item) => (
          <CartItem key={item.id} id={item.id} name={item.name} fee={item.fee} />
        ))}
      </div>
      <OverallTotal
        total={overallTotal}
        onClearItems={clearCart}
        onPrintReceipt={handlePrintReceipt}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedTerm={setSelectedTerm}
        setSelectedPaidItem={setSelectedPaidItem}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default Cart;
