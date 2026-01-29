import React, { useState, useEffect, useRef } from 'react';


const PrintSalesPage = ({ salesData, searchByKeyword, searchByDate }) => {
  // const [currentPage, setCurrentPage] = useState(1);
  // const [itemsPerPage] = useState(10);
  // const [fromDate, setFromDate] = useState(null);
  // const [toDate, setToDate] = useState(null);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const tableRef = useRef(null);
if (setSearchKeyword) {
  console.log("")
}
 

  useEffect(() => {
    const filteredByKeyword = searchByKeyword(salesData, searchKeyword);
    setFilteredSales(filteredByKeyword);
  }, [salesData, searchByKeyword, searchKeyword]);

  const generateSn = (index) => index + 1;

  return (
    <div className="ml-8 flex-1">
      <div className="mb-8">
        <div className="table-container overflow-x-auto overflow-y-auto" style={{ maxHeight: '100px' }} ref={tableRef}>
          <table className="w-full table-auto" id="sales-table">
            <thead>
              <tr>
                <th className="border">S/n</th>
                <th className="border">Prod. Names</th>
                <th className="border">Trans. Date</th>
                {/* Add other table headings here */}
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale, index) => (
                <tr key={index}>
                  <td className="border">{generateSn(index)}</td>
                  <td className="border">
                    {sale.products.map((product, productIndex) => (
                      <span key={productIndex}>
                        {productIndex < 2 ? (
                          <span>{product.name}</span>
                        ) : (
                          productIndex === 2 && sale.products.length > 2 ? (
                            <span>...</span>
                          ) : null
                        )}
                        {productIndex < sale.products.length - 1 ? <span>, </span> : null}
                      </span>
                    ))}
                  </td>
                  <td className="border">{sale.date}</td>
                  {/* Add other table data cells here */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintSalesPage;
