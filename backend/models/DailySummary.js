const mongoose = require("mongoose");

const dailySummarySchema = new mongoose.Schema({
  date: { type: String, required: true },
  totalLitres: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
});

module.exports = mongoose.model("DailySummary", dailySummarySchema);
