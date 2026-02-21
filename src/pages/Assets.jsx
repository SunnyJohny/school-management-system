import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { storage } from "../firebase"; // Firebase Storage (for asset photo)
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  doc,
  serverTimestamp,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { useMyContext } from "../Context/MyContext";
import Spinner from "../components/Spinner";

export default function Assets() {
  const { state } = useMyContext();

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAssetId, setCurrentAssetId] = useState(null);
  const [assetPhoto, setAssetPhoto] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [formData, setFormData] = useState({
    // Core
    assetId: "",
    assetName: "",
    category: "",
    condition: "",
    status: "",
    location: "",
    assignedTo: "",
    photoURL: "",

    // Purchase / Value
    purchaseDate: "",
    purchaseVendor: "",
    purchaseCost: "",
    currentValue: "",

    // Tracking
    serialNumber: "",
    model: "",
    brand: "",
    quantity: "1",

    // Maintenance
    lastServiceDate: "",
    nextServiceDate: "",
    warrantyExpiry: "",
    notes: "",
  });

  const {
    assetId,
    assetName,
    category,
    condition,
    status,
    location,
    assignedTo,
    photoURL,
    purchaseDate,
    purchaseVendor,
    purchaseCost,
    currentValue,
    serialNumber,
    model,
    brand,
    quantity,
    lastServiceDate,
    nextServiceDate,
    warrantyExpiry,
    notes,
  } = formData;

  const navigate = useNavigate();

  const resetForm = () => {
    setAssetPhoto(null);
    setFormData({
      assetId: "",
      assetName: "",
      category: "",
      condition: "",
      status: "",
      location: "",
      assignedTo: "",
      photoURL: "",

      purchaseDate: "",
      purchaseVendor: "",
      purchaseCost: "",
      currentValue: "",

      serialNumber: "",
      model: "",
      brand: "",
      quantity: "1",

      lastServiceDate: "",
      nextServiceDate: "",
      warrantyExpiry: "",
      notes: "",
    });
  };

  useEffect(() => {
    if (isEditing && currentAssetId) {
      const assetToEdit = (state.assets || []).find((a) => a.id === currentAssetId);

      if (assetToEdit) {
        setFormData({
          assetId: assetToEdit.assetId || "",
          assetName: assetToEdit.assetName || assetToEdit.name || "",
          category: assetToEdit.category || "",
          condition: assetToEdit.condition || "",
          status: assetToEdit.status || "",
          location: assetToEdit.location || "",
          assignedTo: assetToEdit.assignedTo || "",
          photoURL: assetToEdit.photoURL || "",

          purchaseDate: assetToEdit.purchaseDate || "",
          purchaseVendor: assetToEdit.purchaseVendor || "",
          purchaseCost:
            typeof assetToEdit.purchaseCost !== "undefined" && assetToEdit.purchaseCost !== null
              ? String(assetToEdit.purchaseCost)
              : "",
          currentValue:
            typeof assetToEdit.currentValue !== "undefined" && assetToEdit.currentValue !== null
              ? String(assetToEdit.currentValue)
              : "",

          serialNumber: assetToEdit.serialNumber || "",
          model: assetToEdit.model || "",
          brand: assetToEdit.brand || "",
          quantity:
            typeof assetToEdit.quantity !== "undefined" && assetToEdit.quantity !== null
              ? String(assetToEdit.quantity)
              : "1",

          lastServiceDate: assetToEdit.lastServiceDate || "",
          nextServiceDate: assetToEdit.nextServiceDate || "",
          warrantyExpiry: assetToEdit.warrantyExpiry || "",
          notes: assetToEdit.notes || "",
        });
      }
    }
  }, [isEditing, currentAssetId, state.assets]);

  const onChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handlePhotoChange = (e) => {
    setAssetPhoto(e.target.files?.[0] || null);
  };

  const uploadAssetPhoto = async () => {
    if (!assetPhoto) return null;
    const storageRef = ref(storage, `assets/${assetPhoto.name}-${Date.now()}`);
    await uploadBytes(storageRef, assetPhoto);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  // ✅ optional numeric validation: only validate if user typed something
  const isValidNumberLike = (v) => {
    const s = String(v || "").trim();
    if (!s) return true;
    const n = Number(s.replace(/,/g, ""));
    return !Number.isNaN(n);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isValidNumberLike(purchaseCost)) {
        toast.error("Purchase cost must be a number.");
        setLoading(false);
        return;
      }

      if (!isValidNumberLike(currentValue)) {
        toast.error("Current value must be a number.");
        setLoading(false);
        return;
      }

      if (!isValidNumberLike(quantity)) {
        toast.error("Quantity must be a number.");
        setLoading(false);
        return;
      }

      let newPhotoURL = photoURL;
      if (assetPhoto) {
        newPhotoURL = await uploadAssetPhoto();
      }

      const purchaseCostNumber =
        purchaseCost === "" ? null : Number(String(purchaseCost).replace(/,/g, ""));
      const safePurchaseCost = Number.isNaN(purchaseCostNumber) ? null : purchaseCostNumber;

      const currentValueNumber =
        currentValue === "" ? null : Number(String(currentValue).replace(/,/g, ""));
      const safeCurrentValue = Number.isNaN(currentValueNumber) ? null : currentValueNumber;

      const quantityNumber =
        quantity === "" ? null : Number(String(quantity).replace(/,/g, ""));
      const safeQuantity = Number.isNaN(quantityNumber) ? 1 : quantityNumber;

      const assetData = {
        assetId: assetId?.trim?.() ? assetId.trim() : "",
        assetName: assetName?.trim?.() ? assetName.trim() : "",
        category: category?.trim?.() ? category.trim() : "",
        condition: condition?.trim?.() ? condition.trim() : "",
        status: status?.trim?.() ? status.trim() : "",
        location: location?.trim?.() ? location.trim() : "",
        assignedTo: assignedTo?.trim?.() ? assignedTo.trim() : "",
        photoURL: newPhotoURL || "",

        purchaseDate: purchaseDate?.trim?.() ? purchaseDate.trim() : "",
        purchaseVendor: purchaseVendor?.trim?.() ? purchaseVendor.trim() : "",
        purchaseCost: safePurchaseCost,
        currentValue: safeCurrentValue,

        serialNumber: serialNumber?.trim?.() ? serialNumber.trim() : "",
        model: model?.trim?.() ? model.trim() : "",
        brand: brand?.trim?.() ? brand.trim() : "",
        quantity: safeQuantity,

        lastServiceDate: lastServiceDate?.trim?.() ? lastServiceDate.trim() : "",
        nextServiceDate: nextServiceDate?.trim?.() ? nextServiceDate.trim() : "",
        warrantyExpiry: warrantyExpiry?.trim?.() ? warrantyExpiry.trim() : "",
        notes: notes?.trim?.() ? notes.trim() : "",

        timestamp: serverTimestamp(),
      };

      if (!state?.selectedSchoolId) {
        toast.error("No school selected. Please select a school first.");
        setLoading(false);
        return;
      }

      if (isEditing && currentAssetId) {
        await updateDoc(
          doc(db, `schools/${state.selectedSchoolId}/assets`, currentAssetId),
          assetData,
        );
        toast.success("Asset updated successfully!");
      } else {
        const newId = `${Date.now()}`;
        await setDoc(doc(db, `schools/${state.selectedSchoolId}/assets`, newId), assetData);
        toast.success("Asset added successfully!");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving asset:", error);
      toast.error("Failed to save asset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditAsset = (assetIdToEdit) => {
    setIsEditing(true);
    setCurrentAssetId(assetIdToEdit);
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setCurrentAssetId(null);
    resetForm();
  };

  const handleDeleteAsset = async (assetIdToDelete) => {
    const ok = window.confirm("Are you sure you want to delete this asset? This action cannot be undone.");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, `schools/${state.selectedSchoolId}/assets`, assetIdToDelete));
      toast.success("Asset deleted successfully!");
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    resetForm();
  };

  const handleRowClick = (asset) => {
    setSelectedAsset(asset);
  };

  const handleCloseDetails = () => {
    setSelectedAsset(null);
  };

  const handlePrintAssets = () => {
    window.print();
  };

  if (loading) return <Spinner />;

  const handleReload = () => window.location.reload();

  const short = (text, n = 18) => {
    const s = String(text || "");
    if (!s) return "-";
    if (s.length <= n) return s;
    return `${s.slice(0, n)}...`;
  };

  const money = (v) => {
    const n = typeof v === "number" ? v : Number(String(v || "").replace(/,/g, ""));
    if (Number.isNaN(n)) return "-";
    return `₦${n.toLocaleString()}`;
  };

  // ✅ Responsive "stacked cards" for mobile
  const AssetMobileCard = ({ asset, index }) => {
    return (
      <div
        onClick={() => handleRowClick(asset)}
        className="border rounded-lg p-3 bg-white shadow-sm cursor-pointer hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          {asset.photoURL ? (
            <img
              src={asset.photoURL}
              alt={asset.assetName || asset.name || "Asset"}
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-600">
              No Photo
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm">
                {asset.assetName || asset.name || "-"}
              </p>
              <span className="text-xs text-gray-500">#{index + 1}</span>
            </div>

            <p className="text-xs text-gray-600">
              <span className="font-medium">ID:</span> {asset.assetId || "-"}{" "}
              <span className="ml-2 font-medium">Qty:</span>{" "}
              {typeof asset.quantity === "number" ? asset.quantity : asset.quantity || "-"}
            </p>

            <p className="text-xs text-gray-600">
              <span className="font-medium">Location:</span>{" "}
              {short(asset.location, 24)}
            </p>

            <p className="text-xs text-gray-600">
              <span className="font-medium">Value:</span>{" "}
              {money(asset.currentValue)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditAsset(asset.id);
            }}
            className="bg-yellow-500 text-white px-3 py-1 rounded text-xs"
          >
            Edit
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteAsset(asset.id);
            }}
            className="bg-red-500 text-white px-3 py-1 rounded text-xs"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div>
        {/* ✅ Responsive header */}
        <div className="m-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center justify-between gap-2">
              <button onClick={handleReload} className="p-2 bg-gray-200 rounded">
                Reload
              </button>

              <button
                onClick={() => navigate("/posscreen")}
                className="p-2 bg-gray-200 rounded sm:hidden"
              >
                Back
              </button>
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold">Assets</h1>
              <p className="text-xs text-gray-500">
                Total: {Number((state.assets || []).length).toLocaleString()}
              </p>
            </div>

            <div className="hidden sm:flex justify-end">
              <button
                onClick={() => navigate("/posscreen")}
                className="p-2 bg-gray-200 rounded"
              >
                Back
              </button>
            </div>
          </div>

          {/* ✅ action buttons wrap on small screens */}
          <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-end">
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 text-white px-5 py-2 text-sm font-medium rounded shadow-md hover:bg-blue-700 transition"
            >
              Add Asset
            </button>

            <button
              onClick={handlePrintAssets}
              className="bg-green-600 text-white px-5 py-2 text-sm font-medium rounded shadow-md hover:bg-green-700 transition"
            >
              Print Assets
            </button>
          </div>
        </div>

        {/* Modal for Adding/Editing Asset */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-3">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {isEditing ? "Edit Asset" : "Add Asset"}
                </h2>
                <button onClick={handleCloseModal}>
                  <MdClose size={24} />
                </button>
              </div>

              <form onSubmit={onSubmit}>
                {/* Core */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    id="assetId"
                    placeholder="Asset ID (optional)"
                    value={assetId}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />

                  <input
                    type="text"
                    id="assetName"
                    placeholder="Asset Name (optional)"
                    value={assetName}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />

                  <input
                    type="text"
                    id="category"
                    placeholder="Category (optional)"
                    value={category}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />

                  <select
                    id="condition"
                    value={condition}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  >
                    <option value="">Condition (optional)</option>
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Bad">Bad</option>
                    <option value="Damaged">Damaged</option>
                  </select>

                  <select
                    id="status"
                    value={status}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  >
                    <option value="">Status (optional)</option>
                    <option value="Active">Active</option>
                    <option value="In Use">In Use</option>
                    <option value="In Store">In Store</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Disposed">Disposed</option>
                    <option value="Lost">Lost</option>
                  </select>

                  <input
                    type="text"
                    id="location"
                    placeholder="Location (optional)"
                    value={location}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />

                  <input
                    type="text"
                    id="assignedTo"
                    placeholder="Assigned To (optional)"
                    value={assignedTo}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />

                  <input
                    type="text"
                    id="serialNumber"
                    placeholder="Serial Number (optional)"
                    value={serialNumber}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />

                  <input
                    type="text"
                    id="brand"
                    placeholder="Brand (optional)"
                    value={brand}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />

                  <input
                    type="text"
                    id="model"
                    placeholder="Model (optional)"
                    value={model}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />

                  <input
                    type="number"
                    id="quantity"
                    placeholder="Quantity (optional)"
                    value={quantity}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  />
                </div>

                {/* Purchase / Value */}
                <div className="mt-4 border rounded p-3">
                  <p className="font-semibold mb-3">Purchase / Value (optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      id="purchaseDate"
                      value={purchaseDate}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />

                    <input
                      type="text"
                      id="purchaseVendor"
                      placeholder="Vendor (optional)"
                      value={purchaseVendor}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />

                    <input
                      type="text"
                      id="purchaseCost"
                      placeholder="Purchase Cost (optional)"
                      value={purchaseCost}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />

                    <input
                      type="text"
                      id="currentValue"
                      placeholder="Current Value (optional)"
                      value={currentValue}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>
                </div>

                {/* Maintenance */}
                <div className="mt-4 border rounded p-3">
                  <p className="font-semibold mb-3">Maintenance (optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      id="lastServiceDate"
                      value={lastServiceDate}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                      placeholder="Last Service"
                    />

                    <input
                      type="date"
                      id="nextServiceDate"
                      value={nextServiceDate}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                      placeholder="Next Service"
                    />

                    <input
                      type="date"
                      id="warrantyExpiry"
                      value={warrantyExpiry}
                      onChange={onChange}
                      className="border p-2 w-full rounded"
                      placeholder="Warranty Expiry"
                    />
                  </div>

                  <textarea
                    id="notes"
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={onChange}
                    className="border p-2 w-full rounded mt-3"
                    rows={3}
                  />
                </div>

                {/* Photo */}
                <div className="mt-4">
                  <input type="file" onChange={handlePhotoChange} className="mb-4" />
                </div>

                <button type="submit" className="bg-blue-600 text-white p-2 w-full rounded">
                  {isEditing ? "Update Asset" : "Add Asset"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Row click modal */}
        {selectedAsset && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-3">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl relative max-h-[85vh] overflow-y-auto">
              <button
                onClick={handleCloseDetails}
                className="absolute top-4 right-4 text-gray-600"
              >
                <MdClose size={24} />
              </button>

              <div className="text-center">
                {selectedAsset.photoURL ? (
                  <img
                    src={selectedAsset.photoURL}
                    alt={selectedAsset.assetName || selectedAsset.name || "Asset"}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded mx-auto mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded bg-gray-200 mx-auto mb-3 flex items-center justify-center text-xs text-gray-600">
                    No Photo
                  </div>
                )}

                <h2 className="text-lg sm:text-xl font-bold">
                  {selectedAsset.assetName || selectedAsset.name || "-"}
                </h2>

                <p className="text-gray-700 text-sm">
                  ID: {selectedAsset.assetId || "-"} | Qty:{" "}
                  {typeof selectedAsset.quantity === "number"
                    ? selectedAsset.quantity
                    : selectedAsset.quantity || "-"}
                </p>

                <p className="text-gray-700 text-sm">
                  Status: {selectedAsset.status || "-"} | Condition:{" "}
                  {selectedAsset.condition || "-"}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="border rounded p-3">
                  <p className="font-semibold mb-2">Details</p>
                  <p><strong>Category:</strong> {selectedAsset.category || "-"}</p>
                  <p><strong>Location:</strong> {selectedAsset.location || "-"}</p>
                  <p><strong>Assigned To:</strong> {selectedAsset.assignedTo || "-"}</p>
                  <p><strong>Serial No:</strong> {selectedAsset.serialNumber || "-"}</p>
                  <p><strong>Brand:</strong> {selectedAsset.brand || "-"}</p>
                  <p><strong>Model:</strong> {selectedAsset.model || "-"}</p>
                </div>

                <div className="border rounded p-3">
                  <p className="font-semibold mb-2">Purchase / Value</p>
                  <p><strong>Purchase Date:</strong> {selectedAsset.purchaseDate || "-"}</p>
                  <p><strong>Vendor:</strong> {selectedAsset.purchaseVendor || "-"}</p>
                  <p><strong>Purchase Cost:</strong> {money(selectedAsset.purchaseCost)}</p>
                  <p><strong>Current Value:</strong> {money(selectedAsset.currentValue)}</p>
                </div>

                <div className="border rounded p-3 sm:col-span-2">
                  <p className="font-semibold mb-2">Maintenance</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <p><strong>Last Service:</strong> {selectedAsset.lastServiceDate || "-"}</p>
                    <p><strong>Next Service:</strong> {selectedAsset.nextServiceDate || "-"}</p>
                    <p><strong>Warranty Expiry:</strong> {selectedAsset.warrantyExpiry || "-"}</p>
                  </div>
                  <p className="mt-2"><strong>Notes:</strong> {selectedAsset.notes || "-"}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => handleEditAsset(selectedAsset.id)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDeleteAsset(selectedAsset.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ MOBILE LIST (cards) */}
        <div className="px-4 sm:px-0 mt-4">
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {(state.assets || []).map((a, idx) => (
              <AssetMobileCard key={a.id ?? idx} asset={a} index={idx} />
            ))}
            {(state.assets || []).length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                No assets found.
              </div>
            )}
          </div>

          {/* ✅ DESKTOP/TABLET TABLE */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="table-auto w-full mt-4 border min-w-[1200px]">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-3 py-2">Photo</th>
                  <th className="px-3 py-2">Asset ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Condition</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Assigned To</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Serial</th>
                  <th className="px-3 py-2">Purchase Cost</th>
                  <th className="px-3 py-2">Current Value</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>

              <tbody>
                {(state.assets || []).map((asset, index) => (
                  <tr
                    key={asset.id ?? index}
                    onClick={() => handleRowClick(asset)}
                    className="border cursor-pointer hover:bg-gray-100"
                  >
                    <td className="px-3 py-2">
                      {asset.photoURL ? (
                        <img
                          src={asset.photoURL}
                          alt={asset.assetName || asset.name || "Asset"}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-500">No Photo</span>
                      )}
                    </td>

                    <td className="px-3 py-2">{asset.assetId || "-"}</td>
                    <td className="px-3 py-2" title={asset.assetName || asset.name || ""}>
                      {short(asset.assetName || asset.name, 22)}
                    </td>
                    <td className="px-3 py-2">{asset.category || "-"}</td>
                    <td className="px-3 py-2">{asset.status || "-"}</td>
                    <td className="px-3 py-2">{asset.condition || "-"}</td>
                    <td className="px-3 py-2" title={asset.location || ""}>
                      {short(asset.location, 18)}
                    </td>
                    <td className="px-3 py-2" title={asset.assignedTo || ""}>
                      {short(asset.assignedTo, 18)}
                    </td>

                    <td className="px-3 py-2">
                      {typeof asset.quantity === "number" ? asset.quantity : asset.quantity || "-"}
                    </td>

                    <td className="px-3 py-2" title={asset.serialNumber || ""}>
                      {short(asset.serialNumber, 16)}
                    </td>

                    <td className="px-3 py-2">{money(asset.purchaseCost)}</td>
                    <td className="px-3 py-2">{money(asset.currentValue)}</td>

                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAsset(asset.id);
                          }}
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
                        >
                          Edit
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAsset(asset.id);
                          }}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {(state.assets || []).length === 0 && (
                  <tr>
                    <td className="p-3 text-center text-gray-500" colSpan={13}>
                      No assets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer actions */}
          <div className="flex justify-center p-2 mb-12 space-x-4">
            <button
              onClick={() => navigate("/")}
              className="bg-red-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-red-700 transition"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
