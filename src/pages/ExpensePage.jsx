import { useState, useEffect, useMemo } from "react";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useMyContext } from "../Context/MyContext";
import Spinner from "../components/Spinner";

export default function ExpensePage() {
  const { state } = useMyContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  // Modal / edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExpenseId, setCurrentExpenseId] = useState(null);

  // Receipt upload
  const [receiptFile, setReceiptFile] = useState(null);

  // Selected expense details modal
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Dropdown selection + "Others" custom input
  const [expenseOption, setExpenseOption] = useState("");
  const [otherExpenseText, setOtherExpenseText] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
    note: "",
    receiptURL: "",
  });

  const { amount, category, date, note } = formData;

  // ✅ Expected school expenses (edit/add as you like) — must end with Others
  const expectedExpenseOptions = useMemo(
    () => [
      "Salaries & Wages",
      "Stationery",
      "Fuel / Transport",
      "Electricity (NEPA)",
      "Generator Maintenance",
      "Internet / Data",
      "Water",
      "Repairs & Maintenance",
      "Cleaning / Janitorial",
      "Security",
      "Rent",
      "Taxes / Levies",
      "Exams / Printing",
      "Learning Materials",
      "Events / Activities",
      "Others",
    ],
    []
  );

  // ✅ Total expenses (exclude voided)
  const totalExpenses = useMemo(() => {
    const list = state.expenses || [];
    return list.reduce((sum, exp) => {
      if (exp?.voided) return sum;
      const n = Number(exp?.amount);
      if (Number.isNaN(n)) return sum;
      return sum + n;
    }, 0);
  }, [state.expenses]);

  // Prefill form when editing
  useEffect(() => {
    if (isEditing && currentExpenseId) {
      const expenseToEdit = (state.expenses || []).find(
        (exp) => exp.id === currentExpenseId
      );

      if (expenseToEdit) {
        const savedTitle = (expenseToEdit.title || "").trim();
        const inList = expectedExpenseOptions.includes(savedTitle);

        if (inList) {
          setExpenseOption(savedTitle);
          setOtherExpenseText("");
        } else if (savedTitle) {
          setExpenseOption("Others");
          setOtherExpenseText(savedTitle);
        } else {
          setExpenseOption("");
          setOtherExpenseText("");
        }

        setFormData({
          title: savedTitle || "",
          amount:
            expenseToEdit.amount === 0 || expenseToEdit.amount
              ? String(expenseToEdit.amount)
              : "",
          category: expenseToEdit.category || "",
          date: expenseToEdit.date || "",
          note: expenseToEdit.note || "",
          receiptURL: expenseToEdit.receiptURL || "",
        });
      }
    }
  }, [isEditing, currentExpenseId, state.expenses, expectedExpenseOptions]);

  const onChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleReceiptChange = (e) => {
    setReceiptFile(e.target.files?.[0] || null);
  };

  const uploadReceipt = async () => {
    if (!receiptFile) return null;

    const storageRef = ref(storage, `expenses/${receiptFile.name}-${Date.now()}`);
    await uploadBytes(storageRef, receiptFile);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const handleExpenseOptionChange = (e) => {
    const val = e.target.value;
    setExpenseOption(val);

    if (val === "Others") {
      setOtherExpenseText("");
      return;
    }

    setOtherExpenseText("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const schoolId = state.selectedSchoolId;
      if (!schoolId) {
        toast.error("No school selected. Please select a school first.");
        setLoading(false);
        return;
      }

      if (!expenseOption) {
        toast.error("Please select an expense type.");
        setLoading(false);
        return;
      }

      // ✅ If Others selected, admin must enter what it is
      let finalTitle = "";
      if (expenseOption === "Others") {
        if (!otherExpenseText || !otherExpenseText.trim()) {
          toast.error("Please type what the 'Other' expense is.");
          setLoading(false);
          return;
        }
        finalTitle = otherExpenseText.trim();
      } else {
        finalTitle = expenseOption.trim();
      }

      // ✅ Date is required
      if (!date || !date.trim()) {
        toast.error("Please select the expense date.");
        setLoading(false);
        return;
      }

      // Amount validation
      const amountNumber = Number(String(amount).replace(/,/g, "").trim());
      if (!amount || Number.isNaN(amountNumber) || amountNumber <= 0) {
        toast.error("Please enter a valid amount.");
        setLoading(false);
        return;
      }

      let receiptURL = formData.receiptURL;
      if (receiptFile) {
        receiptURL = await uploadReceipt();
      }

      const expenseData = {
        title: finalTitle,
        amount: amountNumber,
        category: (category || "").trim(),
        date: date.trim(),
        note: (note || "").trim(),
        receiptURL: receiptURL || "",
        timestamp: serverTimestamp(),
        // keep existing void state unless new record
      };

      if (isEditing && currentExpenseId) {
        // preserve voided fields if already voided
        const existing = (state.expenses || []).find((x) => x.id === currentExpenseId);
        const keepVoided =
          existing?.voided
            ? { voided: true, voidedAt: existing?.voidedAt || serverTimestamp() }
            : {};

        await updateDoc(
          doc(db, `schools/${schoolId}/expenses`, currentExpenseId),
          { ...expenseData, ...keepVoided }
        );
        toast.success("Expense updated successfully!");
      } else {
        const expenseId = `${Date.now()}`;
        await setDoc(doc(db, `schools/${schoolId}/expenses`, expenseId), {
          ...expenseData,
          id: expenseId,
          voided: false,
        });
        toast.success("Expense added successfully!");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (expenseId) => {
    const exp = (state.expenses || []).find((x) => x.id === expenseId);
    if (exp?.voided) {
      toast.info("This expense is voided and cannot be edited.");
      return;
    }

    setIsEditing(true);
    setCurrentExpenseId(expenseId);
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setCurrentExpenseId(null);
    setReceiptFile(null);

    setExpenseOption("");
    setOtherExpenseText("");

    setFormData({
      title: "",
      amount: "",
      category: "",
      date: "",
      note: "",
      receiptURL: "",
    });
  };

  // ✅ Void = mark row inactive (no delete), and exclude from total by filtering voided
  const handleVoidExpense = async (expense) => {
    if (!expense?.id) {
      toast.error("Invalid expense record.");
      return;
    }

    if (expense.voided) {
      toast.info("This expense is already voided.");
      return;
    }

    const ok = window.confirm(
      `Void "${expense.title}"? It will stay in the list but will NOT count in totals.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const schoolId = state.selectedSchoolId;

      await updateDoc(doc(db, `schools/${schoolId}/expenses`, expense.id), {
        voided: true,
        voidedAt: serverTimestamp(),
      });

      if (selectedExpense?.id === expense.id) {
        setSelectedExpense((prev) => ({
          ...prev,
          voided: true,
        }));
      }

      toast.success("Expense voided. It is now inactive and excluded from totals.");
    } catch (err) {
      console.error("Void action failed:", err);
      toast.error("Failed to void expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentExpenseId(null);
    setReceiptFile(null);

    setExpenseOption("");
    setOtherExpenseText("");

    setFormData({
      title: "",
      amount: "",
      category: "",
      date: "",
      note: "",
      receiptURL: "",
    });
  };

  const handleReload = () => window.location.reload();

  const formatMoney = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return value ?? "";
    return n.toLocaleString();
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div>
        <div className="flex justify-between items-center m-4">
          <button onClick={handleReload} className="p-2 bg-gray-200 rounded">
            Reload
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold">Expenses</h1>
          </div>

          <button
            onClick={() => navigate("/posscreen")}
            className="p-2 bg-gray-200 rounded"
          >
            Back
          </button>
        </div>

        {/* Modal for Adding/Editing Expense */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {isEditing ? "Edit Expense" : "Add Expense"}
                </h2>
                <button onClick={handleCloseModal}>
                  <MdClose size={24} />
                </button>
              </div>

              <form onSubmit={onSubmit}>
                <select
                  value={expenseOption}
                  onChange={handleExpenseOptionChange}
                  className="border p-2 w-full mb-4 rounded"
                  required
                >
                  <option value="">Select Expense Type</option>
                  {expectedExpenseOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                {expenseOption === "Others" && (
                  <input
                    type="text"
                    value={otherExpenseText}
                    onChange={(e) => setOtherExpenseText(e.target.value)}
                    placeholder="Type the other expense"
                    className="border p-2 w-full mb-4 rounded"
                    required
                  />
                )}

                <input
                  type="text"
                  id="amount"
                  placeholder="Amount"
                  value={amount}
                  onChange={onChange}
                  className="border p-2 w-full mb-4 rounded"
                  required
                />

                <input
                  type="text"
                  id="category"
                  placeholder="Category (optional)"
                  value={category}
                  onChange={onChange}
                  className="border p-2 w-full mb-4 rounded"
                />

                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={onChange}
                  className="border p-2 w-full mb-4 rounded"
                  required
                />

                <textarea
                  id="note"
                  placeholder="Note (optional)"
                  value={note}
                  onChange={onChange}
                  className="border p-2 w-full mb-4 rounded"
                  rows={3}
                />

                <input type="file" onChange={handleReceiptChange} className="mb-4" />

                <button
                  type="submit"
                  className="bg-blue-600 text-white p-2 w-full rounded"
                >
                  {isEditing ? "Update Expense" : "Add Expense"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Selected Expense Details */}
        {selectedExpense && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md relative">
              <button
                onClick={() => setSelectedExpense(null)}
                className="absolute top-4 right-4 text-gray-600"
              >
                <MdClose size={24} />
              </button>

              <div className="text-center">
                <h2 className="text-xl font-bold">
                  {selectedExpense.title}
                  {selectedExpense.voided ? (
                    <span className="ml-2 text-sm text-red-600 font-semibold">
                      (VOIDED)
                    </span>
                  ) : null}
                </h2>

                <p className="text-gray-700 mt-1">
                  Amount: ₦{formatMoney(selectedExpense.amount)}
                </p>

                <p className="text-gray-700">
                  Category: {selectedExpense.category || "Not Specified"}
                </p>

                <p className="text-gray-700">
                  Date: {selectedExpense.date || "Not Specified"}
                </p>

                <p className="text-gray-700">
                  Note: {selectedExpense.note || "None"}
                </p>

                <div className="mt-4">
                  {selectedExpense.receiptURL ? (
                    <a
                      href={selectedExpense.receiptURL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Receipt
                    </a>
                  ) : (
                    <p className="text-gray-500">No receipt uploaded</p>
                  )}
                </div>

                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => handleEditExpense(selectedExpense.id)}
                    className={`px-4 py-2 rounded text-white ${
                      selectedExpense.voided ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500"
                    }`}
                    disabled={!!selectedExpense.voided}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleVoidExpense(selectedExpense)}
                    className={`px-4 py-2 rounded text-white ${
                      selectedExpense.voided ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600"
                    }`}
                    disabled={!!selectedExpense.voided}
                  >
                    Void
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <table className="table-auto w-full mt-4 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2">Receipt</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Note</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {(state.expenses || []).map((expense, index) => {
              const isVoided = !!expense?.voided;

              return (
                <tr
                  key={expense.id ?? index}
                  onClick={() => setSelectedExpense(expense)}
                  className={`border cursor-pointer hover:bg-gray-100 ${
                    isVoided ? "opacity-50 blur-sm" : ""
                  }`}
                  title={isVoided ? "This expense is voided (inactive)" : ""}
                >
                  <td className="px-4 py-2">
                    {expense.receiptURL ? (
                      <span className="text-green-700 font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
                  </td>

                  <td className={`px-4 py-2 ${isVoided ? "line-through" : ""}`}>
                    {expense.title}
                  </td>

                  <td className="px-4 py-2">{expense.category || "-"}</td>
                  <td className="px-4 py-2">{expense.date || "-"}</td>
                  <td className="px-4 py-2">₦{formatMoney(expense.amount)}</td>
                  <td className="px-4 py-2">{expense.note || "-"}</td>

                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditExpense(expense.id);
                      }}
                      className={`text-white px-2 py-1 rounded ${
                        isVoided ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500"
                      }`}
                      disabled={isVoided}
                    >
                      Edit
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVoidExpense(expense);
                      }}
                      className={`text-white px-2 py-1 rounded ${
                        isVoided ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600"
                      }`}
                      disabled={isVoided}
                    >
                      Void
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* ✅ Footer total (under Amount column) */}
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td className="px-4 py-2" />
              <td className="px-4 py-2" />
              <td className="px-4 py-2" />
              <td className="px-4 py-2 text-right">Total:</td>
              <td className="px-4 py-2">₦{formatMoney(totalExpenses)}</td>
              <td className="px-4 py-2" />
              <td className="px-4 py-2" />
            </tr>
          </tfoot>
        </table>

        <div className="flex justify-center p-2 mb-12 space-x-4">
          <button
            onClick={handleOpenModal}
            className="bg-blue-600 text-white px-7 py-3 text-sm font-medium rounded shadow-md hover:bg-blue-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-blue-800"
          >
            Add Expense
          </button>

          <button
            onClick={() => window.print()}
            className="bg-green-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-green-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-green-800"
          >
            Print Expenses
          </button>
        </div>
      </div>
    </>
  );
}
