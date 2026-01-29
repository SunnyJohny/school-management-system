// PrintableReceipt.js
import React from 'react';
import PrintableCart from './PrintableCart';

const PrintableReceipt = React.forwardRef(({ cart }, ref) => (
  <div ref={ref}>
    <h1>Your Receipt</h1>
    <PrintableCart cart={cart} />
    <p>Total: ${cart.reduce((acc, item) => acc + item.price * item.quantity, 0)}</p>
  </div>
));

export default PrintableReceipt;
