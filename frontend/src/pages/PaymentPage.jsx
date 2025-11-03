import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "react-select"; // ✅ New import

export default function PaymentPage() {
  const navigate = useNavigate();

  // States
  const [activeTab, setActiveTab] = useState("collect");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [filterRange, setFilterRange] = useState("3");
  const [historyMonths, setHistoryMonths] = useState([]);
  const [openYears, setOpenYears] = useState({});
  
  // 🟢 Added new states
  const [rate, setRate] = useState(55);
  const [totalLitres, setTotalLitres] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [method, setMethod] = useState("Cash");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [receiptHtml, setReceiptHtml] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [summaryLoaded, setSummaryLoaded] = useState(false);

  // Load data
  useEffect(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(ym);
    generateLast36Months();
    fetchCustomers();
    fetchRate(); // 🟢
  }, []);

  useEffect(() => {
    // whenever selectedMonth changes, refetch summary for selected customer
    if (selectedCustomer) {
      fetchSummary(selectedCustomer, selectedMonth);
    }
  }, [selectedMonth]);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/customers");
      setCustomers(res.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  // 🟢 Fetch current rate from backend
  const fetchRate = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/payments/settings/rate");
      setRate(res.data.rate || 55);
    } catch (err) {
      console.error(err);
    }
  };

  // 🟢 Fetch total litres & amount for selected customer/month
  const fetchSummary = async (cust, monthCode) => {
    if (!cust) return;
    try {
      const [year, month] = monthCode.split("-");
      const res = await axios.get("http://localhost:5000/api/payments/summary", {
        params: { customerId: cust.id, month, year },
      });

      const litres = res.data?.totalLitres ?? 0;
      const amount = res.data?.totalAmount ?? litres * (res.data?.rate ?? 55);

      setTotalLitres(litres);
      setTotalAmount(amount);
      setRate(res.data?.rate ?? 55);
      setIsPaid(res.data?.paid ?? false);
      setSummaryLoaded(true);
    } catch (err) {
      console.error("Error fetching summary:", err);
      setSummaryLoaded(false);
    }
  };

  const generateLast36Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 36; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleString("default", { month: "long" }),
        year: d.getFullYear(),
      });
    }
    setHistoryMonths(months);
  };

  const handlePayment = async (method) => {
    if (!selectedCustomer) return alert("Select a customer first");
    try {
      setMethod(method);
      setShowMethodModal(true); // 🟢 Open modal for confirmation
    } catch (err) {
      console.error(err);
    }
  };

  // 🟢 Confirm payment (save + generate receipt)
  const confirmPayment = async () => {
    try {
      const [year, month] = selectedMonth.split("-");
      const res = await axios.post("http://localhost:5000/api/payments/collect", {
        customerId: selectedCustomer.id,
        month: Number(month),
        year: Number(year),
        method,
        paidBy: whatsappNumber || null,
      });
      if (!res.data.success) return alert(res.data.message || "Error");

      setIsPaid(true);
      const html = `
        <div style="font-family:sans-serif;padding:20px;">
          <h2>Milk Receipt</h2>
          <p><strong>Customer:</strong> ${selectedCustomer.name}</p>
          <p><strong>ID:</strong> ${selectedCustomer.id}</p>
          <p><strong>Phone:</strong> ${selectedCustomer.phone}</p>
          <p><strong>Month:</strong> ${new Date(selectedMonth + "-01").toLocaleString("default",{month:"long",year:"numeric"})}</p>
          <p><strong>Litres:</strong> ${totalLitres}</p>
          <p><strong>Rate:</strong> ₹${rate}</p>
          <p><strong>Total:</strong> ₹${totalAmount}</p>
          <p><strong>Method:</strong> ${method}</p>
        </div>`;
      setReceiptHtml(html);
      setShowMethodModal(false);
      setShowReceiptModal(true);
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    }
  };

  // 🟢 Print and WhatsApp functions
  const printReceipt = () => {
    const w = window.open("", "Print");
    w.document.write(`<html><body>${receiptHtml}</body></html>`);
    w.print();
    w.close();
  };

  const sendReceiptWhatsApp = () => {
    const phone = whatsappNumber || selectedCustomer.phone;
    const text = `Milk Receipt - ${selectedCustomer.name}%0ALitres: ${totalLitres}%0ATotal: ₹${totalAmount}`;
    window.open(`https://wa.me/91${phone}?text=${text}`, "_blank");
  };

  const handleMarkUnpaid = async () => {
    if (!selectedCustomer) return alert("Select a customer first");
    try {
      await axios.put(`http://localhost:5000/api/customers/${selectedCustomer.id}/unpay`, {
        month: selectedMonth,
      });
      setIsPaid(false);
      alert("❌ Payment marked as UNPAID");
    } catch (err) {
      console.error(err);
    }
  };

  const filteredGrouped = (() => {
    if (!historyMonths.length) return {};

    let monthsToShow = [...historyMonths].sort(
      (a, b) => new Date(`${b.month} 1, ${b.year}`) - new Date(`${a.month} 1, ${a.year}`)
    );

    if (filterRange === "current") {
      const now = new Date();
      monthsToShow = historyMonths.filter(
        (m) => m.month === now.toLocaleString("default", { month: "long" }) && m.year === now.getFullYear()
      );
    } else if (filterRange !== "all") {
      monthsToShow = monthsToShow.slice(0, Number(filterRange));
    }

    const grouped = monthsToShow.reduce((acc, m) => {
      if (!acc[m.year]) acc[m.year] = [];
      acc[m.year].push(m.month);
      return acc;
    }, {});

    const sortedYears = Object.keys(grouped)
      .sort((a, b) => Number(b) - Number(a))
      .reduce((acc, year) => {
        const orderedMonths = grouped[year].sort(
          (a, b) => new Date(`${b} 1, ${year}`) - new Date(`${a} 1, ${year}`)
        );
        acc[year] = orderedMonths;
        return acc;
      }, {});

    return sortedYears;
  })();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => setActiveTab("collect")}
          className={`px-6 py-2 rounded-l-lg font-semibold ${activeTab === "collect" ? "bg-green-700" : "bg-gray-800 hover:bg-green-600"}`}
        >
          Collect Payments
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2 rounded-r-lg font-semibold ${activeTab === "history" ? "bg-green-700" : "bg-gray-800 hover:bg-green-600"}`}
        >
          Payment History
        </button>
      </div>

      {/* -------------------- Collect Payment Tab -------------------- */}
      {activeTab === "collect" && (
        <>
          <h2 className="text-3xl font-bold text-center mb-8">💳 Collect Payment</h2>

          {/* Searchable Dropdown */}
          <div className="max-w-md mx-auto mb-6">
            <Select
              options={customers.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.id})`,
              }))}
              value={
                selectedCustomer
                  ? { value: selectedCustomer.id, label: `${selectedCustomer.name} (${selectedCustomer.id})` }
                  : null
              }
              onChange={(selected) => {
                const found = customers.find((c) => c.id === selected.value);
                setSelectedCustomer(found);
                fetchSummary(found, selectedMonth); // 🟢 fetch litres & amount
              }}
              placeholder="Search or select customer..."
              isSearchable
              className="text-black"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: "#1f2937",
                  borderColor: "#374151",
                  color: "white",
                  boxShadow: "none",
                }),
                singleValue: (base) => ({ ...base, color: "white" }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "#111827",
                  color: "white",
                }),
              }}
            />
          </div>

          {/* Customer Info */}
          {selectedCustomer && (
            <div className="max-w-md mx-auto bg-gray-900 rounded-lg p-6 border border-gray-800 shadow-lg">
              <h3 className="text-xl font-semibold mb-2">{selectedCustomer.name}</h3>
              <p className="text-gray-400 mb-4">
                Month:{" "}
                {new Date(selectedMonth + "-01").toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </p>

              {/* 🟢 Show litres and amount */}
              <div className="bg-gray-800 p-3 rounded mb-4 border border-gray-700">
                <p>🥛 Total Litres: <strong>{summaryLoaded ? totalLitres.toFixed(2) : "—"}</strong></p>
                <p>💰 Rate (₹/L): <strong>{summaryLoaded ? rate : "—"}</strong></p>
                <p>📄 Total Amount: <strong>{summaryLoaded ? `₹${totalAmount.toFixed(2)}` : "—"}</strong></p>
              </div>

              {/* Payment buttons */}
              <div className="space-y-3">
                <button onClick={() => handlePayment("WhatsApp Link")} className="w-full bg-green-700 py-2 rounded-lg">
                  📩 Send Payment Link (WhatsApp)
                </button>

                <button onClick={() => handlePayment("Phone Number")} className="w-full bg-blue-700 py-2 rounded-lg">
                  📞 Send to Phone Number
                </button>

                <button onClick={() => handlePayment("UPI / Card")} className="w-full bg-purple-700 py-2 rounded-lg">
                  💳 Pay via UPI / Card
                </button>

                <button onClick={() => handlePayment("Cash")} className="w-full bg-yellow-500 text-black font-semibold py-2 rounded-lg">
                  💵 Cash Received
                </button>

                <button onClick={handleMarkUnpaid} className="w-full bg-red-600 py-2 rounded-lg">
                  ❌ Mark as Unpaid
                </button>
              </div>

              <p className="text-center mt-4">
                Status:{" "}
                <span className={`font-semibold ${isPaid ? "text-green-400" : "text-red-400"}`}>
                  {isPaid ? "PAID" : "UNPAID"}
                </span>
              </p>
            </div>
          )}
        </>
      )}

      {/* -------------------- Payment History (restored) -------------------- */}
      {activeTab === "history" && (
        <>
          <h2 className="text-2xl font-semibold text-center mb-6">🗓️ Payment History</h2>

          {/* Filter Buttons */}
          <div className="flex justify-center gap-4 mb-6 flex-wrap">
            {[
              { label: "Current Month", value: "current" },
              { label: "Last 3 Months", value: "3" },
              { label: "Last 6 Months", value: "6" },
              { label: "Last 12 Months", value: "12" },
              { label: "All Years", value: "all" },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-2 cursor-pointer px-5 py-2 rounded-lg border transition-all 
                ${filterRange === option.value
                  ? "bg-green-600 border-green-400 text-white shadow-lg scale-105"
                  : "bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-green-500"
                }`}
              >
                <input
                  type="radio"
                  name="filterRange"
                  value={option.value}
                  checked={filterRange === option.value}
                  onChange={() => setFilterRange(option.value)}
                  className="accent-green-500 w-4 h-4"
                />
                <span className="font-semibold">{option.label}</span>
              </label>
            ))}
          </div>

          {/* Grouped by Year */}
          <div className="max-w-3xl mx-auto bg-gray-900 rounded-lg border border-gray-800 p-4">
            {Object.entries(filteredGrouped).map(([year, months]) => (
              <div key={year} className="mb-4 border-b border-gray-800 pb-2">
                <div
                  className="flex justify-between items-center cursor-pointer bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700"
                  onClick={() => setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }))}
                >
                  <h3 className="text-xl font-semibold text-green-400 flex items-center gap-2">
                    📅 {year}
                  </h3>
                  <span className="text-gray-300">{openYears[year] ? "▲" : "▼"}</span>
                </div>

                {openYears[year] && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {months.map((m, i) => {
                      const monthIndex = new Date(`${m} 1, ${year}`).getMonth() + 1;
                      const monthCode = `${year}-${String(monthIndex).padStart(2, "0")}`;
                      return (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2 hover:bg-gray-700"
                        >
                          <span>{m}</span>
                          <button
                            onClick={() => navigate(`/month-payments/${monthCode}`)}
                            className="bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-sm font-semibold"
                          >
                            View Details
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 🟢 Payment Method Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-[#111827] p-6 rounded w-full max-w-sm">
            <h3 className="text-xl mb-3 font-semibold">Confirm Payment</h3>
            <p className="mb-2">Method: {method}</p>
            <input
              type="tel"
              placeholder="Enter WhatsApp number (optional)"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full p-2 mb-3 rounded bg-gray-800 text-white"
            />
            <div className="flex gap-2">
              <button onClick={confirmPayment} className="flex-1 bg-green-600 py-2 rounded">Confirm</button>
              <button onClick={() => setShowMethodModal(false)} className="flex-1 bg-gray-700 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded max-w-lg w-full">
            <div dangerouslySetInnerHTML={{ __html: receiptHtml }} />
            <div className="flex gap-2 mt-4">
              <button onClick={printReceipt} className="bg-blue-600 text-white p-2 rounded">Print</button>
              <button onClick={sendReceiptWhatsApp} className="bg-green-600 text-white p-2 rounded">Share WhatsApp</button>
              <button onClick={() => setShowReceiptModal(false)} className="bg-gray-600 text-white p-2 rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
