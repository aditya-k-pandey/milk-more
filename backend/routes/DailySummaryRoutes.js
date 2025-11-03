const express = require("express");
const DailySummary = require("../models/DailySummary");
const router = express.Router();

// ✅ Get latest summary
router.get("/latest", async (req, res) => {
  try {
    const latestEntry = await DailySummary.findOne().sort({ date: -1 }).limit(1);
    if (!latestEntry) return res.status(404).json({ message: "No entries found" });
    res.json(latestEntry);
  } catch (err) {
    console.error("Error fetching latest summary:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get all summaries
router.get("/", async (req, res) => {
  try {
    const summaries = await DailySummary.find().sort({ date: -1 });
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Add new summary
router.post("/", async (req, res) => {
  try {
    const { date, totalLitres, totalAmount } = req.body;
    if (!date) return res.status(400).json({ message: "Date is required" });

    const existing = await DailySummary.findOne({ date });
    if (existing) return res.status(400).json({ message: "Summary already exists" });

    const newSummary = new DailySummary({ date, totalLitres, totalAmount });
    await newSummary.save();

    res.status(201).json({ message: "Summary added successfully" });
  } catch (err) {
    console.error("Error adding summary:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update summary by date
router.put("/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { totalLitres, totalAmount } = req.body;

    const updated = await DailySummary.findOneAndUpdate(
      { date },
      { totalLitres, totalAmount },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Summary not found" });

    res.json({ message: "Summary updated", updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete summary by date
router.delete("/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const deleted = await DailySummary.findOneAndDelete({ date });

    if (!deleted) return res.status(404).json({ message: "Summary not found" });
    res.json({ message: "Summary deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
