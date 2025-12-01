import React, { useEffect, useState } from "react";
import { getDailyEntries } from "../api";   // <-- add this import

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ✅ Get date in LOCAL timezone (not UTC)
function getLocalDateString() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}

// ✅ Shift date safely by given days (still in local time)
function shiftDate(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}

export default function DailySummary() {
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(() => getLocalDateString());
  const [msg, setMsg] = useState("");

  // ✅ Load data for given date
  // ✅ Load data for given date (robust to many API shapes)
  const load = async (selectedDate = date) => {
    try {
      setMsg("Loading...");

      // getDailyEntries returns parsed JSON (not axios response)
      const res = await getDailyEntries(selectedDate);

      // Debug — see exact response shape in console
      console.log("Daily summary raw response:", res);

      // Normalize payload to an array
      // Cases handled:
      // 1) backend returns array -> res = [ ... ]
      // 2) backend returns { success: true, data: [...] } -> res.data = [...]
      // 3) axios-style (unlikely here) -> res.data may exist
      const payload = res && res.data !== undefined ? res.data : res;
      const list =
        Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

      // sort and set
      const sorted = Array.isArray(list)
        ? [...list].sort((a, b) => {
          // sort safely even if id is ObjectId. Use string fallback.
          const A = (a._id || a.id || a.customerId || "").toString();
          const B = (b._id || b.id || b.customerId || "").toString();
          return A.localeCompare(B);
        })
        : [];

      setRows(sorted);
      setMsg("");
    } catch (e) {
      console.error("load() error:", e);
      alert("Cannot load daily data");
      setRows([]);
      setMsg("Error loading data");
    }
  };


  // ✅ Initial load
  useEffect(() => {
    load(date);
    const refreshHandler = () => load(date);
    window.addEventListener("dailySummaryUpdated", refreshHandler);

    return () => window.removeEventListener("dailySummaryUpdated", refreshHandler);
  }, []);

  // ✅ Auto update date every midnight (LOCAL TIME)
  useEffect(() => {
    const checkAndUpdate = async () => {
      const today = getLocalDateString();
      setDate((prev) => {
        if (prev !== today) {
          console.log("🕛 Local midnight reached! Updating date to:", today);
          load(today);
          return today;
        }
        return prev;
      });
    };

    // Run immediately and every 30 seconds
    checkAndUpdate();
    const intervalId = setInterval(checkAndUpdate, 30 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // 🗓️ Date navigation functions
  const handleDateChange = (newDate) => {
    setDate(newDate);
    load(newDate);
  };

  const prevDay = () => handleDateChange(shiftDate(date, -1));
  const nextDay = () => handleDateChange(shiftDate(date, +1));

  // ✅ Totals
  const totalLitres = rows.reduce((s, r) => s + (r.litres || 0), 0);
  const totalAmt = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const uniqueCustomers = [...new Set(rows.map((r) => r.customerId))].length;

  // 🧾 Export PDF
  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Daily Milk Summary", 14, 16);

      if (!Array.isArray(rows) || rows.length === 0) {
        alert("No data to export!");
        return;
      }

      const tableColumn = ["Customer", "Litres", "Amount (₹)"];
      const tableRows = rows.map((r) => [
        r.customerName || "",
        r.litres || "",
        r.amount || "",
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 22,
      });

      doc.save(`DailySummary_${date}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Error while exporting PDF");
    }
  };

  // 📊 Export Excel
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r, i) => ({
        "#": i + 1,
        "Customer ID": r.customerId,
        "Customer Name": r.customerName,
        "Litres": r.litres,
        "Amount (₹)": r.amount,
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Summary");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `DailySummary_${date}.xlsx`
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-6xl bg-[#111] rounded-xl shadow-2xl p-8 border border-gray-800">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          🥛 Daily Milk Summary
        </h1>

        {/* Controls */}
        <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
          <button
            onClick={prevDay}
            className="bg-gray-800 hover:bg-gray-700 text-gray-100 px-4 py-2 rounded-md text-sm font-medium"
          >
            ⬅️ Prev
          </button>

          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-gray-900 text-gray-100 border border-gray-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            onClick={nextDay}
            className="bg-gray-800 hover:bg-gray-700 text-gray-100 px-4 py-2 rounded-md text-sm font-medium"
          >
            Next ➡️
          </button>

          <button
            onClick={() => load(date)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-semibold"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex justify-end gap-3 mb-4">
          <button
            onClick={exportPDF}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-semibold shadow-md"
          >
            📄 Export PDF
          </button>
          <button
            onClick={exportExcel}
            className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-md text-sm font-semibold shadow-md text-black"
          >
            📊 Export Excel
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-gray-950/80 rounded-xl border border-gray-700 shadow-lg">
          <table className="min-w-full border border-gray-600 text-sm border-collapse">
            <thead>
              <tr className="bg-green-700/30 text-green-300 uppercase text-xs">
                <th className="px-4 py-3 border border-gray-600 text-left">#</th>
                <th className="px-4 py-3 border border-gray-600 text-left">
                  Customer ID
                </th>
                <th className="px-4 py-3 border border-gray-600 text-left">
                  Customer Name
                </th>
                <th className="px-4 py-3 border border-gray-600 text-right">
                  Litres
                </th>
                <th className="px-4 py-3 border border-gray-600 text-right">
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-8 text-gray-400 border border-gray-700"
                  >
                    No records found for this date.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={i}
                    className={`${i % 2 === 0 ? "bg-gray-900" : "bg-gray-800"
                      } hover:bg-gray-700/80 transition`}
                  >
                    <td className="px-4 py-3 border border-gray-700">{i + 1}</td>
                    <td className="px-4 py-3 border border-gray-700">{r.customerId?.id}</td>
                    <td className="px-4 py-3 border border-gray-700">{r.customerId?.name}</td>
                    <td className="px-4 py-3 border border-gray-700 text-right">{r.litres}</td>
                    <td className="px-4 py-3 border border-gray-700 text-right">
                      ₹{r.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-800 font-semibold text-green-300">
                  <td colSpan="2" className="px-4 py-3 border border-gray-700 text-left">
                    Total Customers: {uniqueCustomers}
                  </td>
                  <td className="px-4 py-3 border border-gray-700 text-right">Total</td>
                  <td className="px-4 py-3 border border-gray-700 text-right">
                    {totalLitres.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 border border-gray-700 text-right">
                    ₹{totalAmt.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {msg && (
          <p className="text-center text-gray-400 mt-4 text-sm italic">{msg}</p>
        )}
      </div>
    </div>
  );
}
