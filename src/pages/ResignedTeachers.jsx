import React, { useEffect, useState, useRef } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, deleteDoc, setDoc } from "firebase/firestore";
import { useMyContext } from "../Context/MyContext";
import { MdClose } from "react-icons/md";
import Spinner from "../components/Spinner";
import { toast } from "react-toastify";

export default function ResignedTeachers() {
  const { state } = useMyContext();
  const db = getFirestore();

  const [resigned, setResigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const tableRef = useRef(null);

  useEffect(() => {
    setResigned([]);
    setLoading(true);

    const schoolId = state.selectedSchoolId;
    if (!schoolId) {
      setLoading(false);
      return;
    }

    const colRef = collection(db, `schools/${schoolId}/resigned`);
    const q = query(colRef, orderBy("resignedAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setResigned(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Resigned teachers listener error:", err);
        toast.error("Failed to load resigned teachers.");
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

  const handleDelete = async (r) => {
    if (!state.selectedSchoolId) return;
    const ok = window.confirm(`Delete resigned record for ${r.name}? This cannot be undone.`);
    if (!ok) return;

    try {
      await deleteDoc(doc(db, `schools/${state.selectedSchoolId}/resigned`, r.id));
      toast.success("Resigned record deleted");
      if (selected?.id === r.id) setSelected(null);
    } catch (err) {
      console.error("Failed to delete resigned record:", err);
      toast.error("Failed to delete record");
    }
  };

  const handleRestore = async (r) => {
    if (!state.selectedSchoolId) return;
    const ok = window.confirm(`Restore ${r.name} back to active teachers?`);
    if (!ok) return;

    try {
      // Write teacher back to teachers collection (uses originalTeacherId if present)
      const teacherId = r.originalTeacherId || r.id || `${Date.now()}`;
      const teacherDocRef = doc(db, `schools/${state.selectedSchoolId}/teachers`, teacherId);

      // copy fields but remove resigned-specific metadata
      const { resignedAt, originalTeacherId, ...teacherData } = r;
      await setDoc(teacherDocRef, teacherData);

      // delete from resigned collection
      await deleteDoc(doc(db, `schools/${state.selectedSchoolId}/resigned`, r.id));

      toast.success(`${r.name} restored to teachers`);
      if (selected?.id === r.id) setSelected(null);
    } catch (err) {
      console.error("Restore failed:", err);
      toast.error("Failed to restore teacher");
    }
  };

  const handlePrint = () => {
    const table = tableRef.current;
    if (!table) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write("<html><head><title>Resigned Teachers</title>");
    printWindow.document.write("<style>");
    printWindow.document.write("body{font-family:Arial, sans-serif; color:#000}");
    printWindow.document.write("table{width:100%; border-collapse:collapse}");
    printWindow.document.write("th,td{border:1px solid #000; padding:6px; text-align:left; font-size:12px}");
    printWindow.document.write("th{background:#eee}");
    printWindow.document.write("</style>");
    printWindow.document.write("</head><body>");
    printWindow.document.write(`<h2 style="text-align:center;">${state.selectedSchoolName || "Resigned Teachers"}</h2>`);
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
        <p className="text-red-600">Please select a school to view resigned teachers.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Resigned Teachers</h2>
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
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Subject</th>
              <th className="border px-2 py-1">Sex</th>
              <th className="border px-2 py-1">Resigned At</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>

          <tbody>
            {resigned.length === 0 ? (
              <tr>
                <td className="p-4" colSpan={8}>
                  No resigned teachers found.
                </td>
              </tr>
            ) : (
              resigned.map((r, idx) => (
                <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(r)}>
                  <td className="border px-2 py-1 align-top">{idx + 1}</td>
                  <td className="border px-2 py-1">
                    {r.photoURL ? (
                      <img src={r.photoURL} alt={r.name} className="w-12 h-12 object-cover rounded-full" />
                    ) : (
                      <span className="text-sm text-gray-500">No Photo</span>
                    )}
                  </td>
                  <td className="border px-2 py-1 align-top">{r.name}</td>
                  <td className="border px-2 py-1 align-top">{r.email}</td>
                  <td className="border px-2 py-1 align-top">{r.subject}</td>
                  <td className="border px-2 py-1 align-top">{r.sex}</td>
                  <td className="border px-2 py-1 align-top">{formatDate(r.resignedAt)}</td>
                  <td className="border px-2 py-1 align-top">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(r); }}
                        className="px-2 py-1 bg-gray-200 rounded"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRestore(r); }}
                        className="px-2 py-1 bg-green-600 text-white rounded"
                      >
                        Restore
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl relative">
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-gray-600">
              <MdClose size={24} />
            </button>

            <div className="flex gap-6">
              <div className="w-1/3">
                {selected.photoURL ? (
                  <img src={selected.photoURL} alt={selected.name} className="w-full h-auto rounded" />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center">No Photo</div>
                )}
              </div>

              <div className="w-2/3">
                <h3 className="text-xl font-bold mb-2">{selected.name}</h3>
                <p><strong>Email:</strong> {selected.email}</p>
                <p><strong>Subject:</strong> {selected.subject}</p>
                <p><strong>Sex:</strong> {selected.sex}</p>
                <p><strong>Resigned At:</strong> {formatDate(selected.resignedAt)}</p>
                <p className="mt-4 text-sm text-gray-600"><strong>Original Teacher ID:</strong> {selected.originalTeacherId || "-"}</p>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-blue-600 text-white rounded"
                  >
                    Print
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="px-3 py-2 bg-gray-200 rounded"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { handleRestore(selected); }}
                    className="px-3 py-2 bg-green-600 text-white rounded"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => { handleDelete(selected); }}
                    className="px-3 py-2 bg-red-500 text-white rounded"
                  >
                    Delete
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