import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import SellerProfile from "./pages/SellerProfile.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProfile from "./pages/admin/AdminProfile.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
import AdminEntries from "./pages/admin/AdminEntries.jsx";
import AdminUserCustomers from "./pages/admin/AdminUserCustomers";


import Home from "./pages/Home.jsx";
import AddEntry from "./pages/AddEntry.jsx";
import DailySummary from "./pages/DailySummary.jsx";
import MonthlySummary from "./pages/MonthlySummary.jsx";
import Customers from "./pages/Customers.jsx";
import AddCustomerPage from "./pages/AddCustomerPage.jsx";
import CustomerProfile from "./pages/CustomerProfile.jsx";
import MonthPayments from "./pages/MonthPayments.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import ForgotPassword from "./pages/ForgotPassword";


import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

// ---------------- Helper Component to Hide Navbar ----------------
function Navbar() {
  const location = useLocation();

  // hide navbar on auth pages and any admin pages
  const hideNavbarRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/admin/login",
  ];

  if (hideNavbarRoutes.includes(location.pathname) || location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="flex justify-center gap-4 py-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      {[
        { name: "Add Entry", path: "/add-entry" },
        { name: "Daily Summary", path: "/daily-summary" },
        { name: "Monthly Summary", path: "/monthly-summary" },
        { name: "Customers", path: "/customers" },
        { name: "Payments", path: "/payments" },
        { name: "Profile", path: "/profile" },
      ].map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `px-5 py-2 rounded-lg font-semibold transition-all duration-200 ${isActive
              ? "bg-green-600 text-white"
              : "bg-gray-800 hover:bg-green-700"
            }`
          }
        >
          {item.name}
        </NavLink>
      ))}
    </nav>
  );
}


export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-white">

        <Navbar />

        <main className="p-4">
          <Routes>

            {/* PUBLIC ROUTES */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/admin/login" element={<AdminLogin />} />



            <Route
              path="/admin/users/:userId/customers"
              element={
                <ProtectedRoute adminOnly>
                  <AdminUserCustomers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminProfile />
                </ProtectedRoute>
              }
            />

            <Route path="/admin-dashboard" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

/* For the dashboard tiles which call /admin/manage-* */
            <Route path="/admin/manage-users" element={
              <ProtectedRoute adminOnly={true}>
                <AdminUsers />
              </ProtectedRoute>
            } />

            <Route path="/admin/manage-customers" element={
              <ProtectedRoute adminOnly={true}>
                <AdminCustomers />
              </ProtectedRoute>
            } />

            <Route path="/admin/manage-entries" element={
              <ProtectedRoute adminOnly={true}>
                <AdminEntries />
              </ProtectedRoute>
            } />


            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/customers"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminCustomers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/entries"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminEntries />
                </ProtectedRoute>
              }
            />



            {/* PROTECTED ROUTES */}

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <SellerProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AddEntry />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-entry"
              element={
                <ProtectedRoute>
                  <AddEntry />
                </ProtectedRoute>
              }
            />

            <Route
              path="/daily-summary"
              element={
                <ProtectedRoute>
                  <DailySummary />
                </ProtectedRoute>
              }
            />

            <Route
              path="/monthly-summary"
              element={
                <ProtectedRoute>
                  <MonthlySummary />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/month-payments/:monthCode"
              element={
                <ProtectedRoute>
                  <MonthPayments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payments/:month"
              element={
                <ProtectedRoute>
                  <MonthPayments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-customer"
              element={
                <ProtectedRoute>
                  <AddCustomerPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customer/:id"
              element={
                <ProtectedRoute>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/test"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

          </Routes>
        </main>
      </div>
    </Router>
  );
}
