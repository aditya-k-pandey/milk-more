const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");

const auth = require("../middleware/auth");
const Entry = require("../models/Entry");
const Customer = require("../models/Customer");

/* ----------------------------- Helpers ----------------------------- */

// Format Date (dd-MMM-yyyy)
function fmt(d) {
  const x = new Date(d);
  if (isNaN(x)) return "";
  return x.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// First & Last day of month
function monthRange(year, month) {
  const m = month - 1;
  return {
    start: new Date(year, m, 1),
    end: new Date(year, m + 1, 1),
  };
}

// MonthlySummary Header Style
function addPDFHeader(doc) {
  doc
    .fontSize(30)
    .fillColor("#2E8B57")
    .text("Milk More", { align: "center" });

  doc
    .fontSize(14)
    .fillColor("#555")
    .text("Fresh Milk", { align: "center" });

  doc.moveDown(1);
}

// Table header
function drawTableHeader(doc, y) {
  doc
    .fontSize(14)
    .fillColor("#2E8B57")
    .text("Date", 60, y)
    .text("Litres", 230, y, { width: 100 })
    .text("Amount (₹)", 380, y);

  doc.moveTo(50, y + 18).lineTo(550, y + 18).stroke("#2E8B57");

  return y + 30;
}

// Table rows (with padding like MonthlySummary)
function drawTableRows(doc, entries, startY) {
  let y = startY;
  let totalLitres = 0;
  let totalAmount = 0;

  doc.fontSize(12).fillColor("#000");

  entries.forEach((e, i) => {
    const rowY = y + i * 25;

    doc.text(fmt(e.date), 60, rowY);
    doc.text(e.litres.toString(), 240, rowY, { width: 100 });
    doc.text(`₹${e.amount}`, 380, rowY);

    totalLitres += e.litres;
    totalAmount += e.amount;
  });

  return {
    endY: y + entries.length * 25 + 10,
    totalLitres,
    totalAmount,
  };
}

/* -------------------------------------------------------------------
    1️⃣  AUTHENTICATED IN-APP RECEIPT
--------------------------------------------------------------------*/
router.get("/monthly-receipt", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { customerId, month, year } = req.query;

    if (!customerId || !month || !year)
      return res.status(400).json({ message: "Missing params" });

    // Correct customer for this seller
    const customer =
      await Customer.findOne({ sellerId, _id: customerId }) ||
      await Customer.findOne({ sellerId, id: customerId });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // compute start/end as Dates (already present)
    const { start, end } = monthRange(year, month);

    // convert to YYYY-MM-DD strings because Entry.date is stored as string
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    // query using string range
    const entries = await Entry.find({
      sellerId,
      customerId: customer._id,
      date: { $gte: startStr, $lt: endStr }
    }).sort({ date: 1 });


    // PDF response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${customerId}.pdf`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    addPDFHeader(doc);

    const monthName = new Date(year, month - 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    doc
      .fontSize(18)
      .fillColor("#2E8B57")
      .text("Monthly Receipt", { align: "center" })
      .moveDown();

    doc
      .fontSize(13)
      .fillColor("#000")
      .text(`Customer: ${customer.name}`)
      .text(`Customer ID: ${customer.id}`)
      .text(`Phone: ${customer.phone}`)
      .text(`Month: ${monthName}`)
      .moveDown();

    let y = drawTableHeader(doc, doc.y);
    const { endY, totalLitres, totalAmount } = drawTableRows(doc, entries, y);

    // Totals - matching MonthlySummary
    doc
      .fontSize(15)
      .fillColor("#2E8B57")
      .text(`Total Litres: ${totalLitres}`, 60, endY + 15)
      .text(`Total Amount: ₹${totalAmount}`, 60, endY + 40);

    doc.moveDown().fontSize(12).fillColor("#444").text("Thank you!", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("Receipt error:", err);
    res.status(500).json({ message: "Error generating receipt" });
  }
});

/* -------------------------------------------------------------------
    2️⃣  PUBLIC WHATSAPP RECEIPT
--------------------------------------------------------------------*/
router.get("/monthly-receipt-public", async (req, res) => {
  try {
    const { sellerId, customerId, month, year } = req.query;

    if (!sellerId || !customerId || !month || !year)
      return res.status(400).json({ message: "Missing params" });

    // Must match correct seller
    // extract from query

    // Convert sellerId string → ObjectId
    const sellerObjId = new mongoose.Types.ObjectId(sellerId);

    // 1️⃣ Try find by string customerId (C101)
    let customer = await Customer.findOne({
      sellerId: sellerObjId,
      id: customerId
    });

    // 2️⃣ If not found, try MongoDB _id
    if (!customer && mongoose.isValidObjectId(customerId)) {
      customer = await Customer.findOne({
        sellerId: sellerObjId,
        _id: customerId
      });
    }

    // If still not found → return clean error
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }




    const { start, end } = monthRange(year, month);

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const entries = await Entry.find({
      sellerId: sellerObjId,
      customerId: customer._id,
      date: { $gte: startStr, $lt: endStr }
    }).sort({ date: 1 });


    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=receipt-${customer.id}-${month}-${year}.pdf`
    );

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    addPDFHeader(doc);

    const monthName = new Date(year, month - 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    doc
      .fontSize(18)
      .fillColor("#2E8B57")
      .text("Monthly Receipt", { align: "center" })
      .moveDown();

    doc
      .fontSize(13)
      .fillColor("#000")
      .text(`Customer: ${customer.name}`)
      .text(`Customer ID: ${customer.id}`)
      .text(`Phone: ${customer.phone}`)
      .text(`Month: ${monthName}`)
      .moveDown();

    let y = drawTableHeader(doc, doc.y);
    const { endY, totalLitres, totalAmount } = drawTableRows(doc, entries, y);

    doc
      .fontSize(15)
      .fillColor("#2E8B57")
      .text(`Total Litres: ${totalLitres}`, 60, endY + 15)
      .text(`Total Amount: ₹${totalAmount}`, 60, endY + 40);

    doc.moveDown().fontSize(12).fillColor("#444").text("Thank you!", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("PUBLIC receipt error:", err);
    res.status(500).json({ message: "Error generating receipt" });
  }
});

module.exports = router;
