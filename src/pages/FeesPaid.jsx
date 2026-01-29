import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendar } from "react-icons/fa";
import {
  faChartLine,
  faShoppingCart,
  faCalendarAlt,
  faBox,
} from "@fortawesome/free-solid-svg-icons";
import { useMyContext } from "../Context/MyContext";
import { MdClose } from "react-icons/md";

import ProductsPageSidePanel from "../components/ProductsPagesidePanel";
import { convertToWords } from "./Students";
// import ProductsPageSidePanel from '../components/ProductsPageSidePanel';

const FeesPaidReport = () => {
  const { state, searchByKeyword, searchByDate, calculateTotalFeesPaid } =
    useMyContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [filteredFees, setFilteredFees] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [totalFeesPaid, setTotalFeesPaid] = useState(0);
  const tableRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedDateOption, setSelectedDateOption] = useState("All");

  const totalItems = filteredFees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itemsToDisplay = filteredFees.slice(startIndex, endIndex);

  // const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    let filtered = state.payments || [];

    if (fromDate && toDate) {
      filtered = searchByDate(filtered, fromDate, toDate);
    }

    if (searchKeyword) {
      filtered = searchByKeyword(filtered, searchKeyword);
    }

    setFilteredFees(filtered);
  }, [
    state.payments,
    fromDate,
    toDate,
    searchKeyword,
    searchByDate,
    searchByKeyword,
  ]);

  useEffect(() => {
    setTotalFeesPaid(calculateTotalFeesPaid(filteredFees));
  }, [filteredFees, calculateTotalFeesPaid]);

  const handleDateOptionChange = (e) => {
    const selectedOption = e.target.value;
    setSelectedDateOption(selectedOption);

    let startDate = new Date();
    let endDate = new Date();

    switch (selectedOption) {
      case "All":
        setFromDate(null);
        setToDate(null);
        return;

      case "Today":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "This Week":
        const todayIndex = startDate.getDay(); // 0 = Sunday
        const startOfWeek = new Date();
        startOfWeek.setDate(startDate.getDate() - todayIndex); // Go to Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        startDate = startOfWeek;
        break;

      case "This Month":
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1); // First day of the month
        endDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          0,
        ); // Last day of the month
        break;

      case "This Month - Date":
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1); // First day of the month
        endDate.setHours(23, 59, 59, 999); // Current time today
        break;

      case "This Week to Date":
        const weekToDateStart = new Date();
        weekToDateStart.setDate(
          weekToDateStart.getDate() - weekToDateStart.getDay(),
        ); // First day of the week
        weekToDateStart.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999); // Current time today
        startDate = weekToDateStart;
        break;

      case "Last Week":
        const lastWeekStart = new Date();
        lastWeekStart.setDate(
          lastWeekStart.getDate() - lastWeekStart.getDay() - 7,
        ); // Previous week's Sunday
        lastWeekStart.setHours(0, 0, 0, 0);
        endDate = new Date(lastWeekStart);
        endDate.setDate(lastWeekStart.getDate() + 6); // Previous week's Saturday
        endDate.setHours(23, 59, 59, 999);
        startDate = lastWeekStart;
        break;

      case "Last Month":
        startDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth() - 1,
          1,
        ); // First day of last month
        endDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          0,
        ); // Last day of last month
        break;

      case "Yesterday":
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        break;
    }

    setFromDate(startDate);
    setToDate(endDate);
  };

  const handleFromDateChange = (date) => {
    setFromDate(date);
    if (toDate) {
      const filteredByDate = searchByDate(state.payments || [], date, toDate);
      setFilteredFees(filteredByDate);
      setTotalFeesPaid(calculateTotalFeesPaid(filteredByDate));
    }
  };

  const handleToDateChange = (date) => {
    setToDate(date);
    if (fromDate) {
      const filteredByDate = searchByDate(state.payments || [], fromDate, date);
      setFilteredFees(filteredByDate);
      setTotalFeesPaid(calculateTotalFeesPaid(filteredByDate));
    }
  };

  const handleRowClick = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
  };

  const renderTable = () => (
    <table className="table-auto w-full border-collapse border border-gray-300">
      <thead ref={tableRef}>
        <tr className="bg-gray-200">
          <th className="border border-gray-300 px-4 py-2">SN</th>
          <th className="border border-gray-300 px-4 py-2">Student Name</th>
          <th className="border border-gray-300 px-4 py-2">Class</th>
          <th className="border border-gray-300 px-4 py-2">Reg No</th>
          <th className="border border-gray-300 px-4 py-2">Amount Paid</th>
          <th className="border border-gray-300 px-4 py-2">Date Paid</th>
          <th className="border border-gray-300 px-4 py-2">Payment Method</th>
          <th className="border border-gray-300 px-4 py-2">Receipt No</th>
        </tr>
      </thead>
      <tbody>
        {itemsToDisplay.map((fee, index) => (
          <tr
            key={fee.id}
            className="hover:bg-gray-100 cursor-pointer"
            onClick={() => handleRowClick(fee)}
          >
            <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
            <td className="border border-gray-300 px-4 py-2">
              {fee.studentName}
            </td>
            <td className="border border-gray-300 px-4 py-2">
              {fee.studentClass}
            </td>
            <td className="border border-gray-300 px-4 py-2">
              {fee.studentId}
            </td>
            <td className="border border-gray-300 px-4 py-2">
              ₦{Number(fee.totalAmount || 0).toLocaleString()}
            </td>
            <td className="border border-gray-300 px-4 py-2">
              {fee.timestamp?.toDate?.().toLocaleDateString() || "Invalid Date"}
            </td>
            <td className="border border-gray-300 px-4 py-2">
              {fee.paymentMethod}
            </td>
            <td className="border border-gray-300 px-4 py-2">{fee.id}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="bg-gray-200">
          <td className="border border-gray-300 px-4 py-2" colSpan="4">
            <strong>Total</strong>
          </td>
          <td className="border border-gray-300 px-4 py-2">
            <strong>₦{Number(totalFeesPaid || 0).toLocaleString()}</strong>
          </td>
          <td className="border border-gray-300 px-4 py-2"></td>
          <td className="border border-gray-300 px-4 py-2"></td>
        </tr>
      </tfoot>
    </table>
  );

  const ReceiptModal = ({ saleInfo, onClose }) => {
    if (!saleInfo) return null;

    const totalAmount = Number(saleInfo.totalAmount || 0);
    const amountInWords = convertToWords(totalAmount);

    const formattedDate = saleInfo.timestamp?.toDate
      ? saleInfo.timestamp.toDate().toLocaleDateString("en-GB")
      : "Invalid Date";

    const schoolName = saleInfo.schoolName || state.selectedSchoolName || "School Name";
    const schoolAddress = saleInfo.schoolAddress || state.selectedSchoolAddress || "";
    const schoolPhone = saleInfo.schoolPhone || state.selectedSchoolPhoneNumber || "";
    const schoolEmail = saleInfo.schoolEmail || state.selectedSchoolEmail || "";
    const attendantName = saleInfo.attendant || state.user?.name || "Staff Name";

    const printReceipt = () => {
      const printWindow = window.open("", "_blank");
      // sanitize items array
      const items = Array.isArray(saleInfo.items) ? saleInfo.items : [];
      printWindow.document.write(`
        <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #000; }
            .header { text-align: center; margin-bottom: 8px; }
            .header h1 { margin: 0; font-size: 20px; }
            .header p { margin: 0; font-size: 12px; }
            .receipt-details { margin: 14px 0; font-size: 14px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
            .table th { background-color: #f2f2f2; }
            .footer { margin-top: 18px; font-size: 12px; text-align: center; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${schoolName}</h1>
            <p>${schoolAddress}</p>
            <p>Tel: ${schoolPhone} ${schoolEmail ? "| Email: " + schoolEmail : ""}</p>
            <p style="margin-top:8px;"><strong>Receipt Number:</strong> ${saleInfo.id}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
          </div>

          <div class="receipt-details">
            <p><strong>Student Name:</strong> ${saleInfo.studentName || "-"}</p>
            <p><strong>Student Class:</strong> ${saleInfo.studentClass || "-"}</p>
            <p><strong>Guardian Phone:</strong> ${saleInfo.guardianPhone || "-"}</p>
            <p><strong>Payment Method:</strong> ${saleInfo.paymentMethod || "-"}</p>
            <p><strong>Term:</strong> ${saleInfo.term || "-"}</p>
            <p><strong>Total Amount:</strong> ₦${totalAmount.toFixed(2)}</p>
            <p><strong>Amount in Words:</strong> ${amountInWords} Only</p>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td>${item.type || "-"}</td>
                  <td>₦${Number(item.amount || 0).toFixed(2)}</td>
                </tr>`,
                )
                .join("")}
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>₦${totalAmount.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>

          <p style="margin-top:14px;"><strong>Attendant:</strong> ${attendantName}</p>

          <div class="footer">
            <hr />
            <p style="font-style:italic; margin-top:8px;">Journey to Excellence</p>
            <p style="margin-top:6px;"><em>Developer Contact : 08030611606</em></p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      // keep window open or close depending on preference:
      printWindow.close();
    };

    const items = Array.isArray(saleInfo.items) ? saleInfo.items : [];

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-11/12 max-w-lg print:shadow-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Payment Receipt</h3>
            <button onClick={onClose}>
              <MdClose
                size={24}
                className="cursor-pointer text-gray-600 hover:text-gray-800"
              />
            </button>
          </div>
          <div className="text-sm">
            <p><strong>{schoolName}</strong></p>
            {schoolAddress && <p className="text-xs">{schoolAddress}</p>}
            <p className="text-xs">Tel: {schoolPhone} {schoolEmail ? `| Email: ${schoolEmail}` : ""}</p>

            <p className="mt-2"><strong>Receipt No:</strong> {saleInfo.id}</p>
            <p><strong>Date:</strong> {formattedDate}</p>

            <p className="mt-2"><strong>Student Name:</strong> {saleInfo.studentName}</p>
            <p><strong>Class:</strong> {saleInfo.studentClass}</p>
            <p><strong>Guardian Phone:</strong> {saleInfo.guardianPhone}</p>
            <p><strong>Total Amount:</strong> ₦{totalAmount.toLocaleString()}</p>
            <p><strong>Amount in Words:</strong> {amountInWords} Only</p>
            <p><strong>Payment Method:</strong> {saleInfo.paymentMethod}</p>
            <p><strong>Term:</strong> {saleInfo.term}</p>

            <h3 className="font-semibold mt-4">Payment Details:</h3>
            <table className="table w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">Item</th>
                  <th className="border border-gray-300 px-4 py-2">Amount (₦)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{item.type}</td>
                    <td className="border border-gray-300 px-4 py-2">₦{Number(item.amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="border border-gray-300 px-4 py-2"><strong>Total</strong></td>
                  <td className="border border-gray-300 px-4 py-2"><strong>₦{totalAmount.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={printReceipt} className="btn-primary mr-2 print:hidden">Print Receipt</button>
            <button onClick={onClose} className="btn-secondary print:hidden">Close</button>
          </div>
        </div>
      </div>
    );
  };

  const renderPaginationButtons = () => {
    const handlePreviousPage = () => {
      setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
    };

    const handleNextPage = () => {
      setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
    };

    const saveAndPrintTable = () => {
      const table = tableRef.current;
      const printWindow = window.open("", "_blank");
      printWindow.document.write("<html><head><title>Fees Table</title>");
      // Add custom CSS for printing
      printWindow.document.write("<style>");
      printWindow.document.write("@media print {");
      printWindow.document.write(".text-center { text-align: center; }");
      printWindow.document.write(".mb-4 { margin-bottom: 4px; }");
      printWindow.document.write(".table-print { border-collapse: collapse; width: 100%; }");
      printWindow.document.write(".table-print th, .table-print td { border: 2px solid black; padding: 8px; }");
      printWindow.document.write("}");
      printWindow.document.write("</style>");
      printWindow.document.write("</head><body>");
      printWindow.document.write(table.outerHTML);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    };

    return (
      <div className="flex justify-between">
        <button
          className={`px-4 py-2 rounded-md ${currentPage === 1 ? "bg-gray-300 text-gray-700" : "bg-blue-500 text-white"}`}
          onClick={handlePreviousPage}
        >
          Previous
        </button>

        <button
          className="bg-blue-500  ml-2 text-white px-4 py-2 rounded-md"
          onClick={saveAndPrintTable}
        >
          Print
        </button>

        <button
          className={`px-4 py-2 rounded-md ml-2 ${currentPage === totalPages ? "bg-gray-300 text-gray-700" : "bg-blue-500 text-white"}`}
          onClick={handleNextPage}
        >
          Next
        </button>
      </div>
    );
  };

  const calculateTodayFees = () => {
    const today = new Date().toLocaleDateString(); // Get today's date in locale string format

    return (state.payments || [])
      .filter(
        (payment) =>
          payment.timestamp && new Date(payment.timestamp.toDate()).toLocaleDateString() === today,
      ) // Filter payments by today's date
      .reduce(
        (total, payment) =>
          total +
          (Array.isArray(payment.items) ? payment.items.reduce((acc, item) => acc + parseFloat(item.amount || 0), 0) : 0),
        0,
      ); // Sum the amounts from the items array
  };

  return (
    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 px-4 md:px-0">
      <div className="hidden md:block flex-none">
        <ProductsPageSidePanel />
      </div>

      <div className="ml-8 flex-1">
        <div className="mb-8 p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-grow text-center">
              <h2 className="text-2xl font-bold">Fees Paid</h2>
            </div>
            <button
              className="text-blue-500 cursor-pointer pr-24"
              onClick={() => window.history.back()}
            >
              Back
            </button>
          </div>

          <div className="flex flex-wrap p-2 md:space-x-4 space-y-4 md:space-y-0">
            {renderStatCard(
              "Total Revenue",
              `₦${Number(totalFeesPaid || 0).toLocaleString()}`,
              "blue",
              faChartLine,
            )}
            {renderStatCard(
              "Total Fees",
              `₦${Number(totalFeesPaid || 0).toLocaleString()}`,
              "green",
              faShoppingCart,
            )}
            {renderStatCard(
              "Today Fees",
              `₦${calculateTodayFees().toFixed(2)}`,
              "red",
              faCalendarAlt,
            )}
            {renderStatCard("Total Expenses", `₦0`, "gray", faBox)}
          </div>
        </div>

        {showModal && selectedPayment && (
          <ReceiptModal saleInfo={selectedPayment} onClose={handleCloseModal} />
        )}

        <div className="mb-4">
          <p>
            <strong>Transactions by Date:</strong>
          </p>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-2 space-y-2 md:space-y-0">
            <div>
              <select
                id="dateOption"
                value={selectedDateOption}
                onChange={handleDateOptionChange}
                className="border border-gray-300 rounded-md p-2 pl-4"
                style={{ width: "150px" }}
              >
                <option value="All">All</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Week - Date">This Week - Date</option>
                <option value="This Month">This Month</option>
                <option value="Last Month to Date">This Month to Date</option>
                <option value="This Fiscal Quarter">This Fiscal Quarter</option>
                <option value="This Fiscal Quarter to Date">
                  This Fiscal Quarter to Date
                </option>
                <option value="This Fiscal Year">This Fiscal Year</option>
                <option value="This Fiscal Year to Last Month">
                  This Fiscal Year to Last Month
                </option>
                <option value="This Fiscal Year to Date">
                  This Fiscal Year to Date
                </option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last Week">Last Week</option>
                <option value="Last Week to Date">Last Week to Date</option>
                <option value="Last Month">Last Month</option>
                <option value="Last Month to Date">Last Month to Date</option>
                <option value="Last Fiscal Quarter">Last Fiscal Quarter</option>
                <option value="Last Fiscal Quarter to Last Month">
                  Last Fiscal Quarter to Last Month
                </option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <DatePicker
                  selected={fromDate}
                  onChange={handleFromDateChange}
                  dateFormat="MM-dd-yyyy"
                  placeholderText="From"
                  className="border border-gray-300 rounded-md p-2 pl-2 cursor-pointer w-full md:w-auto"
                />
                <FaCalendar className="absolute top-3 right-2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <DatePicker
                  selected={toDate}
                  onChange={handleToDateChange}
                  dateFormat="MM-dd-yyyy"
                  placeholderText="To"
                  className="border border-gray-300 rounded-md p-2 pl-2 cursor-pointer w-full md:w-auto"
                />
                <FaCalendar className="absolute top-3 right-2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <input
              type="text"
              className="border border-gray-300 rounded-md p-2"
              placeholder="Search"
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ marginLeft: "auto", marginRight: "16px" }}
            />
          </div>
        </div>

        <div className="mb-8">
          <div
            className="table-container overflow-x-auto overflow-y-auto"
            style={{ maxHeight: "300px" }}
            ref={tableRef}
          >
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold underline">Fees Report</h2>
              <p>
                <strong>Selected Date Period:</strong> {selectedDateOption}
              </p>
              <p>
                Report Printed On:{" "}
                {new Date().toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
            {renderTable()}
            <div className="flex justify-center mt-4 mb-24">
              {renderPaginationButtons()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeesPaidReport;

export const renderStatCard = (title, value, color, icon) => (
  <div className={`bg-${color}-500 text-white p-4 rounded-md inline-block m-2`}>
    <div className="text-sm">{title}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);