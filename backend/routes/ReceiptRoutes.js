const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const Entry = require("../models/Entry");
const Customer = require("../models/Customer");
const path = require("path");
const fs = require("fs");

// 🧾 Beautiful Monthly Receipt PDF (centered columns + proper ₹ glyph via Unicode font)
router.get("/monthly-receipt", async (req, res) => {
  try {
    const { customerId, month, year } = req.query;
    if (!customerId || !month || !year) {
      return res.status(400).json({ message: "Missing required params" });
    }

    const customer = await Customer.findOne({ id: customerId });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const monthStr = String(month).padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split("T")[0];


    // keep your date string logic (ISO-like)
    const entries = await Entry.find({
      customerId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    if (!entries.length)
      return res.status(404).json({ message: "No entries found for this month" });

    const totalLitres = entries.reduce((sum, e) => sum + (e.litres || 0), 0);
    const totalAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0);

    // ---------------- PDF SETUP ----------------
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=${customerId}_${monthStr}_${year}.pdf`
    );

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // try to register a Unicode font (for ₹). Put DejaVuSans.ttf in backend/assets/fonts/
    const fontPath = path.join(__dirname, "..", "assets", "fonts", "DejaVuSans.ttf");
    let useUnicodeFont = false;
    if (fs.existsSync(fontPath)) {
      doc.registerFont("DejaVu", fontPath);
      useUnicodeFont = true;
      doc.font("DejaVu");
    } else {
      // fallback to default
      doc.font("Helvetica");
    }

    doc.pipe(res);

    // ---------- LOGO + HEADER ----------
    const logoPath = path.join(__dirname, "..", "assets", "milk-logo.png");
    try { if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 40, { width: 56, height: 56 }); } catch (err) { /* ignore */ }

    doc
      .fontSize(28)
      .fillColor("#2E8B57")
      .font(useUnicodeFont ? "DejaVu" : "Helvetica-Bold")
      .text("Milk More", 120, 48, { continued: false });

    doc
      .font(useUnicodeFont ? "DejaVu" : "Helvetica")
      .fontSize(12)
      .fillColor("#666")
      .text("Fresh Milk", 120, 78);

    // Divider
    // ---------- TITLE (center) ----------
    const monthLabel = new Date(Number(year), Number(month) - 1, 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    doc.moveDown(1);
    doc
      .font(useUnicodeFont ? "DejaVu" : "Helvetica-Bold")
      .fontSize(20)
      .fillColor("#2E8B57")
      .text("Monthly Receipt", { align: "center" });

    // straight divider line directly under title
    const titleY = doc.y + 5;
    doc.moveTo(50, titleY).lineTo(545, titleY).lineWidth(2).stroke("#2E8B57");

    doc
      .moveDown(0.5)
      .font(useUnicodeFont ? "DejaVu" : "Helvetica")
      .fontSize(12)
      .fillColor("#000")
      .text(`Month: ${monthLabel}`, { align: "center" });

    doc.moveDown(0.8);

    // ---------- CUSTOMER DETAILS (left) ----------
    const leftX = 50;
    doc
      .font(useUnicodeFont ? "DejaVu" : "Helvetica-Bold")
      .fontSize(13)
      .fillColor("#2E8B57")
      .text("Customer Details", leftX);

    doc
      .font(useUnicodeFont ? "DejaVu" : "Helvetica")
      .fontSize(11)
      .fillColor("#000")
      .moveDown(0.2)
      .text(`Name: ${customer.name}`, leftX)
      .text(`Customer ID: ${customer.id}`, leftX)
      .text(`Phone: ${customer.phone || "N/A"}`, leftX);

    doc.moveDown(0.6);

    // ---------- TABLE HEADER ----------
    const tableTop = doc.y + 6;
    const tableX = 50;
    const tableW = 495;

    // define column widths (sum <= tableW)
    const colWidths = { date: 140, litres: 110, rate: 125, amount: 120 };
    const colX = {
      date: tableX + 10,
      litres: tableX + 10 + colWidths.date,
      rate: tableX + 10 + colWidths.date + colWidths.litres,
      amount: tableX + 10 + colWidths.date + colWidths.litres + colWidths.rate,
    };

    // header background
    doc.rect(tableX, tableTop - 6, tableW, 28).fill("#2E8B57");

    // header labels centered in each column
    doc
      .font(useUnicodeFont ? "DejaVu" : "Helvetica-Bold")
      .fontSize(11)
      .fillColor("#FFFFFF")
      .text("Date", colX.date, tableTop, { width: colWidths.date, align: "center" })
      .text("Litres", colX.litres, tableTop, { width: colWidths.litres, align: "center" })
      .text("Rate per Litre (₹)", colX.rate, tableTop, { width: colWidths.rate, align: "center" })
      .text("Amount (₹)", colX.amount, tableTop, { width: colWidths.amount, align: "center" });

    // ---------- TABLE BODY ----------
    let y = tableTop + 34;
    const rowH = 24;
    doc.font(useUnicodeFont ? "DejaVu" : "Helvetica").fontSize(11).fillColor("#000");

    entries.forEach((e, i) => {
      const bg = i % 2 === 0 ? "#F7F7F7" : "#FFFFFF";
      const d = new Date(e.date);
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const dateStr = `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;

      const rate = (e.litres && e.amount) ? (e.amount / e.litres) : 0;

      // row background
      doc.rect(tableX, y - 6, tableW, rowH).fill(bg).stroke();

      // center aligned cells
      doc.fillColor("#000")
        .text(dateStr, colX.date, y - 2, { width: colWidths.date, align: "center" })
        .text(e.litres != null ? e.litres.toFixed(2) : "0.00", colX.litres, y - 2, { width: colWidths.litres, align: "center" });

      // amount & rate formatting
      const rateText = useUnicodeFont ? `₹${rate.toFixed(2)}` : `Rs. ${rate.toFixed(2)}`;
      const amountText = useUnicodeFont
        ? `₹${(e.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
        : `Rs. ${(e.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

      doc.text(rateText, colX.rate, y - 2, { width: colWidths.rate, align: "center" })
        .text(amountText, colX.amount, y - 2, { width: colWidths.amount, align: "center" });

      y += rowH;

      // page break guard
      if (y > doc.page.height - 140) {
        doc.addPage();
        y = 80;
      }
    });

    // ---------- TOTALS BOX ----------
    y += 12;
    const totalsBoxX = 320;
    const totalsBoxW = 225;
    const totalsBoxH = 60;

    doc.roundedRect(totalsBoxX, y, totalsBoxW, totalsBoxH, 4).fill("#EAF7EC").stroke();
    doc.font(useUnicodeFont ? "DejaVu" : "Helvetica-Bold").fontSize(12).fillColor("#2E8B57")
      .text("Total Litres:", totalsBoxX + 12, y + 10)
      .font(useUnicodeFont ? "DejaVu" : "Helvetica-Bold").fillColor("#000")
      .text(`${totalLitres.toFixed(2)} L`, totalsBoxX + 120, y + 10, { width: 80, align: "right" });

    const totalAmountText = useUnicodeFont
      ? `₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      : `Rs. ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    doc.font(useUnicodeFont ? "DejaVu" : "Helvetica-Bold").fontSize(12).fillColor("#2E8B57")
      .text("Total Amount:", totalsBoxX + 12, y + 32)
      .font(useUnicodeFont ? "DejaVu" : "Helvetica-Bold").fillColor("#000")
      .text(totalAmountText, totalsBoxX + 120, y + 32, { width: 80, align: "right" });

    // finish PDF (no footer weird chars)
    doc.end();
  } catch (err) {
    console.error("Receipt generation error:", err);
    res.status(500).json({ message: "Error generating receipt" });
  }
});

module.exports = router;
