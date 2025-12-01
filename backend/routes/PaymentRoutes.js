const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const Entry = require("../models/Entry");
const Settings = require("../models/Settings");
const auth = require("../middleware/auth");

// --------------------- GET PAID / UNPAID STATUS ---------------------
router.get("/status", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { month, year } = req.query;

    if (!month || !year)
      return res.status(400).json({ message: "Month and Year required" });

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    const payments = await Payment.find({ sellerId, month, year });
    const paidIds = payments.map((p) => p.customerId);

    // get only seller customers
    const customers = await Customer.find({ sellerId });

    const entries = await Entry.find({ sellerId });

    const monthlyEntries = entries.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === monthNum && d.getFullYear() === yearNum;
    });

    const summaryByCustomer = customers.map((c) => {
      const custEntries = monthlyEntries.filter((e) => e.customerId === c.id);
      const totalLitres = custEntries.reduce((s, e) => s + (e.litres || 0), 0);
      const totalAmount = custEntries.reduce((s, e) => s + (e.amount || 0), 0);
      return { id: c.id, name: c.name, litres: totalLitres, amount: totalAmount };
    });

    const paid = summaryByCustomer.filter((c) => paidIds.includes(c.id));
    const unpaid = summaryByCustomer.filter((c) => !paidIds.includes(c.id));

    const totalDue = unpaid.reduce((s, u) => s + u.amount, 0);

    res.json({ paid, unpaid, totalDue });
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------- MARK AS PAID ---------------------
router.post("/mark-paid", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { customerId, month, year, method } = req.body;

    if (!customerId || !month || !year)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const existing = await Payment.findOne({ sellerId, customerId, month, year });
    if (existing)
      return res.json({ success: false, message: "Already marked as paid" });

    const newPayment = new Payment({
      sellerId,
      customerId,
      month,
      year,
      method: method || "Cash",
      paid: true,
      date: new Date(),
    });

    await newPayment.save();

    const customer = await Customer.findOne({ sellerId, id: customerId });
    if (customer) {
      const monthCode = `${year}-${String(month).padStart(2, "0")}`;
      customer.payments.set(monthCode, true);
      await customer.save();
    }

    res.json({ success: true, message: "Payment marked as paid" });
  } catch (err) {
    console.error("Error marking payment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------- MARK AS UNPAID ---------------------
router.post("/mark-unpaid", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { customerId, month, year } = req.body;

    if (!customerId || !month || !year)
      return res.status(400).json({ success: false, message: "Missing fields" });

    await Payment.deleteOne({ sellerId, customerId, month, year });

    const customer = await Customer.findOne({ sellerId, id: customerId });
    if (customer) {
      const monthCode = `${year}-${String(month).padStart(2, "0")}`;
      if (customer.payments.has(monthCode)) {
        customer.payments.delete(monthCode);
        await customer.save();
      }
    }

    res.json({ success: true, message: "Payment marked as unpaid" });
  } catch (err) {
    console.error("Error marking as unpaid:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------- MILK RATE GET ---------------------
router.get("/settings/rate", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const s = await Settings.findOne({ sellerId, key: "milkRate" });
    const rate = s ? Number(s.value) : 55;
    res.json({ rate });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------- MILK RATE UPDATE ---------------------
router.put("/settings/rate", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { rate } = req.body;

    if (rate == null)
      return res.status(400).json({ success: false, message: "Rate required" });

    const r = await Settings.findOneAndUpdate(
      { sellerId, key: "milkRate" },
      { value: Number(rate) },
      { upsert: true, new: true }
    );
    res.json({ success: true, rate: Number(r.value) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------- CUSTOMER SUMMARY ---------------------
router.get("/summary/customer/:id", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    const s = await Settings.findOne({ sellerId, key: "milkRate" });
    const rate = s ? Number(s.value) : 55;

    const entries = await Entry.find({ sellerId, customerId: id });

    const totalLitres = entries.reduce((sum, e) => sum + (e.litres || 0), 0);
    const totalAmount = Number((totalLitres * rate).toFixed(2));

    const payments = await Payment.find({ sellerId, customerId: id });

    res.json({
      success: true,
      customerId: id,
      totalLitres,
      totalAmount,
      rate,
      payments,
    });
  } catch (err) {
    console.error("Error fetching customer summary:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --------------------- MONTHLY SUMMARY ---------------------
router.get("/summary/monthly", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { customerId, month, year } = req.query;

    if (!customerId || !month || !year)
      return res.status(400).json({ message: "Missing params" });

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    const entries = await Entry.find({ sellerId, customerId });

    const monthly = entries.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === monthNum && d.getFullYear() === yearNum;
    });

    const totalLitres = monthly.reduce((s, e) => s + (e.litres || 0), 0);

    const s = await Settings.findOne({ sellerId, key: "milkRate" });
    const rate = s ? Number(s.value) : 55;

    const totalAmount = Number((totalLitres * rate).toFixed(2));

    const paidRecord = await Payment.findOne({
      sellerId,
      customerId,
      month: String(monthNum),
      year: String(yearNum),
    });

    const paid = !!paidRecord;

    res.json({ customerId, totalLitres, totalAmount, rate, paid });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------- COLLECT PAYMENT ---------------------
router.post("/payments/collect", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { customerId, month, year, method, paidBy } = req.body;

    if (!customerId || !month || !year || !method)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const existing = await Payment.findOne({ sellerId, customerId, month, year });
    if (existing)
      return res.json({ success: false, message: "Already paid" });

    const payment = new Payment({
      sellerId,
      customerId,
      month,
      year,
      method,
      paid: true,
      paidBy: paidBy || null,
      date: new Date(),
    });

    await payment.save();

    const customer = await Customer.findOne({ sellerId, id: customerId });
    if (customer) {
      const monthCode = `${year}-${String(month).padStart(2, "0")}`;
      customer.payments.set(monthCode, true);
      await customer.save();
    }

    res.json({ success: true, message: "Payment recorded", payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
