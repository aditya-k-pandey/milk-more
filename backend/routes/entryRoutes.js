const express = require("express");
const Entry = require("../models/Entry");
const Customer = require("../models/Customer");
const DailySummary = require("../models/DailySummary");
const auth = require("../middleware/auth");

const router = express.Router();
const RATE = 55;

// --------------------- ADD ENTRY ---------------------
router.post("/", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { date, customerId, litres } = req.body;

    if (!date || !customerId || litres == null) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Find customer under this seller
    const customer =
      (await Customer.findOne({ sellerId, id: customerId })) ||
      (await Customer.findOne({ sellerId, _id: customerId }));

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const entryDate = new Date(date).toISOString().slice(0, 10);
    const amount = Number(litres) * RATE;

    // Save entry
    const e = new Entry({
      sellerId,
      date: entryDate,
      customerId: customer._id,
      litres: Number(litres),
      amount,
    });

    await e.save();

    // Update summary (logic untouched)
    let summary = await DailySummary.findOne({ sellerId, date: entryDate });
    if (summary) {
      summary.totalLitres += Number(litres);
      summary.totalAmount += amount;
      await summary.save();
    } else {
      await DailySummary.create({
        sellerId,
        date: entryDate,
        totalLitres: Number(litres),
        totalAmount: amount,
      });
    }

    res.json({
      success: true,
      message: "Entry saved successfully",
    });
  } catch (err) {
    console.error("Error saving entry:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------- DAILY ENTRIES ---------------------
router.get("/daily", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const selectedDate =
      req.query.date || new Date().toISOString().slice(0, 10);

    const entries = await Entry.find({ sellerId, date: selectedDate })
      .populate("customerId", "id name")   // 🔥 add this
      .sort({ _id: 1 });

    res.json({
      success: true,
      data: entries
    });

  } catch (err) {
    console.error("Error fetching daily entries:", err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------- MONTHLY ENTRIES (QUERY) ---------------------
router.get("/monthly", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { customerId, month, year } = req.query;

    if (!customerId || !month || !year) {
      return res.status(400).json({ message: "Missing params" });
    }

    const from = new Date(Number(year), Number(month) - 1, 1).toISOString().slice(0, 10);
    const to = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);

    const rows = await Entry.find({
      sellerId,
      customerId,
      date: { $gte: from, $lte: to }
    }).sort({ date: 1 });

    return res.json(rows);
  } catch (err) {
    console.error("Error /monthly:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
