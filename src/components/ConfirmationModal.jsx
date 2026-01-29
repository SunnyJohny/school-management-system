import React, { useState } from "react";

const ConfirmationModal = ({ message, onConfirm, onCancel, isVisible, onClose }) => {
  const [inputValue, setInputValue] = useState("");

  if (!isVisible) return null;

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue);
      handleClose();
    } else {
      alert("Please enter a valid price");
    }
  };

  const handleClose = () => {
    setInputValue("");
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <p>{message}</p>
        <input
          type="number"
          placeholder="Enter sold price"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full mt-4 p-2 border rounded"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Confirm
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
