
          import React, { useEffect, useState } from 'react';
          import { useMyContext } from '../Context/MyContext';
          
          const ProductHistory = ({ productId }) => {
            const { state } = useMyContext();
            const [productHistory, setProductHistory] = useState([]);
            const [productName, setProductName] = useState('');
            const [currentPage, setCurrentPage] = useState(1);
            const itemsPerPage = 20;
          
            useEffect(() => {
              const getProductHistory = () => {
                const productRestocks = state.products.find((product) => product.id === productId)?.quantityRestocked || [];
                const productSales = state.products.find((product) => product.id === productId)?.quantitySold || [];
                const productAdjustments = state.products.find((product) => product.id === productId)?.adjustments || [];
                setProductName(state.products.find((product) => product.id === productId)?.name || '');
          
                const salesHistory = productSales.map((sale) => ({
                  date: sale.timestamp.toDate(),
                  eventType: 'Sold',
                  quantity: Number(sale.quantitySold),
                }));
          
                const restocksHistory = productRestocks.map((restock) => ({
                  date: restock.time.toDate(),
                  eventType: 'Restocked',
                  quantity: Number(restock.quantity),
                  receiptNumber: restock.receiptNumber || 'N/A',
                }));
          
                const adjustmentsHistory = productAdjustments.map((adjustment) => ({
                  date: adjustment.date.toDate(), // Convert adjustment date to Date object
                  eventType: 'Adjustment',
                  fieldAdjusted: adjustment.field,
                  oldValue: adjustment.oldValue,
                  newValue: adjustment.newValue,
                  reason: adjustment.reason,
                }));
          
                const history = [...salesHistory, ...restocksHistory, ...adjustmentsHistory];
          
                history.sort((a, b) => a.date - b.date);
          
                setProductHistory(history);
              };
          
              getProductHistory();
            }, [productId, state.products]);
          
            const totalRestocked = productHistory.reduce((sum, event) => (event.eventType === 'Restocked' ? sum + event.quantity : sum), 0);
            const totalSold = productHistory.reduce((sum, event) => (event.eventType === 'Sold' ? sum + event.quantity : sum), 0);
            const totalBalance = totalRestocked - totalSold;
          
            const totalPages = Math.ceil(productHistory.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const itemsToDisplay = productHistory.slice(startIndex, endIndex);
          
            const handlePrevClick = () => {
              setCurrentPage((prev) => Math.max(prev - 1, 1));
            };
          
            const handleNextClick = () => {
              setCurrentPage((prev) => Math.min(prev + 1, totalPages));
            };
          
            const handlePrintClick = () => {
              // Print logic remains unchanged
            };
          
            const handleShareExportClick = () => {
              // Export logic remains unchanged
            };
          
            return (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
                <h2 style={{ fontSize: '1.5rem' }}>Product History for <strong>{productName}</strong></h2>
                <div style={{ width: '80%', maxWidth: '1200px', flex: '1', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                  <thead className="sticky top-0 bg-white z-10">
                      <tr>
                        <th>S/n</th>
                        <th>Date</th>
                        <th>Event Type</th>
                        <th>Restocked</th>
                        <th>Quantity Sold</th>
                        <th>Stock Balance</th>
                        <th>Receipt Number</th>
                        <th>Field Adjusted</th>
                        <th>Old Value</th>
                        <th>New Value</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsToDisplay.map((event, index) => {
                        const isSold = event.eventType === 'Sold';
                        const isRestocked = event.eventType === 'Restocked';
                        const isAdjustment = event.eventType === 'Adjustment';
          
                        // Calculate stock balance differently for adjustments
                        const stockBalance = isAdjustment
                          ? '-' // Adjustments don't affect stock balance
                          : isRestocked
                          ? event.quantity - (productHistory[index - 1]?.quantitySold || 0)
                          : isSold
                          ? -(event.quantity) // Quantity Sold is negative for balance calculation
                          : 'N/A';
          
                        return (
                          <tr key={index}>
                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.date.toLocaleString()}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventType}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{isRestocked ? event.quantity : ''}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{isSold ? event.quantity : ''}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{stockBalance}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{event.receiptNumber}</td>
                            {/* Render adjustment-specific columns */}
                            {isAdjustment && (
                              <>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.fieldAdjusted}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.oldValue}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.newValue}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.reason}</td>
                              </>
                            )}
                            {/* Render empty cells for non-adjustment events */}
                            {!isAdjustment && (
                              <>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" style={{ fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>Total</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{totalRestocked}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{totalSold}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{totalBalance}</td>
                        <td colSpan="4"></td> {/* Adjust colspan for the added columns */}
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
                  <div
                    style={{
                      padding: '10px',
                      fontSize: '1rem',
                      backgroundColor: '#e0e0e0',
                      border: '1px solid #ccc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onClick={handlePrevClick}
                    disabled={currentPage === 1}
                  >
                    &#8592; Previous
                  </div>
                  <div
                    style={{
                      padding: '10px',
                      fontSize: '1rem',
                      backgroundColor: '#e0e0e0',
                      border: '1px solid #ccc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onClick={handleShareExportClick}
                  >
                    Share/Export
                  </div>
                  <div
                    style={{
                      padding: '10px',
                      fontSize: '1rem',
                      backgroundColor: '#e0e0e0',
                      border: '1px solid #ccc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onClick={handlePrintClick}
                  >
                    Print History
                  </div>
                  <div
                    style={{
                      padding: '10px',
                      fontSize: '1rem',
                      backgroundColor: '#e0e0e0',
                      border: '1px solid #ccc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onClick={handleNextClick}
                    disabled={currentPage === totalPages}
                  >
                    Next &#8594;
                  </div>
                </div>
              </div>
            );
          };
          
          export default ProductHistory;
       