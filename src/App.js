import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import PrivateRoute from "./components/PrivateRoute";
import Header from "./components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "./components/Footer";

import PosScreen from "./pages/PosScreen";
import AddGoodPurchase from "./components/AddPurchases";
import ExpensePage from "./pages/ExpensePage";
import ProfitAndLoss from "./pages/ProfitAndLoss";
import BalanceSheet from "./pages/BalanceSheet";
import AddAsset from "./components/AddAsset";
import AddLiability from "./components/AddLiability";
import CashFlow from "./pages/CashFlow";
import ContactMe from "./pages/ContactMe";
import CompanySignUp from "./pages/CompanySignUp";
import AddShares from "./components/Shares";

import Teachers from "./pages/Teachers";
import ManageStudents from "./pages/Students";
import FeesPaidReport from "./pages/FeesPaid";
import Classes from "./pages/Classes";
import TeachersAttendance from "./pages/TeachersAttendance";
import Graduates from "./pages/Graduates";
import ResignedTeachers from "./pages/ResignedTeachers";

// ✅ ADD USERS PAGE
import Users from "./components/Users";
import Assets from "./pages/Assets";
// C:\Users\Engr\Desktop\school-management-system-master\src\components\Users.jsx

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Router>
        <Header />

        <div className="flex-grow overflow-y-auto">
          <Routes>
            {/* ✅ PUBLIC ROUTES ONLY */}
            <Route path="/" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />

            {/* If you truly want this public, keep it outside PrivateRoute.
                If not, move it inside below. */}
            <Route path="/company-sign-up" element={<CompanySignUp />} />

            {/* ✅ PROTECTED ROUTES */}
            <Route element={<PrivateRoute />}>
              <Route path="/users" element={<Users />} />

              <Route path="/teachers" element={<Teachers />} />
              <Route
                path="/teachersattendance"
                element={<TeachersAttendance />}
              />

              <Route path="/classes" element={<Classes />} />
              <Route path="/students" element={<ManageStudents />} />

              <Route path="/fees" element={<FeesPaidReport />} />
              <Route path="/graduates" element={<Graduates />} />
              <Route
                path="/resignees-retirees"
                element={<ResignedTeachers />}
              />

              <Route path="/report-bug" element={<ContactMe />} />

              <Route path="/posscreen" element={<PosScreen />} />

              <Route path="/add-purchase" element={<AddGoodPurchase />} />

              <Route path="/add-asset" element={<Assets />} />
              <Route path="/add-liability" element={<AddLiability />} />
              <Route path="/add-shares" element={<AddShares />} />

              <Route path="/profitandloss" element={<ProfitAndLoss />} />
              <Route path="/balance-sheet" element={<BalanceSheet />} />
              <Route path="/cash-flow" element={<CashFlow />} />

              <Route path="/expenses" element={<ExpensePage />} />

              {/* If /profile is protected, define its real component here.
                  Your old code had element={<PrivateRoute />} which doesn't render a page.
                  Example:
                  <Route path="/profile" element={<Profile />} />
               */}
              <Route path="/profile" element={<PosScreen />} />
            </Route>
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
