import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';
import { useMyContext } from '../Context/MyContext';

const PrintInventoryPage = () => {
  const { state } = useMyContext();
  const [filteredItems, setFilteredItems] = useState([]);
  const [totalStoreValue, setTotalStoreValue] = useState(0);
  const [firstRestockDates, setFirstRestockDates] = useState({});
  const [allPagesContent, setAllPagesContent] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  


  const calculateTotalStoreValue = useCallback((filteredItems) => {
    const calculatedTotalStoreValue = filteredItems.reduce(
      (total, item) =>
        total +
        item.price * ((state.productTotals.get(item.name) || 0) - (state.productTotalsMap.get(item.name) || 0)),
      0
    );
    setTotalStoreValue(calculatedTotalStoreValue.toFixed(2));
  }, [state.productTotals, state.productTotalsMap]); // Dependency array including the variables used inside the function

  useEffect(() => {
    calculateTotalStoreValue(filteredItems);
  }, [filteredItems, calculateTotalStoreValue]); // Dependency array including the function itself and the 'items' variable



  console.log(setFirstRestockDates,calculateTotalStoreValue)
  useEffect(() => {
    const capturePagesContent = async () => {
      const { itemsToDisplay: initialItemsToDisplay } = location.state;
      setFilteredItems(initialItemsToDisplay);
  
      const calculateTotalStoreValue = (items) => {
        const calculatedTotalStoreValue = items.reduce(
          (total, item) =>
            total +
            item.price * ((state.productTotals.get(item.name) || 0) - (state.productTotalsMap.get(item.name) || 0)),
          0
        );
        setTotalStoreValue(calculatedTotalStoreValue.toFixed(2));
      };
  
      const itemsPerPage = 25;
      const tableContainer = document.querySelector('.table-container');
      const pagesContent = [];
  
      if (tableContainer) {
        const totalItems = initialItemsToDisplay.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
  
        for (let page = 1; page <= totalPages; page++) {
          const startIndex = (page - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const itemsToDisplay = initialItemsToDisplay.slice(startIndex, endIndex);
  
          setFilteredItems(itemsToDisplay);
          calculateTotalStoreValue(itemsToDisplay);
  
          await new Promise((resolve) => setTimeout(resolve, 500));
  
          const canvas = await html2canvas(tableContainer);
          pagesContent.push(canvas.toDataURL('image/png'));
        }
  
        setAllPagesContent(pagesContent);
        setFilteredItems(initialItemsToDisplay);
        calculateTotalStoreValue(initialItemsToDisplay);
      }
    };
  
    capturePagesContent();
  }, [location.state, state.products, state.productTotals, state.productTotalsMap, calculateTotalStoreValue]);
  
  
  const generateSn = (index) => index + 1;

  const handleRowClick = (itemId) => {
    // Define the logic for handling row clicks
  };

  const handlePrint = async () => {
    const pdf = new jsPDF('l', 'pt', 'letter');

    allPagesContent.forEach((pageContent) => {
      pdf.addImage(pageContent, 'PNG', 0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height);
      pdf.addPage();
    });

    pdf.save('inventory.pdf');
  };

  return (
    <div>
      <div className="text-left pl-4">
        <FontAwesomeIcon
          icon={faArrowLeft}
          style={{ cursor: 'pointer', marginRight: '8px', color: 'green' }}
          onClick={() => navigate(-1)}
        />
        Back
      </div>

      <div className="table-container" style={{ maxHeight: '700px' }}>
        <table className="w-full table-auto">
          <thead>
            <tr>
              <th className="border">S/n</th>
              <th className="border">Name</th>
              <th className="border">Date</th>
              <th className="border">Item ID</th>
              <th className="border">Qty Restocked</th>
              <th className="border">Total Bal</th>
              <th className="border">Qty Sold</th>
              <th className="border">Qty Balance</th>
              <th className="border">CostPrice</th>
              <th className="border">Sales Price</th>
              <th className="border">Item Value</th>
              <th className="border">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, index) => (
              <tr key={item.sn} onClick={() => handleRowClick(item.id)} style={{ cursor: 'pointer' }}>
                <td className="border">{generateSn(index)}</td>
                <td className="border">{item.name}</td>
                <td className="border">{firstRestockDates[item.name]?.toLocaleDateString()}</td>
                <td className="border">{item.id.slice(0, 3) + (item.id.length > 3 ? '...' : '')}</td>
                <td className="border">{state.productTotals.get(item.name) || 0}</td>
                <td className="border">{state.productTotals.get(item.name) || 0}</td>
                <td className="border">{state.productTotalsMap.get(item.name) || 0}</td>
                <td className="border">
                  {((state.productTotals.get(item.name) || 0) - (state.productTotalsMap.get(item.name) || 0)).toFixed(2)}
                </td>
                <td className="border">{item.costPrice}</td>
                <td className="border">{item.price}</td>
                <td className="border">
                  {(
                    item.price * ((state.productTotals.get(item.name) || 0) - (state.productTotalsMap.get(item.name) || 0))
                  ).toFixed(2)}
                </td>
                <td className="border">
                  <FontAwesomeIcon icon={faEdit} style={{ cursor: 'pointer', marginRight: '8px', color: 'blue' }} />
                  <FontAwesomeIcon icon={faTrash} style={{ cursor: 'pointer', color: 'red' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with total */}
      <div className="mt-4 text-right pr-4">
        <span className="font-bold">Total:</span>
        {totalStoreValue}
      </div>
      {/* Print button */}
      <div className="mb-4 text-center">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={handlePrint}>
          Print Full Inventory
        </button>
      </div>
    </div>
  );
};

export default PrintInventoryPage;