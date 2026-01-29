import React, { useEffect, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from "../firebase";
import { toast } from 'react-toastify';

import { useMyContext } from '../Context/MyContext';
import { useNavigate } from 'react-router';


const AddTax = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [taxName, setTaxName] = useState('');
  const [selectedTax, setSelectedTax] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [errorMessage, setErrorMessage] = useState('');
 
  const { state: { taxes, selectedCompanyId },  calculateTotalAmount, calculateTotalTaxPaidAmount  } = useMyContext();
  
  // Call these functions wherever you need to use the total amount and total amount paid
  const totalAmount = calculateTotalAmount();
  const totalPaidAmount = calculateTotalTaxPaidAmount();
  const navigate = useNavigate();
  
console.log(setSelectedTax)
  // Possible tax names
  const possibleTaxNames = ["Company Income Tax (CIT)", "Value Added Tax (VAT)", "Withholding Tax (Rent)", "Withholding Tax (Dividends)", "Withholding Tax (Management Fees)", "Withholding Tax (Interest)"];


  const handleBack = () => {
    navigate("/inventory-page");
  };


  useEffect(() => {
    console.log('Taxes from context:', taxes);
  }, [taxes]);


  const calculateRate = (selectedTaxName) => {
    switch (selectedTaxName) {
      case 'Company Income Tax (CIT)':
        return '30%';
      case 'Value Added Tax (VAT)':
        return '7.5%';
      case 'Withholding Tax (Rent)':
        return '6%';
      case 'wht-dividends':
      case 'wht-management':
      case 'wht-interest':
        return '10%';
      default:
        return '0%';
    }
  };

  useEffect(() => {
    calculateRate();
  }, [selectedTax]);

  const handleAddTax = async () => {
    setIsLoading(true);
    try {
      if (!taxName.trim() || !taxRate.trim() || isNaN(parseFloat(taxRate)) || !amount.trim() || isNaN(parseFloat(amount)) || !paidAmount.trim() || isNaN(parseFloat(paidAmount))) {
        setErrorMessage('All fields must be filled and contain valid numbers');
        return;
      }
  
      const taxData = {
        name: taxName.trim(),
        rate: parseFloat(taxRate.trim()),
        amount: parseFloat(amount.trim()),
        paidAmount: parseFloat(paidAmount.trim()),
        date: date
      };
  
      // Modify the path to include `ttaxes`
      await addDoc(collection(db, `companies/${selectedCompanyId}/taxes`), taxData);
  
      toast.success('Tax added successfully', {
        position: toast.POSITION.TOP_RIGHT
      });
  
      setTaxName('');
      setTaxRate('');
      setAmount('');
      setPaidAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setErrorMessage('');
    } catch (error) {
      console.error('Error adding tax: ', error);
      toast.error('Failed to add tax. Please try again later.', {
        position: toast.POSITION.TOP_RIGHT
      });
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-gray-100 rounded-lg shadow-md">
        <button onClick={handleBack} className="text-blue-500 text-lg cursor-pointer">
                &#8592; Back
              </button>
      <h2 className="text-2xl font-bold mb-4">Add Tax Payments</h2>
      {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="taxName">
          Tax Name
        </label>
        <select
          className="w-full px-3 py-2 placeholder-gray-400 border rounded-md focus:outline-none focus:border-blue-500"
          id="taxName"
          value={taxName}
          onChange={(e) => {
            const selectedTaxName = e.target.value;
            setTaxName(selectedTaxName);
            setTaxRate(calculateRate(selectedTaxName));
          }}
        >
          <option value="">Select Tax Name</option>
          {possibleTaxNames.map((tax, index) => (
            <option key={index} value={tax}>{tax}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="taxRate">
          Tax Rate
        </label>
        <input
          className="w-full px-3 py-2 placeholder-gray-400 border rounded-md focus:outline-none focus:border-blue-500"
          type="text"
          id="taxRate"
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
          placeholder="Tax rate"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
          Amount
        </label>
        <input
          className="w-full px-3 py-2 placeholder-gray-400 border rounded-md focus:outline-none focus:border-blue-500"
          type="text"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paidAmount">
          Paid Amount
        </label>
        <input
          className="w-full px-3 py-2 placeholder-gray-400 border rounded-md focus:outline-none focus:border-blue-500"
          type="text"
          id="paidAmount"
          value={paidAmount}
          onChange={(e) => setPaidAmount(e.target.value)}
          placeholder="Enter paid amount"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
          Date
        </label>
        <input
          className="w-full px-3 py-2 placeholder-gray-400 border rounded-md focus:outline-none focus:border-blue-500"
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <button
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        onClick={handleAddTax}
        disabled={isLoading}
      >
        {isLoading ? 'Adding...' : 'Add Tax'}
      </button>

      <div className="mt-8 max-h-96 overflow-auto">
        <h2 className="text-2xl font-bold mb-4">Tax Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                <th className="border px-4 py-2">Tax Name</th>
                <th className="border px-4 py-2">Amount</th>
                <th className="border px-4 py-2">Paid</th>
                <th className="border px-4 py-2">Owed</th>
                <th className="border px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((tax) => (
                <tr key={tax.id}>
                  <td className="border px-4 py-2">{tax.name}</td>
                  <td className="border px-4 py-2">{tax.amount}</td>
                  <td className="border px-4 py-2">{tax.paidAmount}</td>
                  <td className="border px-4 py-2">{tax.amount - tax.paidAmount}</td>
                  <td className="border px-4 py-2">{tax.date}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
 
                <td className="border px-4 py-2 font-bold">Total</td>
                <td className="border px-4 py-2 font-bold">{totalAmount}</td>
                <td className="border px-4 py-2 font-bold">{totalPaidAmount}</td>
                <td className="border px-4 py-2 font-bold">{totalAmount-totalPaidAmount}</td>
                <td className="border px-4 py-2 font-bold">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AddTax;
