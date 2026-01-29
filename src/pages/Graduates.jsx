import React, { useEffect, useState, useRef } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { useMyContext } from "../Context/MyContext";
import { MdClose } from "react-icons/md";
import Spinner from "../components/Spinner";
import { toast } from "react-toastify";

export default function Graduates() {
  const { state } = useMyContext();
  const db = getFirestore();

  const [graduates, setGraduates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrad, setSelectedGrad] = useState(null);
  const tableRef = useRef(null);

  useEffect(() => {
    setGraduates([]);
    setLoading(true);

    const schoolId = state.selectedSchoolId;
    if (!schoolId) {
      setLoading(false);
      return;
    }

    const gradsRef = collection(db, `schools/${schoolId}/graduates`);
    const q = query(gradsRef, orderBy("graduatedAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setGraduates(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Graduates listener error:", err);
        toast.error("Failed to load graduates.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db, state.selectedSchoolId]);

  const formatDate = (val) => {
    if (!val) return "-";
    if (val?.toDate) return val.toDate().toLocaleString();
    if (val?.seconds) return new Date(val.seconds * 1000).toLocaleString();
    try {
      const d = new Date(val);
      if (!isNaN(d)) return d.toLocaleString();
    } catch {}
    return "-";
  };

  const handleDeleteGraduate = async (grad) => {
    if (!state.selectedSchoolId) return;
    const ok = window.confirm(`Delete graduate record for ${grad.name}? This cannot be undone.`);
    if (!ok) return;

    try {
      await deleteDoc(doc(db, `schools/${state.selectedSchoolId}/graduates`, grad.id));
      toast.success("Graduate record deleted");
      if (selectedGrad?.id === grad.id) setSelectedGrad(null);
    } catch (err) {
      console.error("Failed to delete graduate:", err);
      toast.error("Failed to delete graduate");
    }
  };

  const handlePrint = () => {
    const table = tableRef.current;
    if (!table) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write("<html><head><title>Graduates</title>");
    printWindow.document.write("<style>");
    printWindow.document.write("body{font-family:Arial, sans-serif; color:#000}");
    printWindow.document.write("table{width:100%; border-collapse:collapse}");
    printWindow.document.write("th,td{border:1px solid #000; padding:6px; text-align:left; font-size:12px}");
    printWindow.document.write("th{background:#eee}");
    printWindow.document.write("</style>");
    printWindow.document.write("</head><body>");
    printWindow.document.write(`<h2 style="text-align:center;">${state.selectedSchoolName || "Graduates"}</h2>`);
    printWindow.document.write(table.outerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  if (loading) return <Spinner />;

  if (!state.selectedSchoolId) {
    return (
      <div className="p-6">
        <p className="text-red-600">Please select a school to view graduates.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Graduates</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Print
          </button>
        </div>
      </div>

      <div className="table-container overflow-x-auto" style={{ maxHeight: "60vh" }} ref={tableRef}>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1">S/N</th>
              <th className="border px-2 py-1">Photo</th>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Admission No.</th>
              <th className="border px-2 py-1">Class</th>
              <th className="border px-2 py-1">Sex</th>
              <th className="border px-2 py-1">Graduated At</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {graduates.length === 0 ? (
              <tr>
                <td className="p-4" colSpan={8}>
                  No graduates found.
                </td>
              </tr>
            ) : (
              graduates.map((g, idx) => (
                <tr
                  key={g.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedGrad(g)}
                >
                  <td className="border px-2 py-1 align-top">{idx + 1}</td>
                  <td className="border px-2 py-1">
                    {g.photoURL ? (
                      <img src={g.photoURL} alt={g.name} className="w-12 h-12 object-cover rounded-full" />
                    ) : (
                      <span className="text-sm text-gray-500">No Photo</span>
                    )}
                  </td>
                  <td className="border px-2 py-1 align-top">{g.name}</td>
                  <td className="border px-2 py-1 align-top">{g.admissionNumber}</td>
                  <td className="border px-2 py-1 align-top">{g.class}</td>
                  <td className="border px-2 py-1 align-top">{g.sex}</td>
                  <td className="border px-2 py-1 align-top">{formatDate(g.graduatedAt)}</td>
                  <td className="border px-2 py-1 align-top">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedGrad(g); }}
                        className="px-2 py-1 bg-gray-200 rounded"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteGraduate(g); }}
                        className="px-2 py-1 bg-red-500 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Graduate details modal */}
      {selectedGrad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl relative">
            <button
              onClick={() => setSelectedGrad(null)}
              className="absolute top-3 right-3 text-gray-600"
            >
              <MdClose size={24} />
            </button>

            <div className="flex gap-6">
              <div className="w-1/3">
                {selectedGrad.photoURL ? (
                  <img src={selectedGrad.photoURL} alt={selectedGrad.name} className="w-full h-auto rounded" />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center">No Photo</div>
                )}
              </div>

              <div className="w-2/3">
                <h3 className="text-xl font-bold mb-2">{selectedGrad.name}</h3>
                <p><strong>Admission No:</strong> {selectedGrad.admissionNumber}</p>
                <p><strong>Class:</strong> {selectedGrad.class}</p>
                <p><strong>Sex:</strong> {selectedGrad.sex}</p>
                <p><strong>Graduated At:</strong> {formatDate(selectedGrad.graduatedAt)}</p>
                <p className="mt-4 text-sm text-gray-600"><strong>Original Student ID:</strong> {selectedGrad.originalStudentId || "-"}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-blue-600 text-white rounded"
                  >
                    Print
                  </button>
                  <button
                    onClick={() => setSelectedGrad(null)}
                    className="px-3 py-2 bg-gray-200 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}