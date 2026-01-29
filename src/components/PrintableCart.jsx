// PrintableCart.js
import React from 'react';
import Cart from './Cart';


const PrintableCart = ({ cart }) => (
  <div>
    {/* Header row */}
    <div className="flex justify-between">
      <span className="font-bold">Name</span>
      <span className="font-bold">Amount</span>
      <span className="font-bold">Qty</span>
      <span className="font-bold">Total</span>
    </div>
    <hr className="mb-4" />
    <hr className="my-4 border-t-2 border-white" />

    {cart.map((item) => (
      <Cart
        key={item.id}
        id={item.id}
        name={item.name}
        price={item.price}
        quantity={item.quantity}
      />
    ))}
  </div>
);

export default PrintableCart;
