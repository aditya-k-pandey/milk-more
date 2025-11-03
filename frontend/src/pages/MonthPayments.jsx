import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function MonthPayments() {
  const { monthCode } = useParams(); // e.g. "2025-11"
  const navigate = useNavigate();

  const [paid, setPaid] = useState([]);
  const [unpaid, setUnpaid] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // safe guard: don't run if monthCode missing
    if (!monthCode) return;
    fetchMonthData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthCode]);

  const fetchMonthData = async () => {
    try {
      const [year, month] = monthCode.split("-");
      const res = await axios.get("http://localhost:5000/api/payments/status", {
        params: { month, year },
      });

      setPaid(res.data.paid || []);
      setUnpaid(res.data.unpaid || []);
    } catch (err) {
      console.error("Error loading data:", err);
      alert("Cannot load monthly payment data");
    } finally {
      setLoading(false);
    }
  };

  // Mark customer as Paid
  const markAsPaid = async (customer) => {
    try {
      const [year, month] = monthCode.split("-");
      const res = await axios.post("http://localhost:5000/api/payments/mark-paid", {
        customerId: customer.id,
        month,
        year,
      });

      if (res.data.success) {
        setUnpaid((prev) => prev.filter((c) => c.id !== customer.id));
        setPaid((prev) => [...prev, { ...customer }]);
      } else {
        alert(res.data.message || "Could not mark paid");
      }
    } catch (err) {
      console.error("Error updating:", err);
      alert("Failed to mark as paid");
    }
  };

  // Mark customer as Unpaid
  const markAsUnpaid = async (customer) => {
    try {
      const [year, month] = monthCode.split("-");
      const res = await axios.post("http://localhost:5000/api/payments/mark-unpaid", {
        customerId: customer.id,
        month,
        year,
      });

      if (res.data.success) {
        setPaid((prev) => prev.filter((c) => c.id !== customer.id));
        setUnpaid((prev) => [...prev, { ...customer }]);
      } else {
        alert(res.data.message || "Could not mark unpaid");
      }
    } catch (err) {
      console.error("Error updating:", err);
      alert("Failed to mark as unpaid");
    }
  };

  const monthLabel = monthCode
    ? new Date(`${monthCode}-01`).toLocaleString("default", {
        month: "long",
        year: "numeric",
      })
    : "";

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-white text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 w-full">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
      >
        ← Back
      </button>

      <h2 className="text-3xl font-semibold text-center mb-6">
        🗓️ Payment Summary — {monthLabel}
      </h2>

      {/* Summary Bar */}
      <div className="max-w-5xl mx-auto bg-gray-800 rounded-lg border border-gray-700 p-4 mb-8 flex flex-col md:flex-row justify-around items-center text-center gap-4">
        <div className="text-green-400 font-semibold">
          🟢 Paid: {paid.length} customers — ₹
          {paid.reduce((sum, c) => sum + (c.amount || 0), 0).toFixed(2)}
        </div>
        <div className="text-red-400 font-semibold">
          🔴 Unpaid: {unpaid.length} customers — ₹
          {unpaid.reduce((sum, c) => sum + (c.amount || 0), 0).toFixed(2)}
        </div>
      </div>

      {/* Side-by-side layout — items-stretch ensures both columns match height */}
      <div className="w-full max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Unpaid */}
        <div className="bg-gray-900 rounded-xl border border-red-600 p-4 flex flex-col h-full">
          <h3 className="text-2xl text-red-500 font-semibold mb-4">
            🔴 Unpaid Customers ({unpaid.length})
          </h3>

          {unpaid.length === 0 ? (
            <p className="text-gray-400 text-center flex-1 flex items-center justify-center">
              ✅ All customers paid!
            </p>
          ) : (
            /* overflow-auto + flex-1 so this panel grows and scrolls if needed */
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-red-900 text-red-100">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Litres</th>
                    <th className="px-4 py-3">Amount (₹)</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaid.map((c, i) => (
                    <tr
                      key={c.id || i}
                      className={`${
                        i % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                      } hover:bg-gray-700 transition`}
                    >
                      <td className="px-4 py-3">{`${c.name} (${c.id})`}</td>
                      <td className="px-4 py-3">{(c.litres || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">₹{(c.amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => markAsPaid(c)}
                          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg text-sm font-semibold"
                        >
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paid */}
        <div className="bg-gray-900 rounded-xl border border-green-600 p-4 flex flex-col h-full">
          <h3 className="text-2xl text-green-500 font-semibold mb-4">
            🟢 Paid Customers ({paid.length})
          </h3>

          {paid.length === 0 ? (
            <p className="text-gray-400 text-center flex-1 flex items-center justify-center">
              ❌ No one has paid yet.
            </p>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-green-900 text-green-100">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Litres</th>
                    <th className="px-4 py-3">Amount (₹)</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paid.map((c, i) => (
                    <tr
                      key={c.id || i}
                      className={`${
                        i % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                      } hover:bg-gray-700 transition`}
                    >
                      <td className="px-4 py-3">{`${c.name} (${c.id})`}</td>
                      <td className="px-4 py-3">{(c.litres || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">₹{(c.amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => markAsUnpaid(c)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm font-semibold"
                        >
                          Mark Unpaid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
