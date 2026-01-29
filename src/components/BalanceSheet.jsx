import React, { useEffect, useMemo, useState, useRef } from "react";
import { useMyContext } from "../Context/MyContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaPrint, FaFileCsv } from "react-icons/fa";

/**
 * BalanceSheet page for School
 *
 * - Reads assets and liabilities from context (real-time).
 * - Computes totals and basic equity (Assets - Liabilities).
 * - Allows optional date range filtering (by item.timestamp).
 * - Supports printing and CSV export.
 *
 * Notes:
 * - Asset value and liability amount fields are determined heuristically:
 *   - Asset value: asset.value || asset.amount || asset.purchasePrice || asset.costPrice || 0
 *   - Liability amount: liability.amount || liability.value || 0
 * - If your data uses different property names adjust the helpers below.
 */

const formatCurrency = (n) =>
  `₦${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const getAssetValue = (a) =>
  Number(a?.value ?? a?.amount ?? a?.purchasePrice ?? a?.costPrice ?? 0);

const getLiabilityAmount = (l) => Number(l?.amount ?? l?.value ?? 0);

export default function BalanceSheet() {
  const { state } = useMyContext();
  const tableRef = useRef(null);

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // Derived lists filtered by date if provided
  const filteredAssets = useMemo(() => {
    const arr = state.assets || [];
    if (!fromDate && !toDate) return arr;
    const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : -Infinity;
    const to = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : Infinity;
    return arr.filter((it) => {
      const t =
        (it.timestamp && it.timestamp?.toDate && it.timestamp.toDate()) ||
        (it.timestamp && it.timestamp.seconds && new Date(it.timestamp.seconds * 1000)) ||
        (it.createdAt && it.createdAt?.toDate && it.createdAt.toDate()) ||
        new Date();
      const ms = new Date(t).getTime();
      return ms >= from && ms <= to;
    });
  }, [state.assets, fromDate, toDate]);

  const filteredLiabilities = useMemo(() => {
    const arr = state.liabilities || [];
    if (!fromDate && !toDate) return arr;
    const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : -Infinity;
    const to = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : Infinity;
    return arr.filter((it) => {
      const t =
        (it.timestamp && it.timestamp?.toDate && it.timestamp.toDate()) ||
        (it.timestamp && it.timestamp.seconds && new Date(it.timestamp.seconds * 1000)) ||
        (it.createdAt && it.createdAt?.toDate && it.createdAt.toDate()) ||
        new Date();
      const ms = new Date(t).getTime();
      return ms >= from && ms <= to;
    });
  }, [state.liabilities, fromDate, toDate]);

  // Totals
  const totalAssets = useMemo(
    () => filteredAssets.reduce((s, a) => s + getAssetValue(a), 0),
    [filteredAssets]
  );
  const totalLiabilities = useMemo(
    () => filteredLiabilities.reduce((s, l) => s + getLiabilityAmount(l), 0),
    [filteredLiabilities]
  );

  // Retained earnings / net income approximation: payments - expenses (school context)
  const retainedEarnings = useMemo(() => {
    const payments = state.payments || [];
    const expenses = state.expenses || [];

    const totalPayments =
      payments.reduce((s, p) => {
        // payments may have totalAmount or items[]
        if (typeof p.totalAmount === "number") return s + Number(p.totalAmount || 0);
        if (Array.isArray(p.items)) return s + p.items.reduce((a, it) => a + Number(it.amount || 0), 0);
        return s;
      }, 0) || 0;

    const totalExpenses = expenses.reduce((s, e) => {
      const amt = Number(e.amount ?? e.value ?? e.total ?? 0);
      return s + (isNaN(amt) ? 0 : amt);
    }, 0);

    return totalPayments - totalExpenses;
  }, [state.payments, state.expenses]);

  const equity = useMemo(() => totalAssets - totalLiabilities + retainedEarnings, [
    totalAssets,
    totalLiabilities,
    retainedEarnings,
  ]);

  useEffect(() => {
    // ensure to reset paging/filters if school changes
    // (optional) console.log when selectedSchool changes
  }, [state.selectedSchoolId]);

  const printReport = () => {
    const node = tableRef.current;
    const printableHtml = `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Balance Sheet - ${state.selectedSchoolName || ""}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; color: #000; }
            h1, h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px;}
            th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 12px; }
            th { background: #f2f2f2; }
            .totals { font-weight: bold; }
            .two-column { display:flex; gap: 12px; }
            .col { flex: 1; }
            .meta { text-align:center; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <h1>${state.selectedSchoolName || "School"}</h1>
          <div class="meta">
            <div>Balance Sheet</div>
            <div>${fromDate ? new Date(fromDate).toLocaleDateString() : "From: -"} — ${toDate ? new Date(toDate).toLocaleDateString() : "To: -"}</div>
            <div>Printed: ${new Date().toLocaleString()}</div>
          </div>
          ${node ? node.outerHTML : ""}
        </body>
      </html>
    `;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(printableHtml);
    w.document.close();
    setTimeout(() => {
      w.print();
      w.close();
    }, 300);
  };

  const exportCsv = () => {
    // Simple CSV with assets and liabilities lists. We'll produce two tables separated by blank row.
    const rows = [];
    rows.push(["ASSETS"]);
    rows.push(["Name", "Description", "Value", "Date"]);
    filteredAssets.forEach((a) => {
      const name = a.name || a.title || "";
      const desc = a.description || a.note || "";
      const value = getAssetValue(a);
      const date =
        (a.timestamp && a.timestamp.toDate && a.timestamp.toDate().toLocaleDateString()) ||
        (a.timestamp && a.timestamp.seconds && new Date(a.timestamp.seconds * 1000).toLocaleDateString()) ||
        "";
      rows.push([name, desc, value, date]);
    });

    rows.push([]);
    rows.push(["LIABILITIES"]);
    rows.push(["Name", "Description", "Amount", "Date"]);
    filteredLiabilities.forEach((l) => {
      const name = l.name || l.title || "";
      const desc = l.description || l.note || "";
      const amount = getLiabilityAmount(l);
      const date =
        (l.timestamp && l.timestamp.toDate && l.timestamp.toDate().toLocaleDateString()) ||
        (l.timestamp && l.timestamp.seconds && new Date(l.timestamp.seconds * 1000).toLocaleDateString()) ||
        "";
      rows.push([name, desc, amount, date]);
    });

    // Totals and equity
    rows.push([]);
    rows.push(["Total Assets", totalAssets]);
    rows.push(["Total Liabilities", totalLiabilities]);
    rows.push(["Retained Earnings (approx)", retainedEarnings]);
    rows.push(["Equity (Assets - Liabilities + Retained)", equity]);

    // Convert to CSV string
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");

    // Trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.selectedSchoolName || "balance_sheet"}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Balance Sheet</h2>
          <div className="text-sm text-gray-600">
            {state.selectedSchoolName ? state.selectedSchoolName : "No school selected"}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
            <label className="text-sm text-gray-700">From</label>
            <DatePicker
              selected={fromDate}
              onChange={(d) => setFromDate(d)}
              dateFormat="yyyy-MM-dd"
              isClearable
              placeholderText="Start date"
              className="border rounded px-2 py-1 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
            <label className="text-sm text-gray-700">To</label>
            <DatePicker
              selected={toDate}
              onChange={(d) => setToDate(d)}
              dateFormat="yyyy-MM-dd"
              isClearable
              placeholderText="End date"
              className="border rounded px-2 py-1 text-sm"
            />
          </div>

          <button
            onClick={() => { setFromDate(null); setToDate(null); }}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            title="Clear dates"
          >
            Clear
          </button>

          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            title="Export CSV"
          >
            <FaFileCsv /> Export CSV
          </button>

          <button
            onClick={printReport}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            title="Print balance sheet"
          >
            <FaPrint /> Print
          </button>
        </div>
      </div>

      <div ref={tableRef}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assets */}
          <div className="col">
            <h3 className="text-lg font-semibold mb-2">Assets</h3>
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="border px-2 py-1 text-left">Name</th>
                  <th className="border px-2 py-1 text-left">Description</th>
                  <th className="border px-2 py-1 text-right">Value</th>
                  <th className="border px-2 py-1 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td className="border px-2 py-2" colSpan={4}>No assets found</td>
                  </tr>
                ) : (
                  filteredAssets.map((a) => {
                    const val = getAssetValue(a);
                    const date =
                      (a.timestamp && a.timestamp.toDate && a.timestamp.toDate().toLocaleDateString()) ||
                      (a.timestamp && a.timestamp.seconds && new Date(a.timestamp.seconds * 1000).toLocaleDateString()) ||
                      "";
                    return (
                      <tr key={a.id || a.name + Math.random()}>
                        <td className="border px-2 py-1">{a.name || a.title || "-"}</td>
                        <td className="border px-2 py-1">{a.description || a.note || "-"}</td>
                        <td className="border px-2 py-1 text-right">{formatCurrency(val)}</td>
                        <td className="border px-2 py-1">{date}</td>
                      </tr>
                    );
                  })
                )}
                <tr className="totals">
                  <td className="border px-2 py-1 font-semibold" colSpan={2}>Total Assets</td>
                  <td className="border px-2 py-1 text-right font-semibold">{formatCurrency(totalAssets)}</td>
                  <td className="border px-2 py-1"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Liabilities */}
          <div className="col">
            <h3 className="text-lg font-semibold mb-2">Liabilities</h3>
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="border px-2 py-1 text-left">Name</th>
                  <th className="border px-2 py-1 text-left">Description</th>
                  <th className="border px-2 py-1 text-right">Amount</th>
                  <th className="border px-2 py-1 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredLiabilities.length === 0 ? (
                  <tr>
                    <td className="border px-2 py-2" colSpan={4}>No liabilities found</td>
                  </tr>
                ) : (
                  filteredLiabilities.map((l) => {
                    const amt = getLiabilityAmount(l);
                    const date =
                      (l.timestamp && l.timestamp.toDate && l.timestamp.toDate().toLocaleDateString()) ||
                      (l.timestamp && l.timestamp.seconds && new Date(l.timestamp.seconds * 1000).toLocaleDateString()) ||
                      "";
                    return (
                      <tr key={l.id || l.name + Math.random()}>
                        <td className="border px-2 py-1">{l.name || l.title || "-"}</td>
                        <td className="border px-2 py-1">{l.description || l.note || "-"}</td>
                        <td className="border px-2 py-1 text-right">{formatCurrency(amt)}</td>
                        <td className="border px-2 py-1">{date}</td>
                      </tr>
                    );
                  })
                )}
                <tr className="totals">
                  <td className="border px-2 py-1 font-semibold" colSpan={2}>Total Liabilities</td>
                  <td className="border px-2 py-1 text-right font-semibold">{formatCurrency(totalLiabilities)}</td>
                  <td className="border px-2 py-1"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 border rounded">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Assets</div>
              <div className="text-xl font-bold">{formatCurrency(totalAssets)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Liabilities</div>
              <div className="text-xl font-bold">{formatCurrency(totalLiabilities)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Equity (incl. retained earnings)</div>
              <div className="text-xl font-bold">{formatCurrency(equity)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Retained Earnings approx: {formatCurrency(retainedEarnings)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}