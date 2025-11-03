import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function MonthlySummary() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [data, setData] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ Default to current month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // ✅ Fetch customers
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/customers")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Error fetching customers:", err));
  }, []);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Filter customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.id.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // ✅ Fetch monthly summary
  const fetchSummary = async () => {
    if (!selectedCustomer || !selectedMonth) {
      alert("Please select both customer and month");
      return;
    }

    const [year, month] = selectedMonth.split("-");

    try {
      const res = await axios.get("http://localhost:5000/api/entries/monthly", {
        params: { customerId: selectedCustomer, month, year },
      });

      // 🧾 Filter entries strictly by selected month & year (to remove Oct 31 issue)
      const selectedMonthNum = parseInt(month);
      const selectedYearNum = parseInt(year);

      const filtered = res.data.filter((entry) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getMonth() + 1 === selectedMonthNum &&
          entryDate.getFullYear() === selectedYearNum
        );
      });

      setData(filtered);
    } catch (err) {
      console.error("Error fetching summary:", err);
      alert("Failed to load summary");
    }
  };


  // ✅ Totals
  const totalLitres = data.reduce((sum, item) => sum + (item.litres || 0), 0);
  const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);

  // 🧾 Export PDF
  // 🧾 Export PDF
  const exportPDF = () => {
    if (!data || data.length === 0) {
      alert("No data to export!");
      return;
    }

    try {
      const doc = new jsPDF("p", "pt", "a4");

      const fontUrl = `${window.location.origin}/src/assets/fonts/DejaVuSans.ttf`;
      fetch(fontUrl)
        .then((res) => res.arrayBuffer())
        .then((fontData) => {
          const fontStr = btoa(
            new Uint8Array(fontData).reduce((data, byte) => data + String.fromCharCode(byte), "")
          );
          doc.addFileToVFS("DejaVuSans.ttf", fontStr);
          doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
          doc.setFont("DejaVuSans");

          // 🧾 Company Header (like Receipt)
          const logoPath = `${window.location.origin}/src/assets/milk-logo.png`;
          const companyName = "Milk More";
          const address = "Ghazipur, Uttar Pradesh";
          const phone = "Ph: +91 98765 43210";

          const img = new Image();
          img.src = logoPath;
          img.onload = () => {
            doc.addImage(img, "PNG", 250, 20, 90, 90);

            doc.setFontSize(18);
            doc.setTextColor(46, 139, 87);
            doc.text(companyName, 300, 130, { align: "center" });

            doc.setFontSize(11);
            doc.setTextColor(60);
            doc.text(address, 300, 145, { align: "center" });
            doc.text(phone, 300, 160, { align: "center" });

            // 🧾 Header Line
            doc.setDrawColor(46, 139, 87);
            doc.setLineWidth(1);
            doc.line(40, 175, 555, 175);

            // 🧾 Customer Info
            const customer = customers.find((c) => c.id === selectedCustomer);
            const dateLabel = new Date(selectedMonth + "-01").toLocaleString("default", {
              month: "long",
              year: "numeric",
            });

            doc.setFontSize(12);
            doc.setTextColor(46, 139, 87);
            doc.text("Customer Name:", 60, 200);
            doc.setTextColor(0);
            doc.text(customer ? customer.name : "N/A", 180, 200);

            doc.setTextColor(46, 139, 87);
            doc.text("Customer ID:", 60, 215);
            doc.setTextColor(0);
            doc.text(customer ? customer.id : "N/A", 180, 215);

            doc.setTextColor(46, 139, 87);
            doc.text("Month:", 60, 230);
            doc.setTextColor(0);
            doc.text(dateLabel, 180, 230);

            // 🧾 Second Header Line
            doc.setDrawColor(46, 139, 87);
            doc.line(40, 245, 555, 245);

            // ✅ Table Setup
            const tableColumn = ["Date", "Litres", "Amount (₹)"];
            const formatDate = (d) => {
              const date = new Date(d);
              const day = String(date.getDate()).padStart(2, "0");
              const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
              const year = date.getFullYear();
              return `${day}-${month}-${year}`;
            };

            const cleanNumber = (num) =>
              Number(num).toLocaleString("en-IN", { minimumFractionDigits: 2 });

            const tableRows = data.map((r) => [
              formatDate(r.date),
              r.litres.toFixed(2),
              `₹${cleanNumber(r.amount)}`,
            ]);

            tableRows.push(["Total", totalLitres.toFixed(2), `₹${cleanNumber(totalAmount)}`]);

            autoTable(doc, {
              head: [tableColumn],
              body: tableRows,
              startY: 260,
              theme: "grid",
              styles: {
                font: "DejaVuSans",
                fontSize: 11,
                halign: "center",
                valign: "middle",
                cellPadding: 6,
              },
              headStyles: {
                fillColor: [46, 139, 87],
                textColor: [255, 255, 255],
                fontStyle: "bold",
              },
              columnStyles: {
                0: { halign: "center", cellWidth: 150 },
                1: { halign: "right", cellWidth: 150 },
                2: { halign: "right", cellWidth: 150 },
              },
              alternateRowStyles: { fillColor: [245, 245, 245] },
            });

            // ✅ Totals neatly placed just below table
            // ✅ Totals aligned perfectly under the last column
            const table = doc.lastAutoTable;
            const tableEndY = table.finalY + 40; // small gap under table

            // get right edge of last column
            const tableWidth = table.table?.width || 460;
            const tableX = table.settings.margin.left || 40;
            const rightAlignX = tableX + tableWidth - 10;

            doc.setFontSize(13);

            // Total Litres
            doc.setTextColor(46, 139, 87);
            doc.text("Total Litres:", rightAlignX - 140, tableEndY, { align: "right" });
            doc.setTextColor(0);
            doc.text(`${totalLitres.toFixed(2)} L`, rightAlignX, tableEndY, { align: "right" });

            // Total Amount
            doc.setTextColor(46, 139, 87);
            doc.text("Total Amount:", rightAlignX - 140, tableEndY + 25, { align: "right" });
            doc.setTextColor(0);
            doc.text(`₹ ${cleanNumber(totalAmount)}`, rightAlignX, tableEndY + 25, { align: "right" });




            // ✅ Footer
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("Thank you for your business!", 300, doc.internal.pageSize.getHeight() - 40, {
              align: "center",
            });

            // ✅ Save PDF
            doc.save(`MonthlySummary_${selectedMonth}.pdf`);
          }; // ✅ this closing was missing!
        })
        .catch((err) => {
          console.error("Font load failed:", err);
          alert("Error loading font!");
        });
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Error while exporting PDF!");
    }
  };






  // 📊 Export Excel
  const exportExcel = () => {
    if (!Array.isArray(data) || data.length === 0) {
      alert("No data to export!");
      return;
    }

    const ws = XLSX.utils.json_to_sheet([
      ...data.map((r, i) => ({
        "#": i + 1,
        Date: r.date,
        Litres: r.litres,
        "Amount (₹)": r.amount,
      })),
      {
        "#": "",
        Date: "Total",
        Litres: totalLitres.toFixed(2),
        "Amount (₹)": totalAmount.toFixed(2),
      },
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Summary");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `MonthlySummary_${selectedMonth}.xlsx`
    );
  };

  return (
    <div className="min-h-screen bg-[#111] text-white px-6 py-6">
      <h1 className="text-3xl font-bold text-white mb-4 text-center">
        🥛 Monthly Milk Summary
      </h1>

      <h2 className="text-center text-gray-400 mb-6 text-sm">
        Showing data for:{" "}
        <span className="text-white font-semibold">
          {new Date(selectedMonth + "-01").toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </span>
      </h2>

      {/* Filters Section */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        {/* 🔍 Searchable Dropdown */}
        <div className="relative w-64" ref={dropdownRef}>
          <input
            type="text"
            placeholder="Search or select customer"
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
          {dropdownOpen && (
            <div className="absolute mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg max-h-40 overflow-y-auto z-10">
              {filteredCustomers.length === 0 ? (
                <div className="px-3 py-2 text-gray-400 text-sm">No match found</div>
              ) : (
                filteredCustomers.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => {
                      setSelectedCustomer(c.id);
                      setCustomerSearch(`${c.name} (${c.id})`);
                      setDropdownOpen(false);
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-700 ${selectedCustomer === c.id ? "bg-gray-700" : ""
                      }`}
                  >
                    {c.name} ({c.id})
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 📅 Month Picker */}
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 w-52 focus:ring-2 focus:ring-green-500 outline-none"
        />

        <button
          onClick={fetchSummary}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
        >
          Show
        </button>
      </div>

      {/* Export Buttons */}
      <div className="flex justify-end gap-3 mb-4 max-w-4xl mx-auto">
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
      <div className="overflow-x-auto mt-6 max-w-4xl mx-auto">
        <table className="min-w-full border border-gray-700 bg-[#0e1117] rounded-lg">
          <thead className="bg-green-900 text-green-200">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Litres</th>
              <th className="px-4 py-3 text-left">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              <>
                {data.map((item, i) => (
                  <tr
                    key={i}
                    className={`${i % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                      } hover:bg-gray-700 transition`}
                  >
                    <td className="px-4 py-3">
                      {new Date(item.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-4 py-3">{item.litres}</td>
                    <td className="px-4 py-3">₹{item.amount}</td>
                  </tr>
                ))}
                <tr className="bg-gray-800 font-semibold text-green-300 border-t border-gray-600">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3">{totalLitres.toFixed(2)}</td>
                  <td className="px-4 py-3">₹{totalAmount.toFixed(2)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
