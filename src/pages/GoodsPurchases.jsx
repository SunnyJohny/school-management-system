import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendar } from 'react-icons/fa';
import { useMyContext } from '../Context/MyContext';
import { faChartLine, faShoppingCart, faCalendarAlt, faBox } from '@fortawesome/free-solid-svg-icons';
// import jsPDF from 'jspdf';

import SalesPageSidePanel from '../components/SalesPageSidePanel';
import ExpenseInvoiceModal from '../components/ExpenseInvoiceModal';
import { Link } from 'react-router-dom';



const GoodsPurchases = () => {
  const { state, searchByKeyword, searchByDate, calculateTotalSalesValue, calculateTotalCOGS } = useMyContext();


  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  // const [filteredItems, setFilteredItems] = useState([]);
  // const [totalStoreValue, setTotalStoreValue] = useState(0);

  // Added state for total sales
  // const navigate = useNavigate();

  const tableRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [totalPurchaseValue, setTotalPurchaseValue] = useState(0);

  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  // const [summaryData, setSummaryData] = useState(null); // State to hold summary data

  // const totalItems = filteredPurchases.length;


  const [selectedDateOption, setSelectedDateOption] = useState('All');
  const [totalSalesValue, setTotalSalesValue] = useState(0);
  const [totalCogsValue, setTotalCogsValue] = useState(0);

  useEffect(() => {
    const totalSales = calculateTotalSalesValue(state.sales);
    setTotalSalesValue(totalSales);

  }, [state.sales, calculateTotalSalesValue]);

  useEffect(() => {
    const totalCOGS = calculateTotalCOGS(state.sales);
    setTotalCogsValue(totalCOGS);

  }, [state.sales, calculateTotalCOGS]);

  useEffect(() => {
    calculateTotalPurchaseValue(filteredPurchases);
  }, [filteredPurchases]);

  useEffect(() => {
    let filtered = state.purchases;

    if (fromDate && toDate) {
      filtered = searchByDate(filtered, fromDate, toDate);
    }

    if (searchKeyword) {
      filtered = searchByKeyword(filtered, searchKeyword);
    }

    setFilteredPurchases(filtered);
    calculateTotalPurchaseValue(filtered);
  }, [state.purchases, fromDate, toDate, searchKeyword, searchByDate, searchByKeyword]);

  const calculateTotalPurchaseValue = (purchases) => {
    if (!purchases || purchases.length === 0) {
      setTotalPurchaseValue(0);
      return;
    }

    const calculatedTotalPurchaseValue = purchases.reduce((total, purchase) => {
      return total + parseFloat(purchase.totalCost || 0);
    }, 0);

    setTotalPurchaseValue(calculatedTotalPurchaseValue.toFixed(2));
  };

  const handlePurchaseClick = (purchase) => {

    setShowModal(true);
    setSelectedPurchase(purchase);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPurchase(null);
  };

  const handleFromDateChange = (date) => {
    setFromDate(date);
    if (toDate) {
      const filteredByDate = searchByDate(state.purchases, date, toDate);
      setFilteredPurchases(filteredByDate);
      calculateTotalPurchaseValue(filteredByDate);
    }
  };

  const handleToDateChange = (date) => {
    setToDate(date);
    if (fromDate) {
      const filteredByDate = searchByDate(state.purchases, fromDate, date);
      setFilteredPurchases(filteredByDate);
      calculateTotalPurchaseValue(filteredByDate);
    }
  };

  const calculateTodayPurchases = () => {
    const today = new Date().toLocaleDateString();

    return state.purchases
      .filter((purchase) => new Date(purchase.date).toLocaleDateString() === today)
      .reduce((total, purchase) => total + parseFloat(purchase.totalCost), 0);
  };








  const generateSn = (index) => index + 1;



  const renderActionButtons = () => {
    // Function to handle printing of the table
    const saveAndPrintTable = () => {
      const table = document.getElementById('sales-table');
      const printWindow = window.open('', '_blank');
      printWindow.document.write('<html><head><title>Sales Table</title>');
      // Add custom CSS for printing
      printWindow.document.write('<style>');
      printWindow.document.write('@media print {');
      printWindow.document.write('.text-center { text-align: center; }');
      printWindow.document.write('.mb-4 { margin-bottom: 4px; }');
      printWindow.document.write('.table-print { border-collapse: collapse; }');
      printWindow.document.write('.table-print th, .table-print td { border: 2px solid black; padding: 8px; }');
      printWindow.document.write('}');
      printWindow.document.write('</style>');
      printWindow.document.write('</head><body>');

      printWindow.document.write(table.outerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    };
    return (
      <div className="flex justify-center mt-10">
        <div className="flex items-center space-x-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={saveAndPrintTable}>
            Print Report
          </button>
          <Link to="/add-purchase" className="bg-blue-500 text-white px-4 py-2 rounded-md">
            Add Purchase
          </Link>
        </div>
      </div>



    );
  };


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



  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

  return (
    <div className="container mx-auto flex">
      <div className="flex-none">
        <SalesPageSidePanel />
      </div>

      <div className="ml-8 flex-1">
        <div className="mb-8 p-2">
          <div className="flex items-center justify-between mb-4 pr-4">
            <h2 className="text-2xl font-bold">Purchase Stats</h2>

            <button className="text-blue-500 cursor-pointer" onClick={() => window.history.back()}>
              Back
            </button>
          </div>
          <div className="flex mt-4 space-x-4">
            {renderStatCard('Total Purchases', `₦${totalPurchaseValue}`, 'blue', faChartLine)}
            {renderStatCard('Today Purchases', `₦${calculateTodayPurchases().toFixed(2)}`, 'red', faCalendarAlt)}
            {renderStatCard('Total Sales', `₦${totalSalesValue}`, 'green', faShoppingCart)}
            {/* {renderStatCard(
              'Total Profit',
              `₦${'400'}`,
              'red',
              faCalendarAlt
            )} */}
            {renderStatCard('COG Sold', `₦${totalCogsValue}`, 'gray', faBox)}

          </div>
        </div>



        <div className="mb-8">

          <p><strong>Purchases by Dates:</strong></p>

          <div className="flex items-center space-x-4">

            <div>

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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
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
                <div className="relative mr-4">
                  <DatePicker
                    selected={toDate}
                    onChange={handleToDateChange}
                    dateFormat="MM-dd-yyyy"
                    placeholderText="To"
                    className="border border-gray-300 rounded-md p-2 pl-2 cursor-pointer"
                  />
                  <FaCalendar className="absolute top-3 right-2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              {/* Search input */}
              <div className="relative ml-4">
                <input
                  type="text"
                  className="border border-gray-300 rounded-md p-2"
                  placeholder="Search"
                  // Assuming you have a function setSearchKeyword to handle search
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>
            </div>


          </div>
        </div>

        <div className="mb-8">


          <div className="table-container overflow-x-auto overflow-y-auto" style={{ maxHeight: '300px' }} id="sales-table" ref={tableRef}>
            {/* Header section */}
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold underline">Goods Purchase Record</h2>

              <p><strong>Selected Date Period:</strong> {renderSelectedDatePeriod()}</p>
              <p>Report Printed On: {getCurrentDate()}</p>
            </div>

            <table className="w-full table-auto">
            <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="border">S/n</th>
                  <th className="border">Attendant Name</th>
                  <th className="border">Description</th>
                  <th className="border">Invoice No</th>
                  <th className="border">Item Name</th>
                  <th className="border">Purchase Date</th>
                  <th className="border">Quantity</th>
                  <th className="border">Unit Price</th>
                  <th className="border">Total Cost</th>
                  <th className="border">Supplier Name</th>
                  <th className="border">Payment Method</th>
                  <th className="border">Payment Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases
                  .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)) // Sort by purchase date in descending order
                  .map((purchase, index) => (
                    <tr key={index} onClick={() => handlePurchaseClick(purchase)} style={{ cursor: 'pointer' }}>
                      <td className="border">{generateSn(index)}</td>
                      <td className="border">{purchase.attendantName}</td>
                      <td className="border">{purchase.description}</td>
                      <td className="border">{purchase.invoiceNo}</td>
                      <td className="border">{purchase.itemName}</td>
                      <td className="border">{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                      <td className="border">{purchase.quantity}</td>
                      <td className="border">₦{parseFloat(purchase.unitPrice).toFixed(2)}</td>
                      <td className="border">₦{parseFloat(purchase.totalCost).toFixed(2)}</td>

                      <td className="border">{purchase.supplierName}</td>
                      <td className="border">{purchase.paymentMethod}</td>
                      <td className="border">{purchase.paymentStatus}</td>
                    </tr>
                  ))}
                {/* Additional row for totals */}
                <tr>
                  <td className="border"><strong>Total</strong></td> {/* Empty cell for S/N */}
                  <td colSpan="7" className="border"></td> {/* Empty cell for other columns */}
                  <td className="border"><strong>₦{totalPurchaseValue}</strong></td> {/* Total Purchases */}
                  <td colSpan="3" className="border"></td> {/* Empty cells for remaining columns */}
                </tr>
              </tbody>
            </table>


          </div>


          {renderActionButtons()}

        </div>

        {/* Render the modal */}
        {showModal && selectedPurchase && (
          <ExpenseInvoiceModal expenseInfo={selectedPurchase} onClose={handleCloseModal} />
        )}
        {/* {selectedExpense && <ExpenseInvoiceModal expenseInfo={selectedExpense} onClose={handleCloseModal} />} */}
      </div>
    </div>
  );
};

const renderStatCard = (title, value, color, icon) => (
  <div className={`flex-1 bg-${color}-500 text-white p-4 rounded-md flex flex-col items-center`}>
    <div className="text-lg font-bold mb-2">{title}</div>
    <div className="text-2xl font-bold flex items-center">
      {icon && <FontAwesomeIcon icon={icon} className="mr-2" />}
      {value}
    </div>
  </div>
);
export default GoodsPurchases;