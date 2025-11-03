const express = require("express");
const Entry = require("../models/Entry");
const Customer = require("../models/Customer");
const DailySummary = require("../models/DailySummary");

const router = express.Router();
const RATE = 55; // per litre

// ✅ Add new entry
router.post("/", async (req, res) => {
  try {
    const { date, customerId, litres } = req.body;

    if (!date || !customerId || litres == null) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // ✅ Find actual customer (_id)
    const customer =
      (await Customer.findOne({ id: customerId })) ||
      (await Customer.findById(customerId));
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    const entryDate = new Date(date).toISOString().slice(0, 10);
    const amount = Number(litres) * RATE;

    // ✅ Save new entry with correct ObjectId
    const e = new Entry({
      date: entryDate,
      customerId: customer.id,
      litres: Number(litres),
      amount,
    });
    await e.save();

    // ✅ Update or create today's summary
    let summary = await DailySummary.findOne({ date: entryDate });
    if (summary) {
      summary.totalLitres += Number(litres);
      summary.totalAmount += amount;
      await summary.save();
    } else {
      await DailySummary.create({
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

// ✅ Get daily entries (with populated customer info)
// inside backend/routes/entryRoutes.js (replace current /daily handler)
router.get("/daily", async (req, res) => {
  try {
    const selectedDate =
      req.query.date || new Date().toISOString().slice(0, 10);

    const entries = await Entry.find({ date: selectedDate })
      .sort({ _id: 1 })
      .lean();

    const result = await Promise.all(
      entries.map(async (e) => {
        let customerName = "Unknown";
        let customerCode = "N/A";

        try {
let c = null;
try {
  if (/^[0-9a-fA-F]{24}$/.test(e.customerId)) {
    // ✅ If it's a valid ObjectId
    c = await Customer.findById(e.customerId).lean();
  } else {
    // ✅ If it's a custom ID like "C105"
    c = await Customer.findOne({ id: e.customerId }).lean();
  }
} catch (lookupErr) {
  console.warn(`Customer lookup failed for ID: ${e.customerId}`);
}


          if (c) {
            customerName = c.name || "Unknown";
            customerCode = c.id || c._id?.toString() || "N/A";
          }
        } catch (err) {
          console.warn("Customer lookup failed:", err.message);
        }

        return {
          date: e.date,
          customerId: customerCode,
          customerName,
          litres: e.litres,
          amount: e.amount,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("Error fetching daily entries:", err);
    res.status(500).json({ error: err.message });
  }
});


// --- Monthly (query style) ---
// GET /api/entries/monthly?customerId=C101&month=10&year=2025
router.get("/monthly", async (req, res) => {
  try {
    const { customerId, month, year } = req.query;
    if (!customerId || !month || !year) {
      return res.status(400).json({ message: "Missing customerId/month/year" });
    }

    const from = new Date(Number(year), Number(month) - 1, 1).toISOString().slice(0, 10);
    const to = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);

    console.log("monthly(query) ->", { customerId, from, to });
    const rows = await Entry.find({
      customerId,
      date: { $gte: from, $lte: to },
    }).sort({ date: 1 }).lean();

    console.log("Found rows (query):", rows.length);
    return res.json(rows);
  } catch (err) {
    console.error("Error /monthly (query):", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Monthly (path style) ---
// GET /api/entries/monthly/C101/October-2025
router.get("/monthly/:customerId/:monthYear", async (req, res) => {
  try {
    const { customerId, monthYear } = req.params;
    if (!customerId || !monthYear) return res.status(400).json({ message: "Missing params" });

    const [monthName, year] = monthYear.split("-");
    const monthMap = {
      January:0, February:1, March:2, April:3, May:4, June:5,
      July:6, August:7, September:8, October:9, November:10, December:11
    };
    const idx = monthMap[monthName];
    if (idx === undefined) return res.status(400).json({ message: "Invalid monthName" });

    const from = new Date(Number(year), idx, 1).toISOString().slice(0, 10);
    const to = new Date(Number(year), idx + 1, 0).toISOString().slice(0, 10);

    console.log("monthly(path) ->", { customerId, from, to });
    const rows = await Entry.find({
      customerId,
      date: { $gte: from, $lte: to },
    }).sort({ date: 1 }).lean();

    console.log("Found rows (path):", rows.length);
    return res.json(rows);
  } catch (err) {
    console.error("Error /monthly (path):", err);
    res.status(500).json({ error: err.message });
  }
});





module.exports = router;
