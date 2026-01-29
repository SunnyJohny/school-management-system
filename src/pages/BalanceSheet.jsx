import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { FaCalendar, FaArrowLeft } from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';
import { useMyContext } from '../Context/MyContext';
import { useNavigate } from 'react-router-dom';

const BalanceSheet = () => {
  const { state } = useMyContext();
  const [selectedDateOption, setSelectedDateOption] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showSection, setShowSection] = useState({
    currentAssets: false,
    nonCurrentAssets: false,
    liabilities: false,
    equity: false,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const dialogRef = useRef();
 
  const navigate = useNavigate();

  useEffect(() => {
    console.log('My products', state.products);
  }, [state.products]);

  useEffect(() => {
    console.log('My Liabilities', state.liabilities);
  }, [state.liabilities]);

  const calculateAccountsReceivable = () => {
    if (!state.selectedCompanyId) {
      console.warn('No company selected');
      return 0;
    }
  
    const totalCreditSum = state.sales
      .filter(sale => sale.payment && sale.payment.method === 'Credit')
      .reduce((sum, sale) => sum + (Number(sale.totalAmount) || 0), 0);
  
    console.log('Total credit sales sum:', totalCreditSum);
    return totalCreditSum;
  };
  const accountsReceivable = calculateAccountsReceivable();

  const calculateInventoryValue = () => {
    if (!state.selectedCompanyId) {
      console.warn('No company selected');
      return 0;
    }
  
    const totalInventoryValue = state.products.reduce((sum, product) => {
      const price = Number(product.price) || 0;
      const quantityRestock = Array.isArray(product.quantityRestocked)
        ? product.quantityRestocked.reduce((acc, entry) => acc + (Number(entry.quantity) || 0), 0)
        : 0;
      return sum + (price * quantityRestock);
    }, 0);
  
    console.log('Total inventory value sum:', totalInventoryValue);
    return totalInventoryValue;
  };
  const inventoryValue = calculateInventoryValue();

  const calculateFixedAssetsTotals = () => {
    const totalFixedAssets = state.assets
      .filter(asset => asset.assetType === 'fixedAssets')
      .reduce((sum, asset) => sum + (Number(asset.marketValue) || 0), 0);

    console.log('Total fixed assets:', totalFixedAssets);
    return totalFixedAssets;
  };

  console.log("fixedtotalsum", calculateFixedAssetsTotals());
  const calculateTotals = () => {
    const totalAssets =
      state.assets.reduce(
        (sum, asset) => sum + (Number(asset.marketValue) || Number(asset.amount) || Number(asset.purchasePrice) || 0),
        0
      ) + accountsReceivable + inventoryValue;

    const totalLiabilities = state.liabilities.reduce((sum, liability) => sum + (Number(liability.loanBalance) || 0), 0);

    const directEquity =
      (Number(state.equity?.ownersEquity) || 0) + (Number(state.equity?.retainedEarnings) || 0);
    const derivedEquity = totalAssets - totalLiabilities;

    if (directEquity !== derivedEquity) {
      console.warn('Discrepancy detected between direct and derived equity calculations.');
    }

    return { totalAssets, totalLiabilities, directEquity, derivedEquity };
  };

  const { totalAssets, totalLiabilities, derivedEquity } = calculateTotals();
  const handleDateOptionChange = (e) => {
    const selectedOption = e.target.value;
    setSelectedDateOption(selectedOption);

    let startDate = new Date();
    let endDate = new Date();

    switch (selectedOption) {
      case 'All':
        setFromDate(null);
        setToDate(null);
        return;
      case 'Today':
        // Set both fromDate and toDate to the current day
        startDate.setHours(0, 0, 0, 0); // Start of the day
        endDate.setHours(23, 59, 59, 999); // End of the day
        break;
      case 'This Week':
        // Set the start date to the beginning of the current week (Sunday) and end date to today
        const today = startDate.getDay(); // Get current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        startDate.setDate(startDate.getDate() - today); // Set start date to Sunday of the current week
        endDate = new Date(); // End date is today
        endDate.setHours(23, 59, 59, 999); // End of the day
        break;
      case 'This Week to Date':
        const startOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - startOfWeek); // Start date is Sunday of the current week
        // End date is today
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999); // End of the day
        break;
      case 'This Month':
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        break;
      case 'This Month - Date':
        // Set start date to the 1st of the month
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

        // Set end date to today's date
        endDate = new Date();

        // Set end date to end of the day
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'Last Month to Date':
        // Set start date to the first day of the previous month and end date to today
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
        endDate = new Date(); // End date is today
        endDate.setHours(23, 59, 59, 999); // End of the day
        break;
      case 'This Fiscal Quarter':
        const quarterStartMonth = Math.floor((startDate.getMonth() / 3)) * 3; // Get the start month of the current quarter
        startDate = new Date(startDate.getFullYear(), quarterStartMonth, 1); // Start of quarter
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0); // End of quarter
        break;
      case 'This Fiscal Year':
        startDate = new Date(startDate.getFullYear(), 0, 1); // Start of fiscal year (January 1st)
        endDate = new Date(startDate.getFullYear() + 1, 0, 0); // End of fiscal year (December 31st)
        break;
      case 'Yesterday':
        startDate.setDate(startDate.getDate() - 1); // Subtract one day
        endDate = new Date(startDate);
        break;
      case 'Last Week':
        startDate.setDate(startDate.getDate() - 7); // Subtract seven days
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6); // Set end date to one day before the current date
        break;
      case 'Last Month':
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1); // Set to previous month
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Set to last day of previous month
        break;
      // Add more cases as needed
      default:
        break;
    }


    setFromDate(new Date(startDate)); // Use new Date object to avoid reference issues
    setToDate(new Date(endDate));
  };
  // Calculate total sales for each salesperson


  // Function to format date as MM-DD-YYYY
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const handleFromDateChange = (date) => {
    setFromDate(date);
    // const filteredByDate = searchByDate(state.sales, date, fromDate);
    // console.log('Filtered by date:', filteredByDate);
    // setFilteredSales(filteredByDate);
    // calculateTotalSalesValue(filteredByDate);
  };

  const handleToDateChange = (date) => {
    setToDate(date);
    // const filteredByDate = searchByDate(state.sales, toDate, date);
    // console.log('Filtered by date:', filteredByDate);
    // setFilteredSales(filteredByDate);
    // calculateTotalSalesValue(filteredByDate);
  };

  // Function to get the current date
  const getCurrentDate = () => {
    return formatDate(new Date());
  };

  // Function to render the selected date period
  const renderSelectedDatePeriod = () => {
    if (fromDate && toDate) {
      return `${formatDate(fromDate)} to ${formatDate(toDate)}`;
    } else if (fromDate) {
      return `From ${formatDate(fromDate)}`;
    } else if (toDate) {
      return `To ${formatDate(toDate)}`;
    } else {
      return 'All';
    }
  };

  const toggleSection = (section) => {
    setShowSection({ ...showSection, [section]: !showSection[section] });
  };

  const renderAssetDetails = (assetType, label) => {
    if (assetType === 'fixedAssets') {
      const totalFixedAssets = calculateFixedAssetsTotals();
      return (
        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label={label} key={assetType}>
          <dt className="text-sm font-medium text-gray-500">{label}</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{totalFixedAssets}</dd>
        </div>
      );
    } else {
      const asset = state.assets.find((asset) => asset.assetType === assetType);
      const value = asset ? (Number(asset.marketValue) || Number(asset.amount) || Number(asset.purchasePrice) || 0) : 0;
      return (
        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label={label} key={assetType}>
          <dt className="text-sm font-medium text-gray-500">{label}</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{value}</dd>
        </div>
      );
    }
  };

  const renderCurrentAssets = () => {
    const currentAssetTypes = [
      { type: 'cash', label: 'Cash' },
      { type: 'checking', label: 'Checking' },
      { type: 'cashEquivalents', label: 'Cash Equivalents' },
    ];

    return currentAssetTypes.map((assetType) => renderAssetDetails(assetType.type, assetType.label));
  };

  const renderNonCurrentAssets = () => {
    const nonCurrentAssetTypes = [
      { type: 'fixedAssets', label: 'Fixed Assets' },
      { type: 'otherAssets', label: 'Other Assets' },
    ];

    return nonCurrentAssetTypes.map((assetType) => renderAssetDetails(assetType.type, assetType.label));
  };

  const renderLiabilities = () => {
    return state.liabilities.map((liability) => (
      <div key={liability.id} className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt className="text-sm font-medium text-gray-500">{liability.liabilityName}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{liability.loanBalance}</dd>
      </div>
    ));
  };

  const saveAndPrintTable = () => {
    // Get the content of the statement
    // const statementContent = document.getElementById('statement').innerHTML;
  
    // Open a new window
    // const printWindow = window.open('', '_blank', 'width=800,height=600');
  
    // // Write the content to the new window
    // printWindow.document.open();
    // printWindow.document.write(`
    //   <html>
    //     <head>
    //       <title>Print Statement</title>
    //       <style>
    //         body {
    //           font-family: Arial, sans-serif;
    //           margin: 20px;
    //         }
    //         .text-2xl {
    //           font-size: 1.5rem; /* Adjust font size as needed */
    //           font-weight: bold;
    //           text-decoration: underline;
    //         }
    //         .text-blue-500 {
    //           color: #3b82f6; /* Adjust color as needed */
    //           cursor: pointer;
    //         }
    //         .mb-4 {
    //           margin-bottom: 1rem; /* Adjust margin as needed */
    //         }
    //         .mb-8 {
    //           margin-bottom: 2rem; /* Adjust margin as needed */
    //         }
    //         /* Add more styles as per your design */
    //       </style>
    //     </head>
    //     <body>
    //       <div class="div" id="statement">
    //         ${statementContent}
    //       </div>
    //     </body>
    //   </html>
    // `);
    // printWindow.document.close();
  
    // Print the content
    window.print();
  };
  
  
  

  const closeDialog = () => {
    setIsDialogOpen(false);
    dialogRef.current.close();
  };

  useEffect(() => {
    if (isDialogOpen && dialogRef.current) {
      dialogRef.current.showModal();
    }
  }, [isDialogOpen]);

  const goBack = () => {
    navigate(-1);
  };

  return (

    <div className="container mx-auto flex h-full flex-col">
      <dialog ref={dialogRef} className="p-6 rounded-lg shadow-lg">
        <p className="mb-4">Make sure you update your assets and liability sections to get accurate data.</p>
        <button onClick={closeDialog} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          OK
        </button>
      </dialog>
      <div className="flex justify-center items-center mb-8">
        <h2 className="text-2xl font-bold" id="sales-table">
          Balance Sheet
        </h2>
      </div>

      <div className="ml-8 flex-1 overflow-auto pb-8">
        <div className="mb-8">
        <div className="flex items-center justify-between space-x-4">
  <div>
    <label htmlFor="dateOption" className="text-lg" style={{ marginRight: '16px' }}>
      Dates
    </label>
    <select
      id="dateOption"
      value={selectedDateOption}
      onChange={handleDateOptionChange}
      className="border border-gray-300 rounded-md p-2 pl-4"
      style={{ width: '150px' }} // Set the width to 150px (adjust as needed)
    >
      <option value="All">All</option>
      <option value="Today">Today</option>
      <option value="This Week">This Week</option>
      <option value="This Week - Date">This Week - Date</option>
      <option value="This Month">This Month</option>
      <option value="Last Month to Date">This Month to Date</option>
      <option value="This Fiscal Quarter">This Fiscal Quarter</option>
      <option value="This Fiscal Quarter to Date">This Fiscal Quarter to Date</option>
      <option value="This Fiscal Year">This Fiscal Year</option>
      <option value="This Fiscal Year to Last Month">This Fiscal Year to Last Month</option>
      <option value="This Fiscal Year to Date">This Fiscal Year to Date</option>
      <option value="Yesterday">Yesterday</option>
      <option value="Last Week">Last Week</option>
      <option value="Last Week to Date">Last Week to Date</option>
      <option value="Last Month">Last Month</option>
      <option value="Last Month to Date">Last Month to Date</option>
      <option value="Last Fiscal Quarter">Last Fiscal Quarter</option>
      <option value="Last Fiscal Quarter to Last Month">Last Fiscal Quarter to Last Month</option>
    </select>
  </div>
  <div className="flex items-center space-x-2">
    <div className="text-lg">Sales by Date</div>
    <div className="relative">
      <DatePicker
        selected={fromDate}
        onChange={handleFromDateChange}
        dateFormat="MM-dd-yyyy"
        placeholderText="From"
        className="border border-gray-300 rounded-md p-2 pl-2 cursor-pointer"
      />
      <FaCalendar className="absolute top-3 right-2 text-gray-400 pointer-events-none" />
    </div>
    <div className="relative">
      <DatePicker
        selected={toDate}
        onChange={handleToDateChange}
        dateFormat="MM-dd-yyyy"
        placeholderText="To"
        className="border border-gray-300 rounded-md p-2 pl-2 cursor-pointer"
      />
      <FaCalendar className="absolute top-3 right-2 text-gray-400 pointer-events-none" />
    </div>
    <button className="text-blue-500 cursor-pointer" onClick={goBack}>
      <FaArrowLeft size={24} />
    </button>
  </div>
</div>
<div className="div"  id="statement">
     <div className="div">
          <div className="mb-2 text-center">
            <h2 className="text-2xl font-bold underline">Balance Sheet</h2>

            <p><strong>Selected Date Period:</strong> {renderSelectedDatePeriod()}</p>
            <p>Report Printed On: {getCurrentDate()}</p>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <button className="text-blue-500 cursor-pointer" onClick={() => toggleSection('currentAssets')}>
              {showSection.currentAssets ? '▼' : '▶'} Current Assets
            </button>
          </div>
          {showSection.currentAssets && (
            <div>
              {renderCurrentAssets()}
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Accounts Receivable">
                <dt className="text-sm font-medium text-gray-500">Accounts Receivable</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{accountsReceivable}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Inventory">
                <dt className="text-sm font-medium text-gray-500">Inventory</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{calculateInventoryValue()}</dd>
              </div>
              <hr className="border-t border-gray-300 my-4" />
              <div className="bg-gray-200 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Total Current Assets">
                <dt className="text-lg font-medium text-gray-700">Total Current Assets</dt>
                <dd className="mt-1 text-lg text-gray-900 sm:col-span-2">₦{accountsReceivable + inventoryValue}</dd>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button className="text-blue-500 cursor-pointer" onClick={() => toggleSection('nonCurrentAssets')}>
              {showSection.nonCurrentAssets ? '▼' : '▶'} Non-Current Assets
            </button>
          </div>
          {showSection.nonCurrentAssets && (
            <div>
              {renderNonCurrentAssets()}
              <hr className="border-t border-gray-300 my-4" />
              <div className="bg-gray-200 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Total Non-Current Assets">
                <dt className="text-lg font-medium text-gray-700">Total Non-Current Assets</dt>
                <dd className="mt-1 text-lg text-gray-900 sm:col-span-2">₦{calculateFixedAssetsTotals()}</dd>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button className="text-blue-500 cursor-pointer" onClick={() => toggleSection('liabilities')}>
              {showSection.liabilities ? '▼' : '▶'} Liabilities
            </button>
          </div>
          {showSection.liabilities && (
            <div>
              {renderLiabilities()}
              <hr className="border-t border-gray-300 my-4" />
              <div className="bg-gray-200 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Total Liabilities">
                <dt className="text-lg font-medium text-gray-700">Total Liabilities</dt>
                <dd className="mt-1 text-lg text-gray-900 sm:col-span-2">₦{totalLiabilities}</dd>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button className="text-blue-500 cursor-pointer" onClick={() => toggleSection('equity')}>
              {showSection.equity ? '▼' : '▶'} Equity
            </button>
          </div>
          {showSection.equity && (
            <div>
              {/* Render equity details */}
              <hr className="border-t border-gray-300 my-4" />
              <div className="bg-gray-200 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Total Equity">
                <dt className="text-lg font-medium text-gray-700">Total Equity</dt>
                <dd className="mt-1 text-lg text-gray-900 sm:col-span-2" style={{ textDecoration: 'underline double' }}>₦{derivedEquity}</dd>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-200 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Total Assets">
          <dt className="text-lg font-medium text-gray-700">Total Assets</dt>
          <dd className="mt-1 text-lg text-gray-900 sm:col-span-2">₦{totalAssets}</dd>
        </div>
        <div className="bg-gray-200 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Total Liabilities">
          <dt className="text-lg font-medium text-gray-700">Total Liabilities</dt>
          <dd className="mt-1 text-lg text-gray-900 sm:col-span-2">₦{totalLiabilities}</dd>
        </div>
        <div className="bg-gray-200 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Equity">
          <dt className="text-lg font-medium text-gray-700">Equity</dt>
          <dd className="mt-1 text-lg text-gray-900 sm:col-span-2" style={{ textDecoration: 'underline double' }}>₦{derivedEquity}</dd>
        </div>
        </div>
        </div>
        <div className="flex justify-center mb-8">
          <button
            className="bg-blue-500 text-white px-4 py-2 mt-2 rounded-md"
            onClick={saveAndPrintTable}
          >
            Save and Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
