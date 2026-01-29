// PrintComponent.js
import React from 'react';
import { useReactToPrint } from 'react-to-print';
import PrintableReceipt from './PrintableReceipt';

const PrintComponent = ({ cart }) => {
  const componentRef = React.useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <>
      <button onClick={handlePrint}>Print Receipt</button>
      <PrintableReceipt ref={componentRef} cart={cart} />
    </>
  );
};

export default PrintComponent;
