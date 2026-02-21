import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendar } from "react-icons/fa";
import { useMyContext } from "../Context/MyContext";

const ProfitAndLoss = () => {
  // ✅ School-based P&L:
  // Revenue = Fees collected (payments)
  // COGS = 0 (for schools unless you later decide another model)
  // Taxes removed: treat taxes/levies as part of Expenses
  const {
    state,
    searchByDate,
    searchByKeyword,
    calculateTotalFeesPaid, // ✅ use same function as FeesPaidReport (if available)
    calculateTotalRevenue,  // fallback (if your context uses this)
    calculateTotalExpenses,
  } = useMyContext();

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const tableRef = useRef(null);

  const [selectedDateOption, setSelectedDateOption] = useState("All");
  const [searchKeyword, setSearchKeyword] = useState("");

  // ✅ Fetch fees the same way FeesPaidReport does
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // -----------------------------
  // ✅ Filter PAYMENTS (same approach as FeesPaidReport)
  // -----------------------------
  useEffect(() => {
    let filtered = state.payments || [];

    if (fromDate && toDate && searchByDate) {
      filtered = searchByDate(filtered, fromDate, toDate);
    }

    if (searchKeyword && searchByKeyword) {
      filtered = searchByKeyword(filtered, searchKeyword);
    }

    setFilteredPayments(filtered);
  }, [
    state.payments,
    fromDate,
    toDate,
    searchKeyword,
    searchByDate,
    searchByKeyword,
  ]);

  // ✅ Total Revenue (prefer calculateTotalFeesPaid like FeesPaidReport)
  useEffect(() => {
    // 1) If you have calculateTotalFeesPaid (best - matches your data shape)
    if (typeof calculateTotalFeesPaid === "function") {
      setTotalRevenue(Number(calculateTotalFeesPaid(filteredPayments) || 0));
      return;
    }

    // 2) If your app uses calculateTotalRevenue
    if (typeof calculateTotalRevenue === "function") {
      setTotalRevenue(Number(calculateTotalRevenue(filteredPayments) || 0));
      return;
    }

    // 3) Fallback: sum totalAmount OR items amounts
    const sum = (filteredPayments || []).reduce((acc, p) => {
      const direct = Number(p?.totalAmount);
      if (!Number.isNaN(direct) && direct > 0) return acc + direct;

      const items = Array.isArray(p?.items) ? p.items : [];
      const itemsSum = items.reduce((s, it) => s + Number(it?.amount || 0), 0);
      return acc + (Number.isNaN(itemsSum) ? 0 : itemsSum);
    }, 0);

    setTotalRevenue(Number(sum || 0));
  }, [filteredPayments, calculateTotalFeesPaid, calculateTotalRevenue]);

  // -----------------------------
  // ✅ Filter EXPENSES (exclude voided)
  // -----------------------------
  useEffect(() => {
    let filtered = state.expenses || [];

    // ✅ remove voided first
    filtered = filtered.filter((e) => !e?.voided);

    if (fromDate && toDate && searchByDate) {
      filtered = searchByDate(filtered, fromDate, toDate);
    }

    if (searchKeyword && searchByKeyword) {
      filtered = searchByKeyword(filtered, searchKeyword);
    }

    setFilteredExpenses(filtered);
  }, [
    state.expenses,
    fromDate,
    toDate,
    searchKeyword,
    searchByDate,
    searchByKeyword,
  ]);

  useEffect(() => {
    if (typeof calculateTotalExpenses === "function") {
      setTotalExpenses(Number(calculateTotalExpenses(filteredExpenses) || 0));
      return;
    }

    // fallback sum
    const sum = (filteredExpenses || []).reduce((acc, e) => {
      const n = Number(e?.amount);
      return Number.isNaN(n) ? acc : acc + n;
    }, 0);

    setTotalExpenses(Number(sum || 0));
  }, [filteredExpenses, calculateTotalExpenses]);

  // -----------------------------
  // ✅ Print
  // -----------------------------
  const saveAndPrintTable = () => {
    const table = document.getElementById("pnl-table");
    if (!table) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write("<html><head><title>Profit & Loss Statement</title>");
    printWindow.document.write("<style>");
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; margin: 20px; }
      .text-center { text-align: center; }
      .mb-4 { margin-bottom: 1rem; }
      .table-print { border-collapse: collapse; width: 100%; }
      .table-print th, .table-print td { border: 2px solid black; padding: 8px; }
      .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
      .font-bold { font-weight: 700; }
      .font-semibold { font-weight: 600; }
      .underline { text-decoration: underline; }
      .bg-gray-50 { background-color: #f9fafb; }
      .bg-white { background-color: #ffffff; }
      .border-gray-200 { border-color: #e5e7eb; }
      .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06); }
      .rounded-md { border-radius: 0.375rem; }
      .px-4 { padding-left: 1rem; padding-right: 1rem; }
      .py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
      .sm\\:grid { display: grid; }
      .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .sm\\:gap-4 { grid-gap: 1rem; }
      .sm\\:col-span-2 { grid-column: span 2 / span 2; }
    `);
    printWindow.document.write("</style>");
    printWindow.document.write("</head><body>");
    printWindow.document.write(table.outerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  // -----------------------------
  // ✅ Date dropdown presets
  // -----------------------------
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

      case "This Week": {
        const today = startDate.getDay();
        startDate.setDate(startDate.getDate() - today);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case "This Week - Date": {
        const startOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - startOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case "This Month":
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "This Month - Date":
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "Last Month to Date":
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "This Fiscal Quarter": {
        const quarterStartMonth = Math.floor(startDate.getMonth() / 3) * 3;
        startDate = new Date(startDate.getFullYear(), quarterStartMonth, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case "This Fiscal Year":
        startDate = new Date(startDate.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getFullYear() + 1, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "Yesterday":
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "Last Week":
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "Last Month":
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        break;
    }

    setFromDate(new Date(startDate));
    setToDate(new Date(endDate));
  };

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });

  const getCurrentDate = () => formatDate(new Date());

  const renderSelectedDatePeriod = () => {
    if (fromDate && toDate) return `${formatDate(fromDate)} to ${formatDate(toDate)}`;
    if (fromDate) return `From ${formatDate(fromDate)}`;
    if (toDate) return `To ${formatDate(toDate)}`;
    return "All";
  };

  // ✅ Fees-based P&L (Taxes removed)
  const revenueNum = Number(totalRevenue || 0);
  const cogsNum = 0;
  const expenseNum = Number(totalExpenses || 0);

  const profitAndLossData = {
    revenue: revenueNum.toFixed(2),
    costOfGoodsSold: cogsNum.toFixed(2),
    grossProfit: (revenueNum - cogsNum).toFixed(2),
    operatingExpenses: expenseNum.toFixed(2),
    netIncome: (revenueNum - cogsNum - expenseNum).toFixed(2),
  };

  return (
    <div className="container mx-auto flex min-h-screen">
      <div className="ml-8 flex-1">
        <div className="mb-8">
          <h2 className="text-2xl text-center font-bold mb-4">
            Profit &amp; Loss Statement
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {/* Dates dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="dateOption" className="text-lg whitespace-nowrap">
                Dates
              </label>

              <select
                id="dateOption"
                value={selectedDateOption}
                onChange={handleDateOptionChange}
                className="border border-gray-300 rounded-md p-2"
                style={{ width: "180px" }}
              >
                <option value="All">All</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Week - Date">This Week - Date</option>
                <option value="This Month">This Month</option>
                <option value="This Month - Date">This Month - Date</option>
                <option value="Last Month">Last Month</option>
                <option value="Last Month to Date">Last Month to Date</option>
                <option value="This Fiscal Quarter">This Fiscal Quarter</option>
                <option value="This Fiscal Year">This Fiscal Year</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last Week">Last Week</option>
              </select>
            </div>

            {/* Date pickers */}
            <div className="flex items-center gap-2">
              <div className="text-lg whitespace-nowrap">Fees by Date</div>

              <div className="relative">
                <DatePicker
                  selected={fromDate}
                  onChange={(d) => setFromDate(d)}
                  dateFormat="MM-dd-yyyy"
                  placeholderText="From"
                  className="border border-gray-300 rounded-md p-2 pr-8 cursor-pointer"
                />
                <FaCalendar className="absolute top-3 right-2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <DatePicker
                  selected={toDate}
                  onChange={(d) => setToDate(d)}
                  dateFormat="MM-dd-yyyy"
                  placeholderText="To"
                  className="border border-gray-300 rounded-md p-2 pr-8 cursor-pointer"
                />
                <FaCalendar className="absolute top-3 right-2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Search */}
            <div className="sm:ml-auto">
              <input
                type="text"
                className="border border-gray-300 rounded-md p-2 w-full sm:w-[220px]"
                placeholder="Search (fees/expenses)"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              className="text-blue-500 cursor-pointer"
              onClick={() => window.history.back()}
            >
              Back
            </button>
          </div>

          <div
            className="table-container overflow-x-auto overflow-y-auto"
            style={{ maxHeight: "420px" }}
            id="pnl-table"
            ref={tableRef}
          >
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold underline">Income Statement</h2>

              <p>
                <strong>Selected Date Period:</strong> {renderSelectedDatePeriod()}
              </p>
              <p>Report Printed On: {getCurrentDate()}</p>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  Financial Summary
                </h3>
              </div>

              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Revenue (Fees Collected)
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                      ₦{profitAndLossData.revenue}
                    </dd>
                  </div>

                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">COGS</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                      ₦{profitAndLossData.costOfGoodsSold}
                    </dd>
                  </div>

                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Gross Profit</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 font-semibold">
                      ₦{profitAndLossData.grossProfit}
                    </dd>
                  </div>

                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Operating Expenses
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                      ₦{profitAndLossData.operatingExpenses}
                    </dd>
                  </div>

                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Net Income</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 font-bold underline">
                      ₦{profitAndLossData.netIncome}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* ✅ Recent Fees Payments (filtered) — NO CLICK LOGIC */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Recent Fees Payments (filtered)</h4>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr>
                      <th className="border p-2">S/N</th>
                      <th className="border p-2">Student</th>
                      <th className="border p-2">Amount</th>
                      <th className="border p-2">Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPayments.slice(0, 20).map((p, idx) => {
                      const d = p?.timestamp?.toDate ? p.timestamp.toDate() : null;
                      const showDate =
                        d && !Number.isNaN(d.getTime()) ? formatDate(d) : "-";

                      const amount = Number(p?.totalAmount || 0);

                      return (
                        <tr key={p?.id || idx}>
                          <td className="border p-2">{idx + 1}</td>
                          <td className="border p-2">
                            {p?.studentName || p?.name || "-"}
                          </td>
                          <td className="border p-2">₦{amount.toLocaleString()}</td>
                          <td className="border p-2">{showDate}</td>
                        </tr>
                      );
                    })}

                    {filteredPayments.length === 0 && (
                      <tr>
                        <td className="border p-2" colSpan={4}>
                          No payments found for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Showing first 20 payments.
              </p>
            </div>
          </div>

          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md block mx-auto mt-6"
            onClick={saveAndPrintTable}
          >
            Print Statement
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfitAndLoss;
