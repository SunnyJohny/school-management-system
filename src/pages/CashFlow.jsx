

import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendar } from 'react-icons/fa';
import { useMyContext } from '../Context/MyContext';
import ReceiptModal from '../components/ReceiptModal';


const CashFlow = () => {
  const { state,  searchByDate,  calculateTotalSalesValue } = useMyContext();
  // const [currentPage, setCurrentPage] = useState(1);
  // const [itemsPerPage] = useState(100);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [totalTaxPaid, setTotalTaxPaid] = useState(0);
  const [totalSalesValue, setTotalSalesValue] = useState(0); // Added state for total sales
  const tableRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [filteredSales, setFilteredSales] = useState([]);
  const [totalInterestReceived, setTotalInterestReceived] = useState(0);
  const [totalDividendReceived, setTotalDividendReceived] = useState(0);
  const [totalReceivedLiabilities, setTotalReceivedLiabilities] = useState(0);
  const [totalAmountPaid, setTotalAmountPaid] = useState(0);
  const [totalInterestPaid, setTotalInterestPaid] = useState(0);
  const [totalDividendsPaid, setTotalDividendsPaid] = useState(0);
  const [totalShareIssuanceProceeds, setTotalShareIssuanceProceeds] = useState(0);





  const [totalLiabilities, setTotalLiabilities] = useState(0);

  const [selectedDateOption, setSelectedDateOption] = useState('All');
  // const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);

  const [totalAssetSold, setTotalAssetSold] = useState(0);
  const [totalAssetPurchased, setTotalAssetPurchased] = useState(0);


  

  const [filteredAssets, setFilteredAssets] = useState([]);

  // Other states...
if (totalLiabilities){}
if (filteredAssets){}
  useEffect(() => {
    const filteredByDate = searchByDate(state.assets, fromDate, toDate);
    setFilteredAssets(filteredByDate);
  }, [state.assets, fromDate, toDate, searchByDate]);




  useEffect(() => {
    // Filter the liabilities data by date range using searchByDate function
    const filteredByDate = searchByDate(state.liabilities, fromDate, toDate);

    // Calculate the total amount for liabilities where loanType is "Received"
    const totalReceived = filteredByDate.reduce((total, liability) => {
      return liability.loanType === "Received"
        ? total + parseFloat(liability.amount || 0)
        : total;
    }, 0);

    // Calculate the total of amountPaid for records with loanType "Received",
    // and filter the payments by date range
    const totalPaidAmount = filteredByDate.reduce((total, liability) => {
      if (liability.loanType === "Received" && Array.isArray(liability.amountPaid)) {
        const filteredPayments = liability.amountPaid.filter(payment => {
          const paymentDate = new Date(payment.date);
          return (
            (!fromDate || paymentDate >= new Date(fromDate)) &&
            (!toDate || paymentDate <= new Date(toDate))
          );
        });

        const sumPaid = filteredPayments.reduce((sum, payment) => {
          return sum + parseFloat(payment.amount || 0);
        }, 0);

        return total + sumPaid;
      }
      return total;
    }, 0);

    // Calculate the total interest paid for records with loanType "Received",
    // and filter the interest payments by date range
    const totalPaidInterest = filteredByDate.reduce((total, liability) => {
      if (liability.loanType === "Received" && Array.isArray(liability.interestPaid)) {
        const filteredInterestPayments = liability.interestPaid.filter(interest => {
          const interestDate = new Date(interest.date);
          return (
            (!fromDate || interestDate >= new Date(fromDate)) &&
            (!toDate || interestDate <= new Date(toDate))
          );
        });

        const sumInterestPaid = filteredInterestPayments.reduce((sum, interest) => {
          return sum + parseFloat(interest.amount || 0);
        }, 0);

        return total + sumInterestPaid;
      }
      return total;
    }, 0);

    // Filter the shares data by date range using searchByDate function
    const filteredSharesByDate = searchByDate(state.shares, fromDate, toDate);

    // Calculate the total dividends paid for records where amountPaid exists,
    // and filter the dividends payments by date range
    const totalDividendsPaid = filteredSharesByDate.reduce((total, share) => {
      if (Array.isArray(share.amountPaid)) {
        const filteredDividendsPayments = share.amountPaid.filter(dividend => {
          const dividendDate = new Date(dividend.date);
          return (
            (!fromDate || dividendDate >= new Date(fromDate)) &&
            (!toDate || dividendDate <= new Date(toDate))
          );
        });

        const sumDividendsPaid = filteredDividendsPayments.reduce((sum, amountPaid) => {
          return sum + parseFloat(amountPaid.amount || 0);
        }, 0);

        return total + sumDividendsPaid;
      }
      return total;
    }, 0);
    // Update the state with the total received liabilities, total amount paid, and total interest paid
    setTotalReceivedLiabilities(totalReceived);
    setTotalAmountPaid(totalPaidAmount);
    setTotalInterestPaid(totalPaidInterest);
    setTotalDividendsPaid(totalDividendsPaid);
  }, [state.liabilities,state.shares, fromDate, toDate, searchByDate]);

  useEffect(() => {
    // Filter the tax data by date
    const filteredByDate = searchByDate(state.taxes, fromDate, toDate);

    // Calculate the total tax using the filtered data
    const totalTax = filteredByDate.reduce((total, tax) => {
      return total + parseFloat(tax.paidAmount || 0);
    }, 0);

    // Update the state with the filtered tax amount
    setTotalTaxPaid(totalTax);
  }, [state.taxes, fromDate, toDate, searchByDate]);



  useEffect(() => {
    console.log("From Date:", fromDate);   // Log fromDate value
    console.log("To Date:", toDate);       // Log toDate value
  
    // Filter the shares data by date range using searchByDate function
    const filteredSharesByDate = searchByDate(state.shares, fromDate, toDate);
    console.log("Filtered Shares By Date:", filteredSharesByDate);   // Log the filtered shares
  
    // Calculate the total proceeds from share issuance for filtered shares within the date range
    const totalShareIssuanceProceeds = filteredSharesByDate.reduce((total, share) => {
      if (Array.isArray(share.shareIssuanceProceeds)) {
        // Filter the issuance proceeds by date range
        const filteredIssuanceProceeds = share.shareIssuanceProceeds.filter(proceed => {
          const proceedDate = new Date(proceed.date);
          console.log("Proceed Date:", proceed.date, "Parsed Date:", proceedDate);
          return (
            (!fromDate || proceedDate >= new Date(fromDate)) &&
            (!toDate || proceedDate <= new Date(toDate))
          );
        });
  
        console.log("Filtered Issuance Proceeds:", filteredIssuanceProceeds);   // Log the filtered proceeds
  
        // Calculate the total amount from the filtered proceeds
        const sumIssuanceProceeds = filteredIssuanceProceeds.reduce((sum, proceed) => {
          return sum + parseFloat(proceed.amount || 0);
        }, 0);
  
        return total + sumIssuanceProceeds;
      }
      return total;
    }, 0);
  
    console.log("Total Share Issuance Proceeds:", totalShareIssuanceProceeds);   // Log the final total
  
    // Update the state with the calculated total
    setTotalShareIssuanceProceeds(totalShareIssuanceProceeds);
  }, [state.shares, fromDate, toDate, searchByDate]);
  


  const searchBySoldDate = (items, startDate, endDate) => {
    // Check if startDate or endDate are missing, return all items if either is missing
    if (!startDate || !endDate) {
      return items;
    }

    // Convert startDate and endDate to Date objects if they are not already
    const start = new Date(startDate);
    const end = new Date(endDate);

    return items.filter((item) => {
      // Check if the item has a soldDate field
      const soldDate = item.soldDate ? new Date(item.soldDate) : null;

      // Include only items with a valid soldDate that falls within the range
      return soldDate && soldDate >= start && soldDate <= end;
    });
  };

  // useEffect for handling Liabilities
  useEffect(() => {
    const searchByDate = (items, startDate, endDate) => {
      if (!startDate || !endDate) {
        return items;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      return items.filter((item) => {
        // Check if the item has a liabilityDate field and filter by date range
        const liabilityDate = item.date ? new Date(item.date) : null;
        return liabilityDate && liabilityDate >= start && liabilityDate <= end;
      });
    };

    // Filter the liabilities data by the date range
    const filteredLiabilities = searchByDate(state.liabilities, fromDate, toDate);
    console.log("Filtered liabilities by date:", filteredLiabilities);

    // Calculate the total liabilities using the filtered data
    const totalLiabilities = filteredLiabilities.reduce((total, liability) => {
      return total + parseFloat(liability.amount || 0);
    }, 0);

    console.log("Total liabilities:", totalLiabilities);
    // Update the state with the total liabilities amount
    setTotalLiabilities(totalLiabilities); // Assuming you have a state for this
  }, [state.liabilities, fromDate, toDate]);


  useEffect(() => {
    // Filter the assets data by date
    const filteredByDate = searchBySoldDate(state.assets, fromDate, toDate);
    console.log("Filtered assets by date:", filteredByDate);

    // Calculate the total sold assets using the filtered data
    const totalAsset = filteredByDate.reduce((total, asset) => {
      console.log("Processing asset:", asset); // Debug: Check each asset
      return total + parseFloat(asset.soldPrice || 0);
    }, 0);

    console.log("Total asset sold:", totalAsset); // Debug: Check the total calculated
    // Update the state with the total sold asset amount
    setTotalAssetSold(totalAsset);
  }, [state.assets, fromDate, toDate, searchByDate]);


  useEffect(() => {
    // Define the searchByPurchaseDate function inside useEffect
    const searchByPurchaseDate = (items, startDate, endDate) => {
      // Check if startDate or endDate are missing, return all items if either is missing
      if (!startDate || !endDate) {
        return items;
      }

      // Convert startDate and endDate to Date objects if they are not already
      const start = new Date(startDate);
      const end = new Date(endDate);

      return items.filter((item) => {
        // Check if the item has a purchaseDate field
        const purchaseDate = item.purchaseDate ? new Date(item.purchaseDate) : null;

        // Include only items with a valid purchaseDate that falls within the range
        return purchaseDate && purchaseDate >= start && purchaseDate <= end;
      });
    };

    // Filter the assets data by the purchase date
    const filteredByPurchaseDate = searchByPurchaseDate(state.assets, fromDate, toDate);
    console.log("Filtered assets by purchase date:", filteredByPurchaseDate);

    // Calculate the total purchased assets using the filtered data
    const totalPurchasedAsset = filteredByPurchaseDate.reduce((total, asset) => {
      console.log("Processing asset:", asset); // Debug: Check each asset
      return total + parseFloat(asset.purchasePrice || 0); // Assuming purchasePrice exists in your data
    }, 0);

    console.log("Total asset purchased:", totalPurchasedAsset); // Debug: Check the total calculated
    // Update the state with the total purchased asset amount
    setTotalAssetPurchased(totalPurchasedAsset); // Assuming you have a state for this
  }, [state.assets, fromDate, toDate]);




  // useEffect for handling Interest Received
  useEffect(() => {
    const searchByDate = (items, startDate, endDate) => {
      if (!startDate || !endDate) {
        return items;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      return items.filter((item) => {
        // Check if the item has an interestReceived array and filter by date range
        return (
          Array.isArray(item.interestReceived) &&
          item.interestReceived.some((interest) => {
            const interestDate = interest.date ? new Date(interest.date) : null;
            return interestDate && interestDate >= start && interestDate <= end;
          })
        );
      });
    };

    // Filter the assets data by the date range for interest received
    const filteredByInterestDate = searchByDate(state.assets, fromDate, toDate);
    console.log("Filtered assets by interest date:", filteredByInterestDate);

    // Calculate the total interest received using the filtered data
    const totalInterestReceived = filteredByInterestDate.reduce((total, asset) => {
      // Ensure interestReceived is an array before attempting to reduce
      const interestSum = Array.isArray(asset.interestReceived)
        ? asset.interestReceived.reduce((acc, interest) => {
          return acc + parseFloat(interest.amount || 0);
        }, 0)
        : 0;
      return total + interestSum;
    }, 0);

    console.log("Total interest received:", totalInterestReceived);
    // Update the state with the total interest received amount
    setTotalInterestReceived(totalInterestReceived);
  }, [state.assets, fromDate, toDate]);

  // useEffect for handling Dividends Received
  useEffect(() => {
    const searchByDate = (items, startDate, endDate) => {
      if (!startDate || !endDate) {
        return items;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      return items.filter((item) => {
        // Check if the item has a dividendsReceived array and filter by date range
        return (
          Array.isArray(item.dividendReceived) &&
          item.dividendReceived.some((dividend) => {
            const dividendDate = dividend.date ? new Date(dividend.date) : null;
            return dividendDate && dividendDate >= start && dividendDate <= end;
          })
        );
      });
    };

    // Filter the assets data by the date range for dividends received
    const filteredByDividendDate = searchByDate(state.assets, fromDate, toDate);
    console.log("Filtered assets by dividend date:", filteredByDividendDate);

    // Calculate the total dividends received using the filtered data
    const totalDividendReceived = filteredByDividendDate.reduce((total, asset) => {
      // Ensure dividendReceived is an array before attempting to reduce
      const dividendSum = Array.isArray(asset.dividendReceived)
        ? asset.dividendReceived.reduce((acc, dividend) => {
          return acc + parseFloat(dividend.amount || 0);
        }, 0)
        : 0;
      return total + dividendSum;
    }, 0);

    console.log("Total dividend received:", totalDividendReceived);
    // Update the state with the total dividends received amount
    setTotalDividendReceived(totalDividendReceived);
  }, [state.assets, fromDate, toDate]);



  useEffect(() => {
    setTotalSalesValue(calculateTotalSalesValue(filteredSales));
  }, [filteredSales, calculateTotalSalesValue]);

  useEffect(() => {
    const filteredByDate = searchByDate(state.sales, fromDate, toDate);
    setFilteredSales(filteredByDate);
  }, [state.sales, searchByDate, fromDate, toDate]);

  useEffect(() => {
    calculateTotalSalesValue(filteredSales);
  }, [filteredSales, calculateTotalSalesValue]);


  useEffect(() => {
    setTotalSalesValue(calculateTotalSalesValue(filteredSales));
  }, [filteredSales,calculateTotalSalesValue]);

  useEffect(() => {
    let filteredByDate;
    if (fromDate && toDate) {
      filteredByDate = searchByDate(state.expenses, fromDate, toDate);
    } else {
      // If no date is selected, include all expenses
      filteredByDate = state.expenses;
    }

    const totalAmount = filteredByDate.reduce((accumulator, expense) => {
      return accumulator + parseFloat(expense.amount);
    }, 0);

    setTotalExpenseAmount(totalAmount);
  }, [state.expenses, searchByDate, fromDate, toDate]);


  useEffect(() => {
    const filteredByDate = searchByDate(state.sales, fromDate, toDate);
    setFilteredSales(filteredByDate);
  }, [state.sales, searchByDate, fromDate, toDate]);



  useEffect(() => {
    const filteredByDate = searchByDate(state.sales, fromDate, toDate);
    setFilteredSales(filteredByDate);
  }, [state.sales, searchByDate, fromDate, toDate]);


  useEffect(() => {
    calculateTotalSalesValue(filteredSales);
  }, [filteredSales, calculateTotalSalesValue]);


  const handleFromDateChange = (date) => {
    setFromDate(date);
    const filteredByDate = searchByDate(state.sales, date, fromDate);
    console.log('Filtered by date:', filteredByDate);
    setFilteredSales(filteredByDate);
    calculateTotalSalesValue(filteredByDate);
  };

  const handleToDateChange = (date) => {
    setToDate(date);
    const filteredByDate = searchByDate(state.sales, toDate, date);
    console.log('Filtered by date:', filteredByDate);
    setFilteredSales(filteredByDate);
    calculateTotalSalesValue(filteredByDate);
  };



  const saveAndPrintTable = () => {
    const table = document.getElementById('sales-table');
    const printWindow = window.open('', '_blank');

    printWindow.document.write('<html><head><title>Sales Table</title>');
    printWindow.document.write('<style>');
    // Copy the styles from your main CSS
    printWindow.document.write(`
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        .text-center {
            text-align: center;
        }
        .mb-4 {
            margin-bottom: 1rem;
        }
        .table-print {
            border-collapse: collapse;
            width: 100%;
        }
        .table-print th, .table-print td {
            border: 2px solid black;
            padding: 8px;
        }
        .text-lg {
            font-size: 1.125rem;
            line-height: 1.75rem;
        }
        .font-bold {
            font-weight: 700;
        }
        .font-semibold {
            font-weight: 600;
        }
        .underline {
            text-decoration: underline;
        }
        .bg-gray-50 {
            background-color: #f9fafb;
        }
        .bg-white {
            background-color: #ffffff;
        }
        .border-gray-200 {
            border-color: #e5e7eb;
        }
        .shadow {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
        }
        .rounded-md {
            border-radius: 0.375rem;
        }
        .px-4 {
            padding-left: 1rem;
            padding-right: 1rem;
        }
        .py-5 {
            padding-top: 1.25rem;
            padding-bottom: 1.25rem;
        }
        .sm\\:grid {
            display: grid;
        }
        .sm\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .sm\\:gap-4 {
            grid-gap: 1rem;
        }
        .sm\\:col-span-2 {
            grid-column: span 2 / span 2;
        }
    `);
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(table.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };


  // Calculate total sales value on mount and when sales change
  useEffect(() => {
    calculateTotalSalesValue();
  }, [filteredSales, calculateTotalSalesValue]);

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSale(null);
  };

  const handleDateOptionChange = (e) => {
    const selectedOption = e.target.value;
    setSelectedDateOption(selectedOption);

    let startDate = new Date();
    let endDate = new Date();

    switch (selectedOption) {
      case 'All':
        setFromDate(null);
        setToDate(null);
        return;
      case 'Today':
        // Set both fromDate and toDate to the current day
        startDate.setHours(0, 0, 0, 0); // Start of the day
        endDate.setHours(23, 59, 59, 999); // End of the day
        break;
      case 'This Week':
        // Set the start date to the beginning of the current week (Sunday) and end date to today
        const today = startDate.getDay(); // Get current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        startDate.setDate(startDate.getDate() - today); // Set start date to Sunday of the current week
        endDate = new Date(); // End date is today
        endDate.setHours(23, 59, 59, 999); // End of the day
        break;
      case 'This Week to Date':
        const startOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - startOfWeek); // Start date is Sunday of the current week
        // End date is today
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999); // End of the day
        break;
      case 'This Month':
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        break;
      case 'This Month - Date':
        // Set start date to the 1st of the month
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

        // Set end date to today's date
        endDate = new Date();

        // Set end date to end of the day
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'Last Month to Date':
        // Set start date to the first day of the previous month and end date to today
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
        endDate = new Date(); // End date is today
        endDate.setHours(23, 59, 59, 999); // End of the day
        break;
      case 'This Fiscal Quarter':
        const quarterStartMonth = Math.floor((startDate.getMonth() / 3)) * 3; // Get the start month of the current quarter
        startDate = new Date(startDate.getFullYear(), quarterStartMonth, 1); // Start of quarter
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0); // End of quarter
        break;
      case 'This Fiscal Year':
        startDate = new Date(startDate.getFullYear(), 0, 1); // Start of fiscal year (January 1st)
        endDate = new Date(startDate.getFullYear() + 1, 0, 0); // End of fiscal year (December 31st)
        break;
      case 'Yesterday':
        startDate.setDate(startDate.getDate() - 1); // Subtract one day
        endDate = new Date(startDate);
        break;
      case 'Last Week':
        startDate.setDate(startDate.getDate() - 7); // Subtract seven days
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6); // Set end date to one day before the current date
        break;
      case 'Last Month':
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1); // Set to previous month
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Set to last day of previous month
        break;
      // Add more cases as needed
      default:
        break;
    }


    setFromDate(new Date(startDate)); // Use new Date object to avoid reference issues
    setToDate(new Date(endDate));
  };
  // Calculate total sales for each salesperson


  // Function to format date as MM-DD-YYYY
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Function to get the current date
  const getCurrentDate = () => {
    return formatDate(new Date());
  };

  // Function to render the selected date period
  const renderSelectedDatePeriod = () => {
    if (fromDate && toDate) {
      return `${formatDate(fromDate)} to ${formatDate(toDate)}`;
    } else {
      return 'All'; // When no date range is selected
    }
  };


  const cashFlowData = {
    revenue: totalSalesValue,
    // Cash generated from operations
    Cashgeneratedfromoperations: (totalSalesValue - totalExpenseAmount).toFixed(2),
    operatingExpenses: totalExpenseAmount.toFixed(2),
    taxes: totalTaxPaid.toFixed(2), // Use totalTaxPaid state here
    netIncome: (totalSalesValue - totalTaxPaid - totalExpenseAmount).toFixed(2) // Use totalTaxPaid state here
  };

  const netCashFromFinancingActivities =
    totalShareIssuanceProceeds +
    totalReceivedLiabilities -
    totalAmountPaid -
    totalInterestPaid -
    totalDividendsPaid;

  return (
    <div className="container mx-auto flex h-screen">
      <div className="ml-8 flex-1">
        {showModal && selectedSale && (
          <ReceiptModal saleInfo={selectedSale} onClose={handleCloseModal} />
        )}
        <div className="mb-8">
          <h2 className="text-2xl text-center font-bold mb-4">Cash Flow Statement</h2>
          <div className="flex items-center space-x-4">
            <div>
              {/* Dates label and dropdown */}
              <label
                htmlFor="dateOption"
                className="text-lg"
                style={{ marginRight: '16px' }} // Add margin-right of 16px (adjust as needed)
              >
                Dates
              </label>
              <select
                id="dateOption"
                value={selectedDateOption}
                onChange={handleDateOptionChange}
                className="border border-gray-300 rounded-md p-2 pl-4"
                style={{ width: '150px' }} // Set the width to 150px (adjust as needed)
              >
                <option value="All">All</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Week - Date">This Week - Date</option>
                <option value="This Month">This Month</option>
                <option value="Last Month to Date">This Month to Date</option>

                <option value="This Fiscal Quarter">This Fiscal Quarter</option>
                <option value="This Fiscal Quarter to Date">This Fiscal Quarter to Date</option>
                <option value="This Fiscal Year">This Fiscal Year</option>
                <option value="This Fiscal Year to Last Month">This Fiscal Year to Last Month</option>
                <option value="This Fiscal Year to Date">This Fiscal Year to Date</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last Week">Last Week</option>
                <option value="Last Week to Date">Last Week to Date</option>
                <option value="Last Month">Last Month</option>
                <option value="Last Month to Date">Last Month to Date</option>
                <option value="Last Fiscal Quarter">Last Fiscal Quarter</option>
                <option value="Last Fiscal Quarter to Last Month">Last Fiscal Quarter to Last Month</option>
              </select>

            </div>
            <div className="flex items-center space-x-2">
              <div className="text-lg">Sales by Date</div>
              <div className="relative">
                <DatePicker
                  selected={fromDate}
                  onChange={handleFromDateChange}
                  dateFormat="MM-dd-yyyy"
                  placeholderText="From"
                  className="border border-gray-300 rounded-md p-2 pl-2 cursor-pointer"
                />
                <FaCalendar className="absolute top-3 right-2  text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <DatePicker
                  selected={toDate}
                  onChange={handleToDateChange}
                  dateFormat="MM-dd-yyyy"
                  placeholderText="To"
                  className="border border-gray-300 rounded-md p-2 pl-2 cursor-pointer"
                />
                <FaCalendar className="absolute top-3 right-2  text-gray-400 pointer-events-none" />
              </div>
            </div>
            {/* Search input */}
            <input
              type="text"
              className="border border-gray-300 rounded-md p-2"
              placeholder="Search"
              // Assuming you have a function setSearchKeyword to handle search
              // onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ marginLeft: 'auto', marginRight: '16px' }}
            />
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button className="text-blue-500 cursor-pointer" onClick={() => window.history.back()}>
              Back
            </button>
          </div>

          <div className="table-container overflow-x-auto overflow-y-auto" style={{ maxHeight: '300px' }} id="sales-table" ref={tableRef}>
            {/* Header section */}
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold underline">Cash Flow</h2>
              <p><strong>Selected Date Period:</strong> {renderSelectedDatePeriod()}</p>
              <p>Report Printed On: {getCurrentDate()}</p>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">Cash Flow Summary</h3>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  {/* Operating Activities */}
                  <div className="px-4 py-5 sm:px-6">
                    <h4 className="text-lg font-semibold leading-6 text-gray-900">Cash flows from operating activities</h4>
                  </div>

                  <div className="bg-gray-50 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Revenue">
                    <dt className="text-sm font-medium text-gray-500">Cash receipts from customers</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{cashFlowData.revenue}</dd>
                  </div>

                  <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Operating Expenses">
                    <dt className="text-sm font-medium text-gray-500">Cash paid to suppliers and employees</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 underline">₦{cashFlowData.operatingExpenses > 0 ? `(${Math.abs(cashFlowData.operatingExpenses)})` : cashFlowData.operatingExpenses}</dd>
                  </div>

                  <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Operating Activities">
                    <dt className="text-sm font-medium text-gray-500">Cash generated from operations</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{cashFlowData.Cashgeneratedfromoperations}</dd>
                  </div>

                  <div className="bg-gray-50 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Taxes">
                    <dt className="text-sm font-medium text-gray-500">Income taxes paid</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 underline">₦{cashFlowData.taxes > 0 ? `(${Math.abs(cashFlowData.taxes)})` : cashFlowData.taxes}</dd>
                  </div>

                  <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Net Income">
                    <dt className="text-sm font-medium text-gray-500">Net cash from operating activities</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{cashFlowData.netIncome}</dd>
                  </div>

                  {/* Financing Activities */}
                  <div className="px-4 py-5 sm:px-6">
                    <h4 className="text-lg font-semibold leading-6 text-gray-900">Cash flows from financing activities</h4>
                  </div>

                  <div className="bg-gray-50 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Proceeds from Share Capital">
                    <dt className="text-sm font-medium text-gray-500">Proceeds from issuance of share capital</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{totalShareIssuanceProceeds}</dd>
                  </div>

                  <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Proceeds from Borrowings">
                    <dt className="text-sm font-medium text-gray-500">Proceeds from long-term borrowings(The Loan Itself)</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{totalReceivedLiabilities}</dd>
                  </div>

                  <div className="bg-gray-50 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Repayment of Borrowings">
                    <dt className="text-sm font-medium text-gray-500">Repayment of long-term borrowings(Loan)</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦({totalAmountPaid})</dd>
                  </div>

                  <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Interest Paid">
                    <dt className="text-sm font-medium text-gray-500">Interest paid(Cost of borrowing)</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦({totalInterestPaid})</dd>
                  </div>

                  <div className="bg-gray-50 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Dividends Paid">
                    <dt className="text-sm font-medium text-gray-500">Dividends paid(Share of profits paid to shareholders)</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦({totalDividendsPaid})</dd>
                  </div>

                  <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Net Cash from Financing Activities">
                    <dt className="text-sm font-medium text-gray-500">Net cash used in financing activities</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                      ₦{netCashFromFinancingActivities < 0 ? `(${Math.abs(netCashFromFinancingActivities)})` : netCashFromFinancingActivities}
                    </dd>
                  </div>

                  {/* Investing Activities */}
                  <div className="px-4 py-5 sm:px-6">
                    <h4 className="text-lg font-semibold leading-6 text-gray-900">Cash flows from investing activities</h4>
                  </div>

                  {/* Purchase of Fixed Assets (Debit - Negative) */}
                  <div className="bg-gray-50 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Purchase of Fixed Assets">
                    <dt className="text-sm font-medium text-gray-500">Purchase of fixed assets</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                      ₦{totalAssetPurchased > 0 ? `(${totalAssetPurchased.toLocaleString()})` : totalAssetPurchased.toLocaleString()}
                    </dd>
                  </div>

                  {/* Proceeds from Sale of Equipment (Credit - Positive) */}
                  <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Proceeds from Sale of Equipment">
                    <dt className="text-sm font-medium text-gray-500">Proceeds from sale of equipment</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{totalAssetSold.toLocaleString()}</dd>
                  </div>

                  {/* Interest Received (Credit - Positive) */}
                  <div className="bg-gray-50 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Interest Received">
                    <dt className="text-sm font-medium text-gray-500">Interest received (bonds, Interest Paying Accounts, etc.)</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{totalInterestReceived.toLocaleString()}</dd>
                  </div>

                  {/* Dividends Received (Credit - Positive) */}
                  <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Dividends Received">
                    <dt className="text-sm font-medium text-gray-500">Dividends received (shares, investments, etc.)</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦{totalDividendReceived.toLocaleString()}</dd>
                  </div>

                  {/* Calculate Net Cash from Investing Activities */}
                  <div className="bg-gray-50 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Net Cash from Investing Activities">
                    <dt className="text-sm font-medium text-gray-500">Net cash from investing activities</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                      ₦{(() => {
                        const netCashFromInvesting = totalAssetSold + totalInterestReceived + totalDividendReceived - totalAssetPurchased;
                        return netCashFromInvesting < 0
                          ? `(${Math.abs(netCashFromInvesting).toLocaleString()})`
                          : netCashFromInvesting.toLocaleString();
                      })()}
                    </dd>
                  </div>


                  {/* Net Increase in Cash */}
                  <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Net Increase in Cash">
                    <dt className="text-sm font-medium text-gray-500">Net increase in cash and cash equivalents</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦750</dd>
                  </div>


                  {/* Cash at Beginning of Period */}
                  <div className="bg-gray-50 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Cash Beginning of Period">
                    <dt className="text-sm font-medium text-gray-500">Cash and cash equivalents at beginning of period</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦160</dd>
                  </div>

                  {/* Cash at End of Period */}
                  <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" aria-label="Cash End of Period">
                    <dt className="text-sm font-medium text-gray-500">Cash and cash equivalents at end of period</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">₦910</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <button className="bg-blue-500 text-white px-4 py-2 rounded-md block mx-auto" onClick={saveAndPrintTable}>
            Print Statement
          </button>
        </div>


      </div>
    </div>

  );
};


export default CashFlow;
