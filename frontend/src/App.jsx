import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home.jsx";

import AddEntry from "./pages/AddEntry.jsx";
import DailySummary from "./pages/DailySummary.jsx";
import MonthlySummary from "./pages/MonthlySummary.jsx";
import Customers from "./pages/Customers.jsx";
import AddCustomerPage from "./pages/AddCustomerPage.jsx";
import CustomerProfile from "./pages/CustomerProfile.jsx";
import MonthPayments from "./pages/MonthPayments.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* ✅ Sticky Navbar */}
        <nav className="flex justify-center gap-4 py-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
          {[
            { name: "Add Entry", path: "/add-entry" },
            { name: "Daily Summary", path: "/daily-summary" },
            { name: "Monthly Summary", path: "/monthly-summary" },
            { name: "Customers", path: "/customers" },
            { name: "Payments", path: "/payments" },
          ].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-5 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 hover:bg-green-700"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* ✅ Page Content */}
        <main className="p-4">
          <Routes>
            <Route path="/" element={<AddEntry />} />
            <Route path="/add-entry" element={<AddEntry />} />
            <Route path="/daily-summary" element={<DailySummary />} />
            <Route path="/monthly-summary" element={<MonthlySummary />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/payments" element={<PaymentPage />} />
            <Route path="/month-payments/:monthCode" element={<MonthPayments />} /><Route path="/payments/:month" element={<MonthPayments />} />
            <Route path="/add-customer" element={<AddCustomerPage />} />
            <Route path="/customer/:id" element={<CustomerProfile />} />
            <Route path="/test" element={<Home />} />

            
          </Routes>
        </main>
      </div>
    </Router>
  );
}
