// ProductDetails.js
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductHistory from './ProductHistory'; // Import

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  // Back button handler
  const handleBackClick = () => {
    navigate("/inventory-page");
  };

  return (
    <div className="p-4"> {/* Added padding for the whole container */}
      <button 
        className="bg-blue-500 text-white py-2 px-4 rounded mb-4" 
        onClick={handleBackClick}
      >
        Back to Inventory
      </button>
      
      <h2 className="pl-4">Product Details</h2> {/* Added padding left */}
      <p className="pl-4">Product ID: {productId}</p> {/* Added padding left */}

      {/* Add a link to the product history */}
      <Link to={`/product-history/${productId}`} className="text-blue-500 pl-4">
        View Product History
      </Link>

      {/* Include the ProductHistory component as a route */}
      <ProductHistory productId={productId} />
    </div>
  );
};

export default ProductDetails;
