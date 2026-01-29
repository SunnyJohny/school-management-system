import React, { useState} from "react";
import { toast } from "react-toastify";
import Spinner from "./Spinner"; 
import { MdClose, MdEdit, MdDelete } from "react-icons/md";
import { doc, deleteDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { useMyContext } from '../Context/MyContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign } from '@fortawesome/free-solid-svg-icons';

import { useNavigate } from 'react-router';

export default function AddShares() {
  const navigate = useNavigate();
  const { state, dispatch } = useMyContext();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentShareId, setCurrentShareId] = useState(null);


  const [share, setShare] = useState({
    shareName: "",
    quantity: 0,
    purchasePrice: 0,
    purchaseDate: "",
    brokerAccount: "",
    dividendAccount: "",
    saleDate: "",
    amountReceived: 0,
    sharesSold: 0,
    totalInvestment: 0,
    currentPrice: 0,
    proceedsFromIssuance: 0, // Proceeds from issuing shares
    dividendsPaid: 0, // Total dividends paid to shareholders
  });


  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate loanBalance whenever amount or amountPaid changes


  const handleOpenModal = () => {
    setIsModalOpen(true);
  };




  const handleDownload = () => {
    // Function for downloading liabilities as CSV
  };



  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentShareId(null); // Update the ID to reflect shares instead of liabilities
    setShare({
      shareName: "",
      quantity: 0,
      purchasePrice: 0,
      purchaseDate: "",
      brokerAccount: "",
      dividendAccount: "",
      saleDate: "",
      amountReceived: 0,
      sharesSold: 0,
      totalInvestment: 0,
      currentPrice: 0,
      proceedsFromIssuance: 0,
      dividendsPaid: 0,
    });
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShare((prevShare) => ({
      ...prevShare,
      [name]: value,
    }));
  };

  const handleEditShare = (index) => {
    const shareToEdit = state.shares[index];
    setShare(shareToEdit);
    setCurrentShareId(shareToEdit.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };




  // const handlePayDividend = async (id, totalDividend) => {
  //   try {
  //     // Prompt the user to enter a dividend payment amount
  //     const dividendAmount = parseFloat(prompt("Enter the dividend payment amount:", "0"));

  //     // Validate the entered dividend amount
  //     if (isNaN(dividendAmount) || dividendAmount <= 0) {
  //       toast.error("Invalid payment amount. Please enter a valid number.", {
  //         position: toast.POSITION.TOP_RIGHT,
  //       });
  //       return;
  //     }

  //     // Get the existing share data from state.shares
  //     const shareToUpdate = state.shares.find((share) => share.id === id); // Changed shareId to id

  //     // If the share data is not found, handle it
  //     if (!shareToUpdate) {
  //       toast.error("Share not found.", {
  //         position: toast.POSITION.TOP_RIGHT,
  //       });
  //       return;
  //     }

  //     // Create a new dividend payment entry with the current date and shareName
  //     const newDividendEntry = {
  //       amount: dividendAmount,
  //       date: new Date().toISOString(),
  //       shareName: shareToUpdate.shareName, // Get the share name from the share data
  //     };

  //     // Initialize updated array for dividendPaid
  //     let updatedDividendPaid = Array.isArray(shareToUpdate.dividendPaid) 
  //       ? [...shareToUpdate.dividendPaid] 
  //       : [];

  //     // Add the new dividend payment entry to the array
  //     updatedDividendPaid.push(newDividendEntry);

  //     // Calculate the total dividend paid so far
  //     const totalDividendPaid = updatedDividendPaid.reduce(
  //       (total, entry) => total + entry.amount,
  //       0
  //     );

  //     // Update the status based on whether the dividend has been fully paid
  //     const updatedStatus = totalDividendPaid >= totalDividend ? "fully paid" : "partially paid";

  //     // Update the share's dividend record in Firestore
  //     await updateDoc(
  //       doc(db, `companies/${state.selectedCompanyId}/shares`, id), // Changed shareId to id
  //       {
  //         dividendPaid: updatedDividendPaid, // Ensure it's updated as an array
  //         status: updatedStatus,
  //       }
  //     );

  //     toast.success(
  //       totalDividendPaid >= totalDividend
  //         ? "Dividend fully paid!"
  //         : `Dividend payment of ₦${dividendAmount} recorded successfully.`,
  //       {
  //         position: toast.POSITION.TOP_RIGHT,
  //       }
  //     );
  //   } catch (error) {
  //     console.error("Error updating dividend payment: ", error);
  //     toast.error("Failed to process dividend payment. Please try again.", {
  //       position: toast.POSITION.TOP_RIGHT,
  //     });
  //   }
  // };





  // const handleReceivePayment = async (id) => {
  //   try {
  //     // Prompt the user to select payment type (Loan or Interest received)
  //     const paymentType = prompt("Enter 'loan' to receive loan payment or 'interest' to receive interest:", "loan");

  //     // Validate the entered payment type
  //     if (paymentType.toLowerCase() !== "loan" && paymentType.toLowerCase() !== "interest") {
  //       toast.error("Invalid payment type. Please enter 'loan' or 'interest'.", {
  //         position: toast.POSITION.TOP_RIGHT,
  //       });
  //       return;
  //     }

  //     // Prompt the user to enter the received payment amount
  //     const paymentAmount = parseFloat(prompt(`Enter the received ${paymentType} amount:`, "0"));

  //     // Validate the entered payment amount
  //     if (isNaN(paymentAmount) || paymentAmount <= 0) {
  //       toast.error("Invalid received amount. Please enter a valid number.", {
  //         position: toast.POSITION.TOP_RIGHT,
  //       });
  //       return;
  //     }

  //     // Create a new payment entry with the current date
  //     const newReceivedEntry = {
  //       amount: paymentAmount,
  //       date: new Date().toISOString(),
  //     };

  //     // Get the existing liability
  //     const liabilityToUpdate = state.liabilities.find((liability) => liability.id === id);

  //     // Initialize updated arrays for receivedLoan and receivedInterest
  //     let updatedReceivedLoan = Array.isArray(liabilityToUpdate.receivedLoan) ? [...liabilityToUpdate.receivedLoan] : [];
  //     let updatedReceivedInterest = Array.isArray(liabilityToUpdate.receivedInterest) ? [...liabilityToUpdate.receivedInterest] : [];

  //     // Update the relevant payment array based on user input
  //     if (paymentType.toLowerCase() === "loan") {
  //       updatedReceivedLoan.push(newReceivedEntry);
  //     } else if (paymentType.toLowerCase() === "interest") {
  //       updatedReceivedInterest.push(newReceivedEntry);
  //     }

  //     // Calculate the total amount received for the loan
  //     const totalReceived = updatedReceivedLoan.reduce((total, entry) => total + entry.amount, 0);

  //     // Update the status based on whether the disbursed loan is fully received
  //     const updatedStatus = totalReceived >= liabilityToUpdate.amount ? "received" : "unreceived";

  //     // Update the liability record in Firestore
  //     await updateDoc(doc(db, `companies/${state.selectedCompanyId}/liabilities`, id), {
  //       receivedLoan: updatedReceivedLoan, // Ensure it's updated as an array
  //       receivedInterest: updatedReceivedInterest.length > 0 ? updatedReceivedInterest : [], // Create the receivedInterest field if it doesn't exist
  //       status: updatedStatus,
  //     });

  //     toast.success(
  //       totalReceived >= liabilityToUpdate.amount
  //         ? "Loan fully received!"
  //         : `Received payment of ₦${paymentAmount} successfully`,
  //       {
  //         position: toast.POSITION.TOP_RIGHT,
  //       }
  //     );
  //   } catch (error) {
  //     console.error("Error updating received payment: ", error);
  //     toast.error("Failed to process received payment. Please try again.", {
  //       position: toast.POSITION.TOP_RIGHT,
  //     });
  //   }
  // };


  const handlePay = async (id, amount) => {
    try {
      // Prompt the user to select payment type (Loan or Interest)
      const paymentType = prompt("Enter 'Dividend' to pay the Dividend or 'interest' to pay interest:", "loan");

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
      const shareToUpdate = state.shares.find((share) => share.id === id);

      // Initialize updated arrays for amountPaid and interestPaid
      let updatedAmountPaid = Array.isArray(shareToUpdate.amountPaid) ? [...shareToUpdate.amountPaid] : [];
      let updatedInterestPaid = Array.isArray(shareToUpdate.interestPaid) ? [...shareToUpdate.interestPaid] : [];

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

      // Update the status based on whether the loan is fully paid
      const updatedStatus = totalPaid >= amount ? "paid" : "unpaid";

      // Update the share record in Firestore
      await updateDoc(doc(db, `companies/${state.selectedCompanyId}/shares`, id), {
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
  const handleBack = () => {
    navigate("/inventory-page");
  };

  // const calculateTotal = (field) => {
  //   return state.shares.reduce((total, liability) => {
  //     if (field === "loanBalance") {
  //       // Calculate loanBalance as the difference between amount and sum of amountPaid
  //       const totalPaid = Array.isArray(liability.amountPaid)
  //         ? liability.amountPaid.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
  //         : 0;
  //       return total + (liability.amount - totalPaid);
  //     } else if (field === "interestPaid") {
  //       // Calculate total interestPaid if the field is interestPaid
  //       return total + (Array.isArray(liability.interestPaid)
  //         ? liability.interestPaid.reduce((sum, interestItem) => sum + parseFloat(interestItem.amount || 0), 0)
  //         : parseFloat(liability.interestPaid || 0));
  //     } else if (Array.isArray(liability[field])) {
  //       // Handle cases where the field is an array
  //       return total + liability[field].reduce((sum, item) => sum + parseFloat(item.amount || item), 0);
  //     } else {
  //       // Handle cases where the field is a single value
  //       return total + parseFloat(liability[field] || 0);
  //     }
  //   }, 0);
  // };


  const handleReceiveShareProceeds = async (id) => {
    try {
      // Prompt the user to select payment type (Shares issued or Dividends received)
      const paymentType = prompt("Enter 'issuance' to receive proceeds from share issuance or 'dividend' to receive dividend:", "issuance");

      // Validate the entered payment type
      if (paymentType.toLowerCase() !== "issuance" && paymentType.toLowerCase() !== "dividend") {
        toast.error("Invalid payment type. Please enter 'issuance' or 'dividend'.", {
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

      // Create a new received entry with the current date
      const newReceivedEntry = {
        amount: paymentAmount,
        date: new Date().toISOString(),
      };

      // Get the existing share record
      const shareToUpdate = state.shares.find((share) => share.id === id);

      // Initialize updated arrays for proceeds from share issuance and dividends received
      let updatedShareIssuanceProceeds = Array.isArray(shareToUpdate.shareIssuanceProceeds) ? [...shareToUpdate.shareIssuanceProceeds] : [];
      let updatedDividendsReceived = Array.isArray(shareToUpdate.dividendsReceived) ? [...shareToUpdate.dividendsReceived] : [];

      // Update the relevant array based on user input
      if (paymentType.toLowerCase() === "issuance") {
        updatedShareIssuanceProceeds.push(newReceivedEntry);
      } else if (paymentType.toLowerCase() === "dividend") {
        updatedDividendsReceived.push(newReceivedEntry);
      }

      // Calculate the total proceeds received for the share issuance
      const totalProceedsReceived = updatedShareIssuanceProceeds.reduce((total, entry) => total + entry.amount, 0);

      // Update the status based on whether all proceeds from the share issuance have been received
      const updatedStatus = totalProceedsReceived >= shareToUpdate.issuanceAmount ? "fully received" : "partially received";

      // Update the share record in Firestore
      await updateDoc(doc(db, `companies/${state.selectedCompanyId}/shares`, id), {
        shareIssuanceProceeds: updatedShareIssuanceProceeds, // Ensure it's updated as an array
        dividendsReceived: updatedDividendsReceived.length > 0 ? updatedDividendsReceived : [], // Create the dividendsReceived field if it doesn't exist
        status: updatedStatus,
      });

      toast.success(
        totalProceedsReceived >= shareToUpdate.issuanceAmount
          ? "Share issuance fully received!"
          : `Received proceeds of ₦${paymentAmount} successfully`,
        {
          position: toast.POSITION.TOP_RIGHT,
        }
      );
    } catch (error) {
      console.error("Error updating received payment: ", error);
      toast.error("Failed to process received proceeds. Please try again.", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };


  const handleDeleteShare = async (index) => {
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
        shareholderName,
        description,
        numberOfShares,
        sharePrice,
        dueDate,
        issueDate,
        amountPaid,
      } = share;

      // Validate required fields
      if (!shareholderName || numberOfShares <= 0 || sharePrice < 0 || !issueDate) {
        toast.error("Please fill in all required fields correctly.", { position: toast.POSITION.TOP_RIGHT });
        setLoading(false);
        return; // Stop submission if validation fails
      }

      // Prepare share data object
      const shareData = {
        shareholderName: shareholderName.trim(),
        description: description.trim(),
        numberOfShares: parseInt(numberOfShares, 10),
        sharePrice: parseFloat(sharePrice),
        dueDate,
        issueDate,
        amountPaid: parseFloat(amountPaid),
      };

      if (isEditing) {
        await updateDoc(doc(db, `companies/${state.selectedCompanyId}/shares`, currentShareId), shareData);
        toast.success("Share updated successfully", { position: toast.POSITION.TOP_RIGHT });
      } else {
        await addDoc(collection(db, `companies/${state.selectedCompanyId}/shares`), shareData);
        toast.success("Share added successfully", { position: toast.POSITION.TOP_RIGHT });
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving share: ", error);
      toast.error("Failed to save share. Please try again later.", { position: toast.POSITION.TOP_RIGHT });
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
                    <label className="block text-gray-700 text-sm font-bold mb-2">Share Name</label>
                    <input
                      type="text"
                      name="shareName"
                      value={share.shareName}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                    <textarea
                      name="description"
                      value={share.description}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                      rows="4"
                    ></textarea>
                  </div>
                  <hr className="my-6 border-gray-300" />
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Shares Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Number of Shares</label>
                        <input
                          type="number"
                          name="numberOfShares"
                          value={share.numberOfShares}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Share Price</label>
                        <input
                          type="number"
                          name="sharePrice"
                          value={share.sharePrice}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Total Investment</label>
                        <input
                          type="number"
                          name="totalInvestment"
                          value={share.totalInvestment}
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
                          value={share.dueDate}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Date of Issue</label>
                        <input
                          type="date"
                          name="issueDate"
                          value={share.issueDate}
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
                          value={share.amountPaid}
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
                      {isEditing ? "Update Shares" : "Add Shares"}
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
        <h2 className="text-2xl font-bold text-center">Share</h2>
        <div></div>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="min-w-full border border-collapse">
        <thead className="sticky top-0 bg-white z-10">
            <tr>
              <th className="border px-4 py-2">S/N</th>
              <th className="border px-4 py-2">Share Name</th>
              <th className="border px-4 py-2">Number of Shares</th>
              <th className="border px-4 py-2">Share Price (₦)</th>
              <th className="border px-4 py-2">Total Investment (₦)</th>
              <th className="border px-4 py-2">Proceeds from Issuance (₦)</th>
              <th className="border px-4 py-2">Dividends Paid (₦)</th>
              <th className="border px-4 py-2">Description</th>
              <th className="border px-4 py-2">Issue Date</th>
              <th className="border px-4 py-2">Due Date</th>
              <th className="border px-4 py-2">Amount Paid (₦)</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(state.shares || []).map((share, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">{index + 1}</td>
                <td className="border px-4 py-2">{share.shareName || "N/A"}</td>
                <td className="border px-4 py-2">{share.numberOfShares || 0}</td>
                <td className="border px-4 py-2">₦{share.sharePrice ? parseFloat(share.sharePrice).toFixed(2) : '0.00'}</td>
                <td className="border px-4 py-2">
                  ₦{(share.numberOfShares && share.sharePrice) ? (share.numberOfShares * share.sharePrice).toFixed(2) : '0.00'}
                </td>
                <td className="border px-4 py-2">
                    {Array.isArray(share.shareIssuanceProceeds) && share.shareIssuanceProceeds.length > 0 ? (
                      <ul>
                        {share.shareIssuanceProceeds.map((payment, index) => (
                          <li key={index}>
                            Amount: ₦{payment.amount}, Date: {new Date(payment.date).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No received proceeds recorded yet.</p>
                    )}
                  </td>
                {/* Display amount paid correctly */}
                <td className="border px-4 py-2">
                  {share ? ( // Check if loanType is "Received"
                    Array.isArray(share.amountPaid) && share.amountPaid.length > 0 ? (
                      <ul>
                        {share.amountPaid.map((payment, index) => (
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
                <td className="border px-4 py-2">{share.description || "N/A"}</td>
                <td className="border px-4 py-2">
                  {share.issueDate ? new Date(share.issueDate).toLocaleDateString() : "N/A"}
                </td>
                <td className="border px-4 py-2">
                  {share.dueDate ? new Date(share.dueDate).toLocaleDateString() : "N/A"}
                </td>
                <td className="border px-4 py-2">₦{share.amountPaid ? parseFloat(share.amountPaid).toFixed(2) : '0.00'}</td>
                {/* Action buttons */}
                <td className="border px-4 py-2 flex justify-center">
                  <button onClick={() => handleEditShare(index)} className="text-blue-500 mx-2">
                    <MdEdit size={20} />
                  </button>
                  <button onClick={() => handleDeleteShare(index)} className="text-red-500 mx-2">
                    <MdDelete size={20} />
                  </button>
                  <button
                    onClick={() => {
                      const action = prompt("Type 'receive' to receive proceeds from share issuance or 'pay' to make a payment:", "pay");

                      if (action) {
                        if (action.toLowerCase() === "pay") {
                          handlePay(share.id, share.amount);
                        } else if (action.toLowerCase() === "receive") {
                          handleReceiveShareProceeds(share.id); // Call the handleReceiveShareProceeds function when action is 'receive'
                        } else {
                          toast.error("Invalid action. Please enter 'receive' or 'pay'.", {
                            position: toast.POSITION.TOP_RIGHT,
                          });
                        }
                      }
                    }}
                    className="no-print"
                    style={{
                      cursor: 'pointer',
                      marginLeft: '8px',
                      // color: liability.amountPaid < liability.amount ? 'green' : 'blue',
                    }}
                    title="Payment"
                  >
                    <FontAwesomeIcon icon={faDollarSign} />
                  </button>


                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {state.shares && state.shares.length === 0 && (
          <div className="text-center mt-4 text-gray-500">No Shares found</div>
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
          Add Share
        </button>
      </div>

    </>
  );
}
