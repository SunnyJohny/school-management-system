import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdClose } from "react-icons/md";
import { getFirestore, collection, addDoc, Timestamp, doc, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useMyContext } from '../Context/MyContext';

const AddProduct = ({ onCloseModal, fromInventoryPage, row }) => {
  const { state } = useMyContext();
  const { selectedCompanyId } = state;

  const navigate = useNavigate();
  const [isNewProduct, setIsNewProduct] = useState(true);
  const [product, setProduct] = useState({
    serialNumber: "",
    name: "",
    supplier: "",
    quantitySupplied: 0,
    costPrice: 0.00,
    costPerItem: 0.00,
    price: 0.00,
    description: "",
    expiryDate: "", // New expiry date field
    existingProduct: "",
    quantityRestocked: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false); // New state for tracking processing
  const [isScanMode, setIsScanMode] = useState(false); // track whether in scan or manual mode

  const [existingProductNames, setExistingProductNames] = useState([]);
  const handleModeChange = (e) => {
    setIsScanMode(e.target.value === 'scan');
  };

  useEffect(() => {
    if (fromInventoryPage && row) {
      setProduct(row);
      setIsNewProduct(false);
    }

    const fetchExistingProductNames = async () => {
      try {
        const productsCollection = collection(getFirestore(), `companies/${selectedCompanyId}/products`);
        const productsSnapshot = await getDocs(productsCollection);
        const names = [];

        productsSnapshot.forEach((doc) => {
          const { name } = doc.data();
          names.push({ id: doc.id, name });
        });

        setExistingProductNames(names);
      } catch (error) {
        console.error("Error fetching existing products:", error.message);
      }
    };

    fetchExistingProductNames();
  }, [fromInventoryPage, row, selectedCompanyId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
      costPerItem: (name === 'costPrice' && prevProduct.quantitySupplied) ? (parseFloat(value) / parseFloat(prevProduct.quantitySupplied)) : prevProduct.costPerItem,
    }));
  };

  const updateExistingProduct = async (productId, updateData) => {
    try {
      const productRef = doc(getFirestore(), `companies/${selectedCompanyId}/products`, productId);
      await updateDoc(productRef, {
        quantityRestocked: arrayUnion({ ...updateData, time: Timestamp.now() }),
      });
      console.log('Existing product updated successfully!');
      toast.success('Existing product updated successfully!');
      setProduct({
        ...product,
        existingProduct: "",
        quantityRestocked: 0,
      });
    } catch (error) {
      console.error('Error updating existing product:', error.message);
      toast.error('Error updating existing product. Please try again.');
      throw error;
    }
  };

  const onAddProduct = async (newProduct) => {
    try {
      const productsCollection = collection(getFirestore(), `companies/${selectedCompanyId}/products`);

      if (isNewProduct) {
        await addDoc(productsCollection, {
          name: newProduct.name,
          supplier: newProduct.supplier,
          quantitySupplied: newProduct.quantitySupplied,
          costPrice: newProduct.costPrice,
          price: newProduct.price,
          description: newProduct.description,
          expiryDate: newProduct.expiryDate, // Store expiry date
          serialNumber: newProduct.serialNumber, // Store expiry date
          quantityRestocked: [{ quantity: Number(newProduct.quantitySupplied), time: Timestamp.now() }],
          dateAdded: Timestamp.now()
        });
        console.log('Product added successfully!');
        setProduct({
          ...product,
          name: "",
          supplier: "",
          quantitySupplied: 0,
          costPrice: 0.00,
          price: 0.00,
          description: "",
          expiryDate: "",
          serialNumber: "",
        });
        // Display a success toast at the top
        toast.success('Product added successfully!', {
          position: toast.POSITION.TOP_CENTER, // Adjust position as needed (e.g., TOP_LEFT, TOP_RIGHT)
        });

      } else {
        const { existingProduct, quantityRestocked } = newProduct;

        if (!existingProduct || quantityRestocked === null || isNaN(quantityRestocked)) {
          console.error('Existing product ID or restocked quantity not provided!');
          toast.error('Existing product ID or restocked quantity not provided. Please try again.');
          return;
        }

        await updateExistingProduct(existingProduct, { quantity: Number(quantityRestocked) });
      }
    } catch (error) {
      console.error('Error adding/updating product:', error.message);
      toast.error('Error adding/updating product. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isProcessing) return; // Prevent further execution if already processing

    setIsProcessing(true); // Set to true to block subsequent submissions

    try {
      if (isNewProduct) {
        if (
          !product.name ||
          !product.supplier ||
          !product.quantitySupplied ||
          !product.costPrice ||
          !product.description ||
          !product.expiryDate ||
          !product.serialNumber
        ) {
          toast.error("Please fill in all required fields.");
          setIsProcessing(false);
          return;
        }
      } else {
        if (!product.existingProduct || product.quantityRestocked === null || isNaN(product.quantityRestocked)) {
          toast.error("Please fill in all required fields with valid values.");
          setIsProcessing(false);
          return;
        }
      }

      await onAddProduct(product);
      toast.success(isNewProduct ? "Product added successfully!" : "Product updated successfully!");
      setProduct({
        ...product,
        name: "",
        supplier: "",
        quantitySupplied: 0,
        costPrice: 0.00,
        price: 0.00,
        description: "",
        expiryDate: "",
        serialNumber: "",
        quantityRestocked: 0,
        existingProduct: "",
      });
    } catch (error) {
      console.error("Error handling form submission:", error.message);
      toast.error("Error handling form submission. Please try again.");
    } finally {
      setIsProcessing(false); // Ensure processing state is reset
    }
  };


  const handleBack = () => {
    navigate("/inventory-page");
  };

  return (
    <div className="fixed inset-0 overflow-y-auto">



      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={handleBack} className="text-blue-500 text-lg cursor-pointer">
                &#8592; Back
              </button>
              <h2 className="text-2xl font-bold mx-auto">Add Product</h2>
              <button onClick={onCloseModal} className="text-gray-500">
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Product Type</label>
                <select
                  name="isNewProduct"
                  value={isNewProduct}
                  onChange={(e) => setIsNewProduct(e.target.value === "true")}
                  className="border rounded-md w-full p-2"
                  required
                >
                  <option value={true}>New Product</option>
                  <option value={false}>Existing Product</option>
                </select>
              </div>
              {!isNewProduct ? (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Select Existing Product</label>
                  <select
                    name="existingProduct"
                    value={product.existingProduct}
                    onChange={handleInputChange}
                    className="border rounded-md w-full p-2"
                    required
                  >
                    <option value="" disabled>Select an existing product</option>
                    {existingProductNames.map(({ id, name }) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Quantity Restocked</label>
                    <input
                      type="number"
                      name="quantityRestocked"
                      value={product.quantityRestocked}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      value={product.name}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div>
                  {/* Mode selection */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Serial Input Mode</label>
                    <div className="flex items-center">
                      <label className="mr-4">
                        <input
                          type="radio"
                          value="manual"
                          checked={!isScanMode}
                          onChange={handleModeChange}
                        />
                        <span className="ml-2">Manual Entry</span>
                      </label>
                      <label>
                        <input
                          type="radio"
                          value="scan"
                          checked={isScanMode}
                          onChange={handleModeChange}
                        />
                        <span className="ml-2">Scan Mode</span>
                      </label>
                    </div>
                  </div>
                  {/* Serial Number Input */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Product Serial No</label>
                    <input
                      type="text"
                      name="serialNumber"
                      value={product.serialNumber}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      placeholder="Enter or scan serial number"
                      autoFocus={!isScanMode} // autofocus only in if its not  scan mode
                      readOnly={isScanMode && product.serialNumber} // optional: make readonly in scan mode after scan
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Supplier Details</label>
                    <input
                      type="text"
                      name="supplier"
                      value={product.supplier}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Quantity Supplied</label>
                    <input
                      type="number"
                      name="quantitySupplied"
                      value={product.quantitySupplied}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div>
                  {/* <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Products Serial No</label>
                    <input
                      type="number"
                      name="quantitySupplied"
                      value={product.quantitySupplied}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div> */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Cost of Goods Supplied</label>
                    <input
                      type="number"
                      name="costPrice"
                      value={product.costPrice}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Cost Of Item</label>
                    <input
                      type="number"
                      name="costPerItem"
                      value={product.costPerItem}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Sales Price</label>
                    <input
                      type="number"
                      name="price"
                      value={product.price}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                    <textarea
                      name="description"
                      value={product.description}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                      rows="4"
                    ></textarea>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={product.expiryDate}
                      onChange={handleInputChange}
                      className="border rounded-md w-full p-2"
                      required
                    />
                  </div>
                </>
              )}
              <button
                type="submit"
                className={`bg-blue-500 text-white px-4 py-2 rounded-md ${isProcessing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                disabled={isProcessing} // Disable button during processing
              >
                {isProcessing ? "Processing..." : isNewProduct ? "Add Product" : "Update Product"}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
