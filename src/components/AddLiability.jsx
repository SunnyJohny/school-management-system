import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Spinner from "./Spinner";
import { MdClose, MdEdit, MdDelete } from "react-icons/md";
import { doc, deleteDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { useMyContext } from '../Context/MyContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign } from '@fortawesome/free-solid-svg-icons';

import { useNavigate } from 'react-router';

export default function AddLiability() {
  const navigate = useNavigate();
  const { state, dispatch } = useMyContext();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLiabilityId, setCurrentLiabilityId] = useState(null);
  const [liability, setLiability] = useState({
    liabilityName: "",
    description: "",
    amount: 0,
    dueDate: "",
    accountType: "",
    liabilityAccount: "",
    interestExpenseAccount: "",
    collectionDate: "",
    amountPaid: [], // Changed to an array to store payment records
    loanBalance: 0,
    loanType: "",
    interest: [],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate loanBalance whenever amount or amountPaid changes
  useEffect(() => {
    const calculatedLoanBalance = parseFloat(liability.amount) - parseFloat(liability.amountPaid);
    setLiability((prevLiability) => ({
      ...prevLiability,
      loanBalance: calculatedLoanBalance,
    }));
  }, [liability.amount, liability.amountPaid]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };




  const handleDownload = () => {
    // Function for downloading liabilities as CSV
  };



  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentLiabilityId(null);
    setLiability({
      liabilityName: "",
      description: "",
      amount: 0,
      dueDate: "",
      accountType: "",
      liabilityAccount: "",
      interestExpenseAccount: "",
      collectionDate: "",
      amountPaid: 0,
      loanBalance: 0,
      loanType: "",
      interest: []

    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLiability((prevLiability) => ({
      ...prevLiability,
      [name]: value,
    }));
  };

  const handleEdit = (index) => {
    const liabilityToEdit = state.liabilities[index];
    setLiability(liabilityToEdit);
    setCurrentLiabilityId(liabilityToEdit.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };


  // // Custom confirmation function using Toastify
  // const showConfirmationPrompt = (message, title, type = 'text') => {
  //   return new Promise((resolve, reject) => {
  //     const input = window.prompt(`${title}\n${message}`);

  //     if (input !== null) {
  //       resolve(input); // Resolve with the entered value
  //     } else {
  //       reject(); // Reject if canceled
  //     }
  //   });
  // };

  const handlePay = async (id, amount) => {
    try {
      // Prompt the user to select payment type (Loan or Interest)
      const paymentType = prompt("Enter 'loan' to pay the loan or 'interest' to pay interest:", "loan");

      // Prompt the user to enter a payment amount
      const paymentAmount = parseFloat(prompt("Enter the payment amount:", "0"));

      // Validate the entered payment amount
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        toast.error("Invalid payment amount. Please enter a valid number.", {
          position: toast.POSITION.TOP_RIGHT,
        });
        return;
      }

      // Create a new payment entry with the current date
      const newPaymentEntry = {
        amount: paymentAmount,
        date: new Date().toISOString(),
      };

      // Get the existing liability
      const liabilityToUpdate = state.liabilities.find((liability) => liability.id === id);

      // Initialize updated arrays for amountPaid and interestPaid
      let updatedAmountPaid = Array.isArray(liabilityToUpdate.amountPaid) ? [...liabilityToUpdate.amountPaid] : [];
      let updatedInterestPaid = Array.isArray(liabilityToUpdate.interestPaid) ? [...liabilityToUpdate.interestPaid] : [];

      // Update the relevant payment array based on user input
      if (paymentType.toLowerCase() === "loan") {
        updatedAmountPaid.push(newPaymentEntry);
      } else if (paymentType.toLowerCase() === "interest") {
        updatedInterestPaid.push(newPaymentEntry);
      } else {
        toast.error("Invalid payment type. Please enter 'loan' or 'interest'.", {
          position: toast.POSITION.TOP_RIGHT,
        });
        return;
      }

      // Calculate the total amount paid
      const totalPaid = updatedAmountPaid.reduce((total, entry) => total + entry.amount, 0);
      // const totalInterestPaid = updatedInterestPaid.reduce((total, entry) => total + entry.amount, 0);

      // Update the status based on whether the loan is fully paid
      const updatedStatus = totalPaid >= amount ? "paid" : "unpaid";

      // Update the liability record in Firestore
      await updateDoc(doc(db, `companies/${state.selectedCompanyId}/liabilities`, id), {
        amountPaid: updatedAmountPaid, // Ensure it's updated as an array
        interestPaid: updatedInterestPaid.length > 0 ? updatedInterestPaid : [], // Create the interestPaid field if it doesn't exist
        status: updatedStatus,
      });

      toast.success(
        totalPaid >= amount
          ? "Loan fully paid!"
          : `Payment of ₦${paymentAmount} made successfully`,
        {
          position: toast.POSITION.TOP_RIGHT,
        }
      );
    } catch (error) {
      console.error("Error updating payment: ", error);
      toast.error("Failed to process payment. Please try again.", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };


  const handleReceivePayment = async (id) => {
    try {
      // Prompt the user to select payment type (Loan or Interest received)
      const paymentType = prompt("Enter 'loan' to receive loan payment or 'interest' to receive interest:", "loan");

      // Validate the entered payment type
      if (paymentType.toLowerCase() !== "loan" && paymentType.toLowerCase() !== "interest") {
        toast.error("Invalid payment type. Please enter 'loan' or 'interest'.", {
          position: toast.POSITION.TOP_RIGHT,
        });
        return;
      }

      // Prompt the user to enter the received payment amount
      const paymentAmount = parseFloat(prompt(`Enter the received ${paymentType} amount:`, "0"));

      // Validate the entered payment amount
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        toast.error("Invalid received amount. Please enter a valid number.", {
          position: toast.POSITION.TOP_RIGHT,
        });
        return;
      }

      // Create a new payment entry with the current date
      const newReceivedEntry = {
        amount: paymentAmount,
        date: new Date().toISOString(),
      };

      // Get the existing liability
      const liabilityToUpdate = state.liabilities.find((liability) => liability.id === id);

      // Initialize updated arrays for receivedLoan and receivedInterest
      let updatedReceivedLoan = Array.isArray(liabilityToUpdate.receivedLoan) ? [...liabilityToUpdate.receivedLoan] : [];
      let updatedReceivedInterest = Array.isArray(liabilityToUpdate.receivedInterest) ? [...liabilityToUpdate.receivedInterest] : [];

      // Update the relevant payment array based on user input
      if (paymentType.toLowerCase() === "loan") {
        updatedReceivedLoan.push(newReceivedEntry);
      } else if (paymentType.toLowerCase() === "interest") {
        updatedReceivedInterest.push(newReceivedEntry);
      }

      // Calculate the total amount received for the loan
      const totalReceived = updatedReceivedLoan.reduce((total, entry) => total + entry.amount, 0);

      // Update the status based on whether the disbursed loan is fully received
      const updatedStatus = totalReceived >= liabilityToUpdate.amount ? "received" : "unreceived";

      // Update the liability record in Firestore
      await updateDoc(doc(db, `companies/${state.selectedCompanyId}/liabilities`, id), {
        receivedLoan: updatedReceivedLoan, // Ensure it's updated as an array
        receivedInterest: updatedReceivedInterest.length > 0 ? updatedReceivedInterest : [], // Create the receivedInterest field if it doesn't exist
        status: updatedStatus,
      });

      toast.success(
        totalReceived >= liabilityToUpdate.amount
          ? "Loan fully received!"
          : `Received payment of ₦${paymentAmount} successfully`,
        {
          position: toast.POSITION.TOP_RIGHT,
        }
      );
    } catch (error) {
      console.error("Error updating received payment: ", error);
      toast.error("Failed to process received payment. Please try again.", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };



  const handleBack = () => {
    navigate("/inventory-page");
  };

  const calculateTotal = (field) => {
    return state.liabilities.reduce((total, liability) => {
      if (field === "loanBalance") {
        // Calculate loanBalance as the difference between amount and sum of amountPaid
        const totalPaid = Array.isArray(liability.amountPaid)
          ? liability.amountPaid.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
          : 0;
        return total + (liability.amount - totalPaid);
      } else if (field === "interestPaid") {
        // Calculate total interestPaid if the field is interestPaid
        return total + (Array.isArray(liability.interestPaid)
          ? liability.interestPaid.reduce((sum, interestItem) => sum + parseFloat(interestItem.amount || 0), 0)
          : parseFloat(liability.interestPaid || 0));
      } else if (Array.isArray(liability[field])) {
        // Handle cases where the field is an array
        return total + liability[field].reduce((sum, item) => sum + parseFloat(item.amount || item), 0);
      } else {
        // Handle cases where the field is a single value
        return total + parseFloat(liability[field] || 0);
      }
    }, 0);
  };




  const handleDelete = async (index) => {
    try {
      const liabilityToDelete = state.liabilities[index];
      await deleteDoc(doc(db, "liabilities", liabilityToDelete.id));
      dispatch({ type: 'DELETE_LIABILITY', payload: index });
      toast.success("Liability deleted successfully", { position: toast.POSITION.TOP_RIGHT });
    } catch (error) {
      console.error("Error deleting liability: ", error);
      toast.error("Failed to delete liability. Please try again later.", { position: toast.POSITION.TOP_RIGHT });
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        liabilityName,
        description,
        amount,
        dueDate,
        accountType,
        liabilityAccount,
        interestExpenseAccount,
        collectionDate,
        amountPaid,
        loanBalance,
        loanType,
        interest,
      } = liability;

      // Ensure that amountPaid is initialized as an array if it's not already
      const amountPaidArray = Array.isArray(amountPaid) ? amountPaid : [];

      const liabilityData = {
        liabilityName: liabilityName.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        dueDate,
        accountType,
        liabilityAccount,
        interestExpenseAccount,
        collectionDate,
        amountPaid: amountPaidArray, // Ensure it's always an array
        loanBalance: parseFloat(loanBalance),
        loanType,
        interest,
      };

      if (isEditing) {
        await updateDoc(doc(db, `companies/${state.selectedCompanyId}/liabilities`, currentLiabilityId), liabilityData);
        toast.success("Liability updated successfully", { position: toast.POSITION.TOP_RIGHT });
      } else {
        await addDoc(collection(db, `companies/${state.selectedCompanyId}/liabilities`), liabilityData);
        toast.success("Liability added successfully", { position: toast.POSITION.TOP_RIGHT });
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving liability: ", error);
      toast.error("Failed to save liability. Please try again later.", { position: toast.POSITION.TOP_RIGHT });
    } finally {
      setLoading(false);
    }
  };



  const handlePrint = () => {
    // const printContents = document.getElementById("liabilityTable").innerHTML;
    // const originalContents = document.body.innerHTML;

    // document.body.innerHTML = printContents;
    // window.print();
    // document.body.innerHTML = originalContents;
    // window.location.reload();
    window.print();
  };


  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:align-middle sm:max-w-lg sm:w-full w-full mx-4 my-8">
              <div className="bg-white p-4">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={handleBack} className="text-blue-500 text-lg cursor-pointer">
                    &#8592; Back
                  </button>
                  <h2 className="text-2xl font-bold flex-1 text-center">
                    {isEditing ? "Edit Liability" : "Add Liability"}
                  </h2>
                  <button onClick={handleCloseModal} className="text-gray-500">
                    <MdClose size={24} />
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Liability Name</label>
                    <input
                      type="text"
                      name="liabilityName"
                      value={liability.liabilityName}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                    <textarea
                      name="description"
                      value={liability.description}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                      rows="4"
                    ></textarea>
                  </div>
                  <hr className="my-6 border-gray-300" />
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Liability Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Amount</label>
                        <input
                          type="number"
                          name="amount"
                          value={liability.amount}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Due Date</label>
                        <input
                          type="date"
                          name="dueDate"
                          value={liability.dueDate}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Loan Collection/Receipt Date</label>
                        <input
                          type="date"
                          name="collectionDate"
                          value={liability.collectionDate}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Amount Paid</label>
                        <input
                          type="number"
                          name="amountPaid"
                          value={liability.amountPaid}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Loan Balance


                        </label>
                        <input
                          type="number"
                          name="loanBalance"
                          value={liability.loanBalance}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Loan Type</label>
                        <select
                          name="loanType"
                          value={liability.loanType}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"
                          required
                        >
                          <option value="">Select Loan Type</option>
                          <option value="Disbursed">Disbursed</option>
                          <option value="Received">Received</option>
                        </select>
                      </div>


                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Account Type</label>
                        <select
                          name="accountType"
                          value={liability.accountType}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"
                          required
                        >
                          <option value="">Select an Account Type</option>
                          <option value="Current Liabilities">Current Liabilities</option>
                          <option value="Accounts Payable">Accounts Payable</option>
                          <option value="Short-Term Debt">Short-Term Debt</option>
                          <option value="Long-Term Debt">Long-Term Debt</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Liability Account</label>
                        <input
                          type="text"
                          name="liabilityAccount"
                          value={liability.liabilityAccount}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Interest Expense Account</label>
                        <input
                          type="text"
                          name="interestExpenseAccount"
                          value={liability.interestExpenseAccount}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      {isEditing ? "Update Liability" : "Add Liability"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-2 mx-8">
        <button onClick={handleBack} className="text-blue-500 text-lg cursor-pointer">
          &#8592; Back
        </button>
        <h2 className="text-2xl font-bold text-center">Liability</h2>
        <div></div>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="min-w-full border border-collapse">
          <thead>
            <tr>
              <th className="border px-4 py-2">S/N</th>
              <th className="border px-4 py-2">Liability Name</th>
              <th className="border px-4 py-2">Description</th>
              <th className="border px-4 py-2">Liability Account</th>
              <th className="border px-4 py-2">Interest Expense Account</th>
              <th className="border px-4 py-2">Account Type</th>
              <th className="border px-4 py-2">Due Date</th>
              <th className="border px-4 py-2">Collection Date</th>
              
              <th className="border px-4 py-2">Disbursed Loan Amount</th>
              <th className="border px-4 py-2">Paid Interest</th>
              <th className="border px-4 py-2">Received Interest</th> {/* New Column */}
              <th className="border px-4 py-2">Received Loan Amount</th>
              <th className="border px-4 py-2">Total Amount Paid(RL)</th>
              <th className="border px-4 py-2">Total Amount Received(DL)</th>
              <th className="border px-4 py-2">Loan Balance</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(state.liabilities || []).map((liability, index) => {
              // const isFullyPaid = liability.loanBalance === 0 || liability.amountPaid >= liability.amount;

              return (
                <tr key={index}>
                  <td className="border px-4 py-2">{index + 1}</td>
                  <td className="border px-4 py-2">{liability.liabilityName}</td>
                  <td className="border px-4 py-2">{liability.description}</td>
                  <td className="border px-4 py-2">{liability.liabilityAccount}</td>
                  <td className="border px-4 py-2">{liability.interestExpenseAccount}</td>
                  <td className="border px-4 py-2">{liability.accountType}</td>
                  <td className="border px-4 py-2">{new Date(liability.dueDate).toLocaleDateString()}</td>
                  <td className="border px-4 py-2">{new Date(liability.collectionDate).toLocaleDateString()}</td>

              

                  <td className="border px-4 py-2">
                    ₦{liability.loanType === "Disbursed" ? liability.amount : " "}
                  </td>

                  {/* Display interest paid */}
                  <td className="border px-4 py-2">
                    {Array.isArray(liability.interestPaid) && liability.interestPaid.length > 0 ? (
                      <ul>
                        {liability.interestPaid.map((payment, index) => (
                          <li key={index}>
                            Amount: ₦{payment.amount}, Date: {new Date(payment.date).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No interest payments made yet.</p>
                    )}
                  </td>

                  {/* Display received interest */}
                  <td className="border px-4 py-2">
                    {Array.isArray(liability.receivedInterest) && liability.receivedInterest.length > 0 ? (
                      <ul>
                        {liability.receivedInterest.map((payment, index) => (
                          <li key={index}>
                            Amount: ₦{payment.amount}, Date: {new Date(payment.date).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No received interest recorded yet.</p>
                    )}
                  </td>

                  <td className="border px-4 py-2">
                    ₦{liability.loanType === "Received" ? liability.amount : ""}
                  </td>

                  {/* Display amount paid correctly */}
                  <td className="border px-4 py-2">
                    {liability.loanType === "Received" ? ( // Check if loanType is "Received"
                      Array.isArray(liability.amountPaid) && liability.amountPaid.length > 0 ? (
                        <ul>
                          {liability.amountPaid.map((payment, index) => (
                            <li key={index}>
                              Amount: ₦{payment.amount}, Date: {new Date(payment.date).toLocaleDateString()}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>N/A</p> // Show "N/A" instead of "No payments made yet."
                      )
                    ) : (
                      <p>N/A</p> // Handle cases where loanType is not "Received"
                    )}
                  </td>

                  {/* Received loans display */}
                  <td className="border px-4 py-2">
                    {liability.loanType === "Disbursed" ? (
                      Array.isArray(liability.receivedLoan) && liability.receivedLoan.length > 0 ? (
                        <ul>
                          {liability.receivedLoan.map((payment, index) => (
                            <li key={index}>
                              Amount: ₦{payment.amount}, Date: {new Date(payment.date).toLocaleDateString()}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>N/A</p> // Changed to show N/A instead of No payments made yet
                      )
                    ) : (
                      <p>N/A</p>
                    )}
                  </td>



                  {/* Balance calculation */}
                  <td className="border px-4 py-2">
                    {liability.loanType === "Disbursed" ? (
                      // When loanType is Disbursed, show the amount minus the total received loans
                      (liability.amount - (
                        Array.isArray(liability.receivedLoan)
                          ? liability.receivedLoan.reduce((total, payment) => total + parseFloat(payment.amount), 0)
                          : 0
                      )).toFixed(2)
                    ) : (
                      // When loanType is Received, show the amount minus the total amount paid
                      (liability.amount - (
                        Array.isArray(liability.amountPaid)
                          ? liability.amountPaid.reduce((total, payment) => total + parseFloat(payment.amount), 0)
                          : 0
                      )).toFixed(2)
                    )}
                  </td>


                  {/* Payment status */}
                  <td className="border px-4 py-2 text-center">
                    {liability.status} {/* Display the payment status directly */}
                  </td>


                  {/* Action buttons */}
                  <td className="border px-4 py-2 flex justify-center">
                    <button onClick={() => handleEdit(index)} className="text-blue-500 mx-2">
                      <MdEdit size={20} />
                    </button>
                    <button onClick={() => handleDelete(index)} className="text-red-500 mx-2">
                      <MdDelete size={20} />
                    </button>
                    <button
                      onClick={() => {
                        const action = prompt("Type 'receive' to receive interest or 'pay' to make a payment:", "pay");

                        if (action) {
                          if (action.toLowerCase() === "pay") {
                            if (liability.loanType === "Received") {
                              handlePay(liability.id, liability.amount, liability.amountPaid);
                            } else {
                              toast.error("You cannot make a payment on a Disbursed loan.", {
                                position: toast.POSITION.TOP_RIGHT,
                              });
                            }
                          } else if (action.toLowerCase() === "receive") {
                            if (liability.loanType === "Disbursed") {
                              handleReceivePayment(liability.id);
                            } else {
                              toast.error("You cannot receive interest on a Received loan.", {
                                position: toast.POSITION.TOP_RIGHT,
                              });
                            }
                          } else {
                            toast.error("Invalid action. Please type 'receive' or 'pay'.", {
                              position: toast.POSITION.TOP_RIGHT,
                            });
                          }
                        }
                      }}
                      className="no-print"
                      style={{
                        cursor: 'pointer',
                        marginLeft: '8px',
                        color: liability.amountPaid < liability.amount ? 'green' : 'blue',
                      }}
                      title="Payment"
                    >
                      <FontAwesomeIcon icon={faDollarSign} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr>
              <td className="border px-4 py-2 font-bold" colSpan="8">Total:</td>
              
              <td className="border px-4 py-2 font-bold text-right" style={{ fontSize: '14px' }}>
                ₦ {state.liabilities
                  .filter((liability) => liability.loanType === "Disbursed")
                  .reduce((total, liability) => total + (parseFloat(liability.amount) || 0), 0)
                  .toFixed(2)} {/* Total Disbursed Loan Amount */}
              </td>
              <td className="border px-4 py-2 font-bold text-right" style={{ fontSize: '14px' }}>
                ₦ {calculateTotal("interestPaid").toFixed(2)} {/* Total Paid Interest */}
              </td>
              <td className="border px-4 py-2 font-bold text-right" style={{ fontSize: '14px' }}>
                ₦ {calculateTotal("receivedInterest").toFixed(2)} {/* Total Received Interest */}
              </td>
              <td className="border px-4 py-2 font-bold text-right" style={{ fontSize: '14px' }}>
                ₦ {state.liabilities
                  .filter((liability) => liability.loanType === "Received")
                  .reduce((total, liability) => total + (parseFloat(liability.amount) || 0), 0)
                  .toFixed(2)} {/* Total Received Loan Amount */}
              </td>
              <td className="border px-4 py-2 font-bold text-right" style={{ fontSize: '14px' }}>
                ₦ {calculateTotal("amountPaid").toFixed(2)} {/* Total Amount Paid (RL) */}
              </td>
              <td className="border px-4 py-2 font-bold text-right" style={{ fontSize: '14px' }}>
                {calculateTotal("receivedLoan").toFixed(2)} {/* Total Received Loans */}
              </td>
              
              
            </tr>
          </tfoot>

        </table>

        {state.liabilities && state.liabilities.length === 0 && (
          <div className="text-center mt-4 text-gray-500">No liabilities found</div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2 p-2 mb-12">
        <button onClick={handlePrint} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Print Table
        </button>
        <button onClick={handleDownload} className="bg-green-500 text-white px-4 py-2 rounded-md">
          Download Table
        </button>
        <button onClick={handleOpenModal} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Add Liability
        </button>
      </div>

    </>
  );
}
