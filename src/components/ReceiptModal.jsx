import React, { useEffect, useState, useRef } from 'react';
import { useMyContext } from '../Context/MyContext'; // Import the context

const ReceiptModal = ({ saleInfo, onClose }) => {
  const { state } = useMyContext(); // Access the context state
  const selectedCompanyName = state.selectedCompanyName || "";
  const selectedCompanyAddress = state.selectedCompanyAddress || "No address available"; // Get the company address

  const [selectedSale, setSelectedSale] = useState(null);
  const printRef = useRef();

  // Utility function for converting total amount to words
  const convertNumberToWords = (num) => {
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const scales = ["", "Thousand", "Million", "Billion"];

    if (num === 0) return "Zero";

    let word = "";
    let scaleIndex = 0;

    while (num > 0) {
      const chunk = num % 1000;
      if (chunk > 0) {
        const hundreds = Math.floor(chunk / 100);
        const remainder = chunk % 100;
        let chunkWord = "";

        if (hundreds > 0) {
          chunkWord += `${units[hundreds]} Hundred `;
        }
        if (remainder < 10) {
          chunkWord += units[remainder];
        } else if (remainder < 20) {
          chunkWord += teens[remainder - 10];
        } else {
          chunkWord += `${tens[Math.floor(remainder / 10)]} ${units[remainder % 10]}`;
        }
        word = `${chunkWord} ${scales[scaleIndex]} ${word}`;
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    }
    return word.trim();
  };

  // Log the selected company's address to the console
  useEffect(() => {
    console.log("Selected Company Address:", selectedCompanyAddress);
  }, [selectedCompanyAddress]);

  useEffect(() => {
    setSelectedSale(saleInfo);
  }, [saleInfo]);

  if (!selectedSale) {
    return null;
  }

  const {
    // id,
    customer: { name: customerName },
    date,
    totalAmount,
    saleId,
    staff: { name: staffName },
    products,
    payment: { method: paymentMethod }
  } = selectedSale;

  const TransactionReceiptNumber = saleId || 'N/A';
  const transactionDateTime = date || 'N/A';
  const overallTotal = totalAmount || 0;
  const totalInWords = convertNumberToWords(overallTotal); // Convert the total amount to words

  const handlePrint = () => {
    const originalContent = document.body.innerHTML;
    const printContent = printRef.current.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center bg-gray-800 bg-opacity-75">
      <div className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg">
        <div ref={printRef} className="p-4 overflow-x-auto">
          <h2 className="text-2xl font-bold text-center mb-4">
            {selectedCompanyName}
          </h2>

          {/* Display the selected company address */}
          <p className="text-center">{}</p>
          <p className="text-center">Phone: </p>
          <p className="text-center">Email: {}</p>
          <p className="text-center">Attendant: {staffName}</p>
          <p className="text-center">Customer: {customerName}</p>

          <hr className="my-4" />
          <h3 className="text-xl text-center mb-2">Receipt No.: {TransactionReceiptNumber}</h3>
          <p className="text-center">Date/Time: {transactionDateTime}</p>
          <hr className="my-4" />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price (₦)</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name || 'N/A'}</td>
                    <td>{item.quantity || 'N/A'}</td>
                    <td>{item.Amount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <hr className="my-4" />
          <p className="font-bold text-lg text-center mb-2">Total: ₦{overallTotal.toFixed(2)}</p>
          <p className="text-center italic">({totalInWords} Naira Only)</p> {/* Display total in words */}
          <p className="text-center">Payment Method: <strong>{paymentMethod}</strong></p>
          <hr className="my-4" />
          <p className="italic text-center">Thanks for your patronage. Please call again!</p>
          <hr className="my-4" />
          <p className="text-center">Software Developer: <strong>PixelForge Technologies</strong></p>
          <p className="text-center">Contact: <strong>08030611606, 08026511244.</strong></p>
        </div>

        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Close Modal
          </button>

          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
