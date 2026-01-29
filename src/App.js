import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import PrivateRoute from "./components/PrivateRoute";
import Header from "./components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "./components/Footer";
import InventoryPage from "./pages/InventoryPage";
import PosScreen from "./pages/PosScreen";
import AddProduct from "./components/AddProducts";
import ProductDetails from "./components/ProductDetails";
import ProductHistory from './components/ProductHistory';
import PrintInventoryPage from './components/PrintInventoryPage';
// import SalesPage from './pages/SalesPage';
// import PrintSalesPage from './components/PrintSalesPage';
import AddExpense from './components/AddExpenses';
import AddGoodPurchase  from './components/AddPurchases';
import AdminComponent from './components/Admin';
import ExpensePage from './pages/ExpensePage';
import ProfitAndLoss from './pages/ProfitAndLoss';
import BalanceSheet from './pages/BalanceSheet';
import AddTax from './components/AddTax';
import AddAsset from './components/AddAsset';
import AddLiability from './components/AddLiability';
import CashFlow from './pages/CashFlow';
import ContactMe from './pages/ContactMe';
import CompanySignUp from './pages/CompanySignUp';
import AddShares from './components/Shares';
import GoodsPurchases from './pages/GoodsPurchases';
import Teachers from './pages/Teachers';
import ManageStudents from './pages/Students';
import FeesPaidReport from './pages/FeesPaid';
import Classes from './pages/Classes';
import TeachersAttendance from './pages/TeachersAttendance';
import Graduates from './pages/Graduates'; // graduates page
import ResignedTeachers from './pages/ResignedTeachers'; // resigned/resignees-retirees page

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Router>
        <Header />
        <div className="flex-grow overflow-y-auto">
          <Routes>
            <Route path="/admin" element={<AdminComponent />} />
            <Route path="/" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/teachersattendance" element={<TeachersAttendance />} />

            <Route path="/classes" element={<Classes />} />

            <Route path="/students" element={<ManageStudents />} />
            <Route path="/report-bug" element={<ContactMe />} />
            <Route path="/company-sign-up" element={<CompanySignUp/>} />
            <Route path="/posscreen" element={<PosScreen />} />
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/add-purchase" element={<AddGoodPurchase />} />
            <Route path="/add-asset" element={<AddAsset />} />
            <Route path="/add-liability" element={<AddLiability />} />
            <Route path="/add-shares" element={<AddShares />} />
            <Route path="/add-tax" element={<AddTax />} />
            <Route path="/profitandloss" element={<ProfitAndLoss />} />
            <Route path="/balance-sheet" element={<BalanceSheet />} />
            <Route path="/cash-flow" element={<CashFlow />} />
            <Route path="/expenses" element={<ExpensePage />} />
            <Route path="/purchases" element={<GoodsPurchases />} />
            <Route path="/profile" element={<PrivateRoute />} />
            <Route path="/inventory-page" element={<InventoryPage />} />
            <Route path="/fees" element={<FeesPaidReport />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/product-details/:productId" element={<ProductDetails />} />
            <Route path="/product-history/:productId" element={<ProductHistory />} />
            <Route path="/print-inventory" element={<PrintInventoryPage />} />

            <Route path="/graduates" element={<Graduates />} /> {/* graduates route */}

            {/* New route for resigned / resignees-retirees */}
            <Route path="/resignees-retirees" element={<ResignedTeachers />} />

            {/* <Route path="/print-sales" element={<PrintSalesPage />} /> */}
          </Routes>
        </div>
        <ToastContainer
          position="bottom-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <Footer />
      </Router>
    </div>
  );
}

export default App;