import React, { useState } from 'react';
import { updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useMyContext } from '../Context/MyContext';
import { toast } from 'react-toastify';

const EditPopup = ({ product, onUpdate, onClose }) => {
  const { state } = useMyContext();
  const { selectedCompanyId } = state;

  const [editedProduct, setEditedProduct] = useState(product);
  const [quantityRestock, setQuantityRestock] = useState(() => {
    const lastRestockQuantity = product.quantityRestocked.length > 0
      ? product.quantityRestocked[product.quantityRestocked.length - 1].quantity
      : 0;
    return lastRestockQuantity;
  });
  const [adjustmentDate, setAdjustmentDate] = useState(Timestamp.now().toDate().toISOString().split('T')[0]);
  
  const [adjustmentFields, setAdjustmentFields] = useState({
    reason: '',
    adjustmentDate: '',
    fieldAdjusted: '',
    oldValue: '',
    newValue: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setAdjustmentFields({
      ...adjustmentFields,
      fieldAdjusted: name,
      newValue: value
    });

    setEditedProduct({ ...editedProduct, [name]: value });
  };

  const handleRestockChange = (e) => {
    const { value } = e.target;

    setAdjustmentFields({
      ...adjustmentFields,
      fieldAdjusted: 'quantityRestocked',
      newValue: value
    });

    setQuantityRestock(value);
  };

  const handleAdjustmentDateChange = (e) => {
    const { value } = e.target;
    setAdjustmentDate(value);
  };

  const handleAdjustmentChange = (e) => {
    const { name, value } = e.target;
    setAdjustmentFields({ ...adjustmentFields, [name]: value });
  };

  const handleUpdate = async () => {
    try {
      // Update the quantityRestocked with the latest quantity
      const lastRestockIndex = editedProduct.quantityRestocked.length - 1;
      editedProduct.quantityRestocked[lastRestockIndex].quantity = quantityRestock;

      // Initialize adjustments array if it's undefined
      if (!editedProduct.adjustments) {
        editedProduct.adjustments = [];
      }

      // Create a new adjustment record
      const adjustment = {
        date: Timestamp.fromDate(new Date(adjustmentDate)),
        reason: adjustmentFields.reason,
        field: adjustmentFields.fieldAdjusted,
        oldValue: adjustmentFields.oldValue,
        newValue: adjustmentFields.newValue
      };
      editedProduct.adjustments.push(adjustment);

      // Create a reference to the Firestore document using selectedCompanyId
      const productRef = doc(db, `companies/${selectedCompanyId}/products/${editedProduct.id}`);

      // Update the product document
      await updateDoc(productRef, editedProduct);

      // Notify parent component about the update
      onUpdate(editedProduct);

      // Show a success toast notification
      toast.success('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error updating product. Please try again.');
    }
  };

  const adjustmentReasons = [
    'Inventory Adjustment',
    'Damaged Items',
    'Expired Items',
    'Quantity Restock/Supply Error',
    'Other',
  ];

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start justify-between">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit Product</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="mt-2">
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name:</label>
                <input type="text" id="name" name="name" value={editedProduct.name} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="mb-4">
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">Supplier:</label>
                <input type="text" id="supplier" name="supplier" value={editedProduct.supplier} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="mb-4">
                <label htmlFor="quantitySupplied" className="block text-sm font-medium text-gray-700">Quantity Supplied:</label>
                <input type="text" id="quantitySupplied" name="quantitySupplied" value={editedProduct.quantitySupplied} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="mb-4">
                <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700">Cost Price:</label>
                <input type="text" id="costPrice" name="costPrice" value={editedProduct.costPrice} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="mb-4">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Sales Price:</label>
                <input type="text" id="price" name="price" value={editedProduct.price} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="mb-4">
                <label htmlFor="quantityRestock" className="block text-sm font-medium text-gray-700">Quantity Restock:</label>
                <input
                  type="text"
                  id="quantityRestock"
                  name="quantityRestock"
                  value={quantityRestock}
                  onChange={handleRestockChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Adjustment:</label>
                <select id="reason" name="reason" value={adjustmentFields.reason} onChange={handleAdjustmentChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  {adjustmentReasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="adjustmentDate" className="block text-sm font-medium text-gray-700">Adjustment Date:</label>
                <input
                  type="date"
                  id="adjustmentDate"
                  name="adjustmentDate"
                  value={adjustmentDate}
                  onChange={handleAdjustmentDateChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="fieldAdjusted" className="block text-sm font-medium text-gray-700">Field Adjusted:</label>
                <input type="text" id="fieldAdjusted" name="fieldAdjusted" value={adjustmentFields.fieldAdjusted} onChange={handleAdjustmentChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="mb-4">
                <label htmlFor="oldValue" className="block text-sm font-medium text-gray-700">Old Value:</label>
                <input type="text" id="oldValue" name="oldValue" value={adjustmentFields.oldValue} onChange={handleAdjustmentChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="mb-4">
                <label htmlFor="newValue" className="block text-sm font-medium text-gray-700">New Value:</label>
                <input type="text" id="newValue" name="newValue" value={adjustmentFields.newValue} onChange={handleAdjustmentChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUpdate}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Product
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPopup;
