const express = require("express");
const DailySummary = require("../models/DailySummary");
const auth = require("../middleware/auth");

const router = express.Router();

// --------------------- LATEST SUMMARY ---------------------
router.get("/latest", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const latestEntry = await DailySummary.findOne({ sellerId }).sort({ date: -1 });

    if (!latestEntry) return res.status(404).json({ message: "No entries found" });
    res.json(latestEntry);
  } catch (err) {
    console.error("Error fetching latest summary:", err);
    res.status(500).json({ message: err.message });
  }
});

// --------------------- ALL SUMMARIES ---------------------
router.get("/", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const summaries = await DailySummary.find({ sellerId }).sort({ date: -1 });
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------------- ADD SUMMARY ---------------------
router.post("/", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { date, totalLitres, totalAmount } = req.body;

    const existing = await DailySummary.findOne({ sellerId, date });
    if (existing) return res.status(400).json({ message: "Summary already exists" });

    await DailySummary.create({
      sellerId,
      date,
      totalLitres,
      totalAmount,
    });

    res.status(201).json({ message: "Summary added successfully" });
  } catch (err) {
    console.error("Error adding summary:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
