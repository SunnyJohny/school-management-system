import React, { useState } from "react";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";
import { MdClose } from "react-icons/md";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faDollarSign } from '@fortawesome/free-solid-svg-icons';

import { doc, updateDoc, addDoc, collection } from "firebase/firestore";

import { db } from "../firebase"; // Adjust the import path as necessary
import { useMyContext } from '../Context/MyContext';
import { useNavigate } from 'react-router';


export default function AddAsset() {
  const navigate = useNavigate();
  const { state, calculateTotal } = useMyContext();
  const [hoveredInterest, setHoveredInterest] = useState(null);
  const [hoveredDividend, setHoveredDividend] = useState(null);


  const [currentAssetId, setCurrentAssetId] = useState(null);

  const [loading, setLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [asset, setAsset] = useState({
    assetName: "",
    description: "",
    purchasePrice: 0,
    amount: 0,
    salvageValue: 0,
    depreciationStartDate: "",
    depreciationMethod: "",
    usefulLife: 0,
    assetAccount: "",
    depreciationExpenseAccount: "",
    marketValue: "",
    active: true, // Add the active field
    interestReceived: [], // Initialize as an empty array
    dividendsReceived: [], // Initialize as an empty array
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };


  const handleEditAsset = (asset) => {
    setAsset(asset);
    setCurrentAssetId(asset.id); // Set currentAssetId when editing an asset
    setIsEditing(true);
  };;

  const handleDelete = (id) => {
    console.log(`Delete asset with ID: ${id}`);
  };


  // Custom confirmation function using Toastify
  const showConfirmationPrompt = (message, title, type = 'text') => {
    return new Promise((resolve, reject) => {
      const input = window.prompt(`${title}\n${message}`);

      if (input !== null) {
        resolve(input); // Resolve with the entered value
      } else {
        reject(); // Reject if canceled
      }
    });
  };


  const handleSell = async (id) => {
    const asset = state.assets.find((asset) => asset.id === id);

    if (asset && asset.status === "sold") {
      toast.info("Asset already sold", { position: toast.POSITION.TOP_RIGHT });
      return;
    }

    try {
      // Prompt for the sold price
      const soldPrice = await showConfirmationPrompt("Enter the sold price:", "Confirm Sale");

      // Proceed only if soldPrice is valid
      if (soldPrice !== null) {
        // Prompt for the sold date
        const soldDateInput = await showConfirmationPrompt("Enter the sold date and time (YYYY-MM-DDTHH:MM):", "Confirm Sale");

        if (soldDateInput !== null) {
          // Validate the input and convert it to the correct format
          const soldDate = new Date(soldDateInput);

          if (isNaN(soldDate.getTime())) {
            toast.error("Invalid date format. Please use YYYY-MM-DDTHH:MM format.", { position: toast.POSITION.TOP_RIGHT });
            return;
          }

          // Format the date as 'YYYY-MM-DDTHH:MM'
          const formattedSoldDate = soldDate.toISOString().slice(0, 16);

          const confirmSale = window.confirm("Are you sure you want to mark this asset as sold?");

          if (confirmSale) {
            await updateDoc(doc(db, `companies/${state.selectedCompanyId}/assets`, id), {
              status: 'sold',
              soldPrice: parseFloat(soldPrice),  // Save the sold price
              soldDate: formattedSoldDate,       // Save the formatted sold date as a string
            });
            toast.success("Asset marked as sold", { position: toast.POSITION.TOP_RIGHT });
          } else {
            toast.info("Action canceled", { position: toast.POSITION.TOP_RIGHT });
          }
        }
      }
    } catch (error) {
      console.error("Error selling asset: ", error);
      toast.error("Failed to mark asset as sold. Please try again later.", { position: toast.POSITION.TOP_RIGHT });
    }
  };



  // Function to handle adding interest received
  const handleInterestReceived = async (assetId) => {
    try {
      const asset = state.assets.find((asset) => asset.id === assetId);

      // Prompt for the amount received
      const receivedAmount = await showConfirmationPrompt("Enter the interest amount received:", "Interest Received");

      // Proceed only if receivedAmount is valid
      if (receivedAmount !== null) {
        // Prompt for the date received
        const receivedDateInput = await showConfirmationPrompt("Enter the date received (YYYY-MM-DDTHH:MM):", "Interest Received");

        if (receivedDateInput !== null) {
          // Validate the date input and convert it to the correct format
          const receivedDate = new Date(receivedDateInput);

          if (isNaN(receivedDate.getTime())) {
            toast.error("Invalid date format. Please use YYYY-MM-DDTHH:MM format.", { position: toast.POSITION.TOP_RIGHT });
            return;
          }

          // Format the date as 'YYYY-MM-DDTHH:MM'
          const formattedReceivedDate = receivedDate.toISOString().slice(0, 16);

          // Create a new entry for interest received
          const newInterestEntry = {
            amount: parseFloat(receivedAmount),
            date: formattedReceivedDate,
          };

          // Update the Firestore document with the new interest received entry
          const updatedInterestReceived = asset.interestReceived
            ? [...asset.interestReceived, newInterestEntry]
            : [newInterestEntry];

          await updateDoc(doc(db, `companies/${state.selectedCompanyId}/assets`, assetId), {
            interestReceived: updatedInterestReceived,
          });

          toast.success("Interest received entry added", { position: toast.POSITION.TOP_RIGHT });
        }
      }
    } catch (error) {
      console.error("Error adding interest received: ", error);
      toast.error("Failed to add interest received. Please try again later.", { position: toast.POSITION.TOP_RIGHT });
    }
  };

  // Function to handle adding dividend received
  const handleDividendReceived = async (assetId) => {
    try {
      const asset = state.assets.find((asset) => asset.id === assetId);

      // Prompt for the dividend amount received
      const receivedAmount = await showConfirmationPrompt("Enter the dividend amount received:", "Dividend Received");

      // Proceed only if receivedAmount is valid
      if (receivedAmount !== null) {
        // Prompt for the date received
        const receivedDateInput = await showConfirmationPrompt("Enter the date received (YYYY-MM-DDTHH:MM):", "Dividend Received");

        if (receivedDateInput !== null) {
          // Validate the date input and convert it to the correct format
          const receivedDate = new Date(receivedDateInput);

          if (isNaN(receivedDate.getTime())) {
            toast.error("Invalid date format. Please use YYYY-MM-DDTHH:MM format.", { position: toast.POSITION.TOP_RIGHT });
            return;
          }

          // Format the date as 'YYYY-MM-DDTHH:MM'
          const formattedReceivedDate = receivedDate.toISOString().slice(0, 16);

          // Create a new entry for dividend received
          const newDividendEntry = {
            amount: parseFloat(receivedAmount),
            date: formattedReceivedDate,
          };

          // Update the Firestore document with the new dividend received entry
          const updatedDividendReceived = asset.dividendReceived
            ? [...asset.dividendReceived, newDividendEntry]
            : [newDividendEntry];

          await updateDoc(doc(db, `companies/${state.selectedCompanyId}/assets`, assetId), {
            dividendReceived: updatedDividendReceived,
          });

          toast.success("Dividend received entry added", { position: toast.POSITION.TOP_RIGHT });
        }
      }
    } catch (error) {
      console.error("Error adding dividend received: ", error);
      toast.error("Failed to add dividend received. Please try again later.", { position: toast.POSITION.TOP_RIGHT });
    }
  };


  // const handleSell = (id) => {
  //   const confirmation = new ConfirmationToast({
  //     message: "Are you sure you want to sell this asset?",
  //     onConfirm: async () => {
  //       try {
  //         await updateDoc(doc(db, `companies/${state.selectedCompanyId}/assets`, id), {
  //           status: 'sold',
  //         });
  //         toast.success("Asset marked as sold", { position: toast.POSITION.TOP_RIGHT });
  //       } catch (error) {
  //         console.error("Error selling asset: ", error);
  //         toast.error("Failed to mark asset as sold. Please try again later.", { position: toast.POSITION.TOP_RIGHT });
  //       }
  //     },
  //     onCancel: () => {
  //       toast.info("Action cancelled", { position: toast.POSITION.TOP_RIGHT });
  //     },
  //   });

  //   confirmation.showToast();
  // };





  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "marketValue" && value === "Add New") {
      setAsset((prevAsset) => ({
        ...prevAsset,
        assetName: value,
        [name]: value,
      }));
    } else {
      setAsset((prevAsset) => ({
        ...prevAsset,
        [name]: value,
      }));
    }
  };

  const handlePrint = () => {
    // Define a print-specific CSS style
    const printStyle = `
      @media print {
        body * {
          visibility: hidden;
        }
        .printable-content, .printable-content * {
          visibility: visible;
        }
      }
    `;

    // Create a new window to print only the desired content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>${printStyle}</style>
        </head>
        <body>
          <div class="printable-content">
            <h2 class="text-2xl font-bold mb-4" text-center>Fixed Asset</h2>
            <!-- Table to display data -->
            <div class="overflow-x-auto">
              <table class="min-w-full border border-collapse">
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>Asset Name</th>
                    <th>Description</th>
                    <th>Accumulated Depreciation Account</th>
                    <th>Asset Account</th>
                    <th>Depreciation Expense Account</th>
                    <th>Depreciation Method</th>
                    <th>Depreciation Start Date</th>
                    <th>Date Added</th>
                    <th>Purchase Price</th>
                    <th>Salvage Value</th>
                    <th>Market Value</th>
                    <th>Useful Life</th>
                    <th>Useful Life</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.assets.map((asset, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${asset.assetName}</td>
                      <td>${asset.description}</td>
                      <td>${asset.marketValue}</td>
                      <td>${asset.assetAccount}</td>
                      <td>${asset.depreciationExpenseAccount}</td>
                      <td>${asset.depreciationMethod}</td>
                      <td>${asset.depreciationStartDate}</td>
                      <td>${asset.addedtDate}</td>
                      <td>${asset.amount}</td>
                      <td>${asset.purchasePrice}</td>
                      <td>${asset.salvageValue}</td>
                      <td>${asset.usefulLife}</td>
    
                    </tr>
                  `).join('')}
                </tbody>
                <!-- Footer with totals -->
                <tfoot>
                  <tr>
                    <td colspan="7"></td>
                    <td class="font-bold">Totals:</td>
                    <td class="font-bold">₦ ${calculateTotal("purchasePrice")}</td>
                    <td class="font-bold">₦ ${calculateTotal("amount")}</td>
                    <td class="font-bold">₦ ${calculateTotal("salvageValue")}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };


  const handleDownload = () => {
    const header = [
      "S/N",
      "Asset Name",
      "Description",
      "Accumulated Depreciation Account",
      "Asset Account",
      "Depreciation Expense Account",
      "Depreciation Method",
      "Depreciation Start Date",
      "Purchase Price",
      "Salvage Value",
      "Market Value",
      "Useful Life"
    ];

    const rows = state.assets.map((asset, index) => [
      index + 1,
      asset.assetName,
      asset.description,
      asset.marketValue,
      asset.assetAccount,
      asset.depreciationExpenseAccount,
      asset.depreciationMethod,
      asset.depreciationStartDate,
      asset.addedDate,
      asset.amount,
      asset.purchasePrice,
      asset.salvageValue,
      asset.usefulLife
    ]);

    const footer = [
      "",
      "",
      "",
      "",
      "",
      "",
      "Totals:",
      "",
      calculateTotal("purchasePrice"),
      calculateTotal("amount"),
      calculateTotal("salvageValue"),
      ""
    ];

    const csvContent = [
      header,
      ...rows,
      footer
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "assets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBack = () => {
    navigate("/inventory-page");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        assetName,
        description,
        amount,
        purchasePrice,
        salvageValue,
        depreciationStartDate,
        addedDate,
        depreciationMethod,
        usefulLife,
        assetAccount,
        depreciationExpenseAccount,
        marketValue,
        interestReceived,
        dividendsReceived,
        assetType,
      } = asset;

      const assetData = {
        assetName: assetName.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        purchasePrice: parseFloat(purchasePrice),
        salvageValue: parseFloat(salvageValue),
        depreciationStartDate,
        addedDate,
        depreciationMethod,
        usefulLife: parseFloat(usefulLife),
        assetAccount,
        depreciationExpenseAccount,
        marketValue,
        assetType,
        status: 'active', // Initialize the status as 'active'
        interestReceived, // Include interestReceived array
        dividendsReceived, // Include dividendsReceived array
      };

      if (isEditing) {
        await updateDoc(doc(db, `companies/${state.selectedCompanyId}/assets`, currentAssetId), assetData);
        toast.success("Asset updated successfully", { position: toast.POSITION.TOP_RIGHT });
      } else {
        await addDoc(collection(db, `companies/${state.selectedCompanyId}/assets`), assetData);
        toast.success("Asset added successfully", { position: toast.POSITION.TOP_RIGHT });
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving asset: ", error);
      toast.error("Failed to save asset. Please try again later.", { position: toast.POSITION.TOP_RIGHT });
    } finally {
      setLoading(false);
    }
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
                  <h2 className="text-2xl font-bold flex-1 text-center">Add Asset</h2>
                  <button onClick={handleCloseModal} className="text-gray-500">
                    <MdClose size={24} />
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Asset Name</label>
                    <input
                      type="text"
                      name="assetName"
                      value={asset.assetName}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"

                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                    <textarea
                      name="description"
                      value={asset.description}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"

                      rows="4"
                    ></textarea>
                  </div>

                  {/* Divider line */}
                  <hr className="my-6 border-gray-300" />

                  {/* Depreciation Details */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Depreciation Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Purchase Price</label>
                        <input
                          type="number"
                          name="purchasePrice"
                          value={asset.purchasePrice}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"

                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Asset Amount</label>
                        <input
                          type="number"
                          name="amount"
                          value={asset.Amount}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"

                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Salvage Value</label>
                        <input
                          type="number"
                          name="salvageValue"
                          value={asset.salvageValue}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"

                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Market Value</label>
                        <input
                          type="number"
                          name="marketValue"
                          value={asset.marketValue}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"

                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Date Added</label>
                        <input
                          type="datetime-local"
                          name="addedDate"
                          value={asset.addedDate}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"

                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Depreciation Start Date</label>
                        <input
                          type="datetime-local"
                          name="depreciationStartDate"
                          value={asset.depreciationStartDate}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"

                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Depreciation Method</label>
                        <select
                          name="depreciationMethod"
                          value={asset.depreciationMethod}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"

                        >
                          <option value="">Select Depreciation Method</option>
                          <option value="Straight">Straight</option>
                          <option value="Double Declining">Double Declining</option>
                          <option value="150% Accelerated">150% Accelerated</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Useful Life</label>
                        <input
                          type="number"
                          name="usefulLife"
                          value={asset.usefulLife}
                          onChange={handleInputChange}
                          className="border rounded-md w-full p-2"

                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider line */}
                  <hr className="my-6 border-gray-300" />

                  {/* Accounts Details */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Accounts Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Asset Account</label>
                        <select
                          name="assetAccount"
                          value={asset.assetAccount}
                          onChange={(e) => {
                            const newValue = e.target.value === "Add New" ? "" : e.target.value;
                            handleInputChange({ target: { name: e.target.name, value: newValue } });
                          }}
                          className="border rounded-md w-full p-2"

                        >
                          <option value="">Select Asset Account</option>
                          <option value="Add New">Add New</option>
                          <option value="15000">Fixed Asset: Furniture and Equipment</option>
                          <option value="15100">Fixed Asset: Vehicles</option>
                          <option value="15200">Fixed Asset: Buildings and Improvements</option>
                          <option value="15300">Fixed Asset: Land</option>
                          <option value="1700">Fixed Asset: Accumulated Depreciation</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Asset Type</label>
                        <select
                          name="assetType"
                          value={asset.assetType}
                          onChange={(e) => {
                            const newValue = e.target.value === "Add New" ? "" : e.target.value;
                            handleInputChange({ target: { name: e.target.name, value: newValue } });
                          }}
                          className="border rounded-md w-full p-2"

                        >
                          <option value="">Select Asset Type</option>
                          <option value="Add New">Add New</option>
                          <option value="cash">Cash</option>
                          <option value="checking">Checking</option>
                          <option value="cashEquivalents">Cash Equivalents</option>
                          <option value="accountsReceivable">Accounts Receivable</option>
                          <option value="inventory">Inventory</option>
                          <option value="nonCurrentAssets">Non-Current Assets</option>
                          <option value="fixedAssets">Fixed Assets</option>
                          <option value="otherAssets">Other Assets</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Depreciation Expense Account</label>
                        <select
                          name="depreciationExpenseAccount"
                          value={asset.depreciationExpenseAccount}
                          onChange={(e) => {
                            const newValue = e.target.value === "Add New" ? "" : e.target.value;
                            handleInputChange({ target: { name: e.target.name, value: newValue } });
                          }}
                          className="border rounded-md w-full p-2"

                        >
                          <option value="">Select Depreciation Expense Account</option>
                          <option value="Add New">Add New</option>
                          <option value="80100">Fixed Asset: Other Expenses</option>
                          <option value="Ask My Accountant">Fixed Asset: Ask My Accountant</option>
                          <option value="Depreciation Other Account">Fixed Asset: Depreciation Other Account</option>
                          <option value="Interest Paid on Loan Other Account">Fixed Asset: Interest Paid on Loan Other Account</option>
                          <option value="Reconciliation Discrepancy Other Account">Fixed Asset: Reconciliation Discrepancy Other Account</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Accumulated Depreciation Account</label>
                        <select
                          name="marketValue"
                          value={asset.marketValue}
                          onChange={(e) => {
                            const newValue = e.target.value === "Add New" ? "" : e.target.value;
                            handleInputChange({ target: { name: e.target.name, value: newValue } });
                          }}
                          className="border rounded-md w-full p-2"

                        >
                          <option value="">Select Accumulated Depreciation Account</option>
                          <option value="Add New">Add New</option>
                          <option value="15000">Fixed Asset: Furniture and Equipment</option>
                          <option value="15100">Fixed Asset: Vehicles</option>
                          <option value="15200">Fixed Asset: Buildings and Improvements</option>
                          <option value="15300">Fixed Asset: Land</option>
                          <option value="1700">Fixed Asset: Accumulated Depreciation</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Divider line */}
                  <hr className="my-6 border-gray-300" />

                  {/* Save Button */}
                  <div className="text-center">
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-4 mx-8">
        <button onClick={handleBack} className="text-blue-500 text-lg cursor-pointer">
          &#8592; Back
        </button>
        <h2 className="text-2xl font-bold text-center">Assets</h2>
        <div></div> {/* Adjust this empty div for spacing if needed */}
      </div>
      {/* Table to display data */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-collapse">
        <thead className="sticky top-0 bg-white z-10">
            <tr>
              <th className="border px-4 py-2">S/N</th>
              <th className="border px-4 py-2">Asset Name</th>
              <th className="border px-4 py-2">Description</th>
              <th className="border px-4 py-2">Amount</th>
              <th className="border px-4 py-2">Purchase Price</th>
              <th className="border px-4 py-2">Salvage Value</th>
              <th className="border px-4 py-2">Market Value</th>
              <th className="border px-4 py-2">Sold Value</th>
              <th className="border px-4 py-2">Asset Account</th>
              <th className="border px-4 py-2">Asset Type</th>
              <th className="border px-4 py-2">Depreciation Expense Account</th>
              <th className="border px-4 py-2">Depreciation Method</th>
              <th className="border px-4 py-2">Date Added</th>
              <th className="border px-4 py-2">Depreciation Start Date</th>
              <th className="border px-4 py-2">Useful Life</th>
              <th className="border px-4 py-2">Interest Received</th>
              <th className="border px-4 py-2">Dividend Received</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {state.assets.map((asset, index) => (
              <tr
                key={asset.id} // Added key prop
                className={asset.status === "sold" ? "bg-gray-200 text-gray-500" : ""}
                style={asset.status === "sold" ? { opacity: 0.6 } : {}}
              >
                <td>{index + 1}</td>
                <td>{asset.assetName}</td>
                <td>{asset.description}</td>
                <td>{asset.amount}</td>
                <td>{asset.purchasePrice}</td>
                <td>{asset.salvageValue}</td>
                <td>{asset.marketValue}</td>
                <td>{asset.soldPrice}</td>
                <td>{asset.assetAccount}</td>
                <td>{asset.assetType}</td> {/* Corrected to assetType */}
                <td>{asset.depreciationExpenseAccount}</td>
                <td>{asset.depreciationMethod}</td>
                <td>{asset.dateAdded}</td> {/* Corrected to dateAdded */}
                <td>{asset.depreciationStartDate}</td>
                <td>{asset.usefulLife}</td>

                {/* Interest Received Column with Hover */}
                <td
                  className="relative cursor-pointer text-blue-500"
                  onMouseEnter={() => setHoveredInterest(index)}
                  onMouseLeave={() => setHoveredInterest(null)}
                  onClick={(e) => handleInterestReceived(asset.id, e)}
                  title="Click To View Or Add Interest Received"
                >
                  {/* Display total interest received or 0 */}
                  {asset.interestReceived ? asset.interestReceived.reduce((total, entry) => total + entry.amount, 0) : 0}
                  {hoveredInterest === index && asset.interestReceived?.length > 0 && (
                    <div className="absolute left-0 mt-2 bg-white border rounded shadow-lg p-2 z-10 w-40">
                      <strong>Interest Details:</strong>
                      <ul className="list-disc pl-4">
                        {asset.interestReceived.map((interest, i) => (
                          <li key={i}>
                            {interest.date}: ₦{interest.amount}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </td>

                {/* Dividend Received Column with Hover */}
                <td
                  className="relative cursor-pointer text-blue-500"
                  onMouseEnter={() => setHoveredDividend(index)}
                  onMouseLeave={() => setHoveredDividend(null)}
                  onClick={(e) => handleDividendReceived(asset.id, e)}
                  title="Click To View Or Add Dividend Received"
                >
                  {/* Display total dividend received or 0 */}
                  {asset.dividendReceived ? asset.dividendReceived.reduce((total, entry) => total + entry.amount, 0) : 0}
                  {hoveredDividend === index && asset.dividendReceived?.length > 0 && (
                    <div className="absolute left-0 mt-2 bg-white border rounded shadow-lg p-2 z-10 w-40">
                      <strong>Dividend Details:</strong>
                      <ul className="list-disc pl-4">
                        {asset.dividendReceived.map((dividend, i) => (
                          <li key={i}>
                            {dividend.date}: ₦{dividend.amount}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </td>

                <td>{asset.status === "active" ? "Active" : "Sold"}</td> {/* Display asset status */}
                <td>
                  <>
                    <FontAwesomeIcon
                      icon={faEdit}
                      className="no-print"
                      style={{ cursor: 'pointer', marginRight: '8px', color: 'blue' }}
                      onClick={(e) => handleEditAsset(asset.id, e)}
                      title="Edit"
                    />
                    <FontAwesomeIcon
                      icon={faTrash}
                      className="no-print"
                      style={{ cursor: 'pointer', color: 'red' }}
                      onClick={() => handleDelete(asset.id)}
                      title="Delete"
                    />
                    <FontAwesomeIcon
                      icon={faDollarSign} // Sell icon
                      className="no-print"
                      style={{ cursor: 'pointer', marginLeft: '8px', color: asset.status === 'sold' ? 'gray' : 'green' }}
                      onClick={() => handleSell(asset.id, asset.status)} // Pass asset status
                      title={asset.status === 'sold' ? "Already sold" : "Sell"} // Update title based on status
                    />
                  </>
                </td>
              </tr>
            ))}
          </tbody>

          {/* Footer with totals */}
          <tfoot>
            <tr>
              <td colSpan="2"></td>
              <td className="font-bold">Totals:</td>
              <td className="font-bold">₦{calculateTotal("amount")}</td>
              <td className="font-bold">₦{calculateTotal("purchasePrice")}</td>
              <td className="font-bold">₦{calculateTotal("salvageValue")}</td>
              <td className="font-bold">₦{calculateTotal("marketValue")}</td>
              <td className="font-bold">₦{calculateTotal("interestReceived")}</td>
              <td className="font-bold">₦{calculateTotal("dividendReceived")}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

      </div>

      {/* Buttons for printing and downloading */}
      <div className="flex flex-wrap justify-center gap-2 p-4">
        <button onClick={handlePrint} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Print Table
        </button>
        <button onClick={handleDownload} className="bg-green-500 text-white px-4 py-2 rounded-md">
          Download Table
        </button>
        <button onClick={handleOpenModal} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Add Asset
        </button>
      </div>

    </>
  );
}
