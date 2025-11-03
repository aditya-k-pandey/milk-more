const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  month: { type: String, required: true },
  year: { type: String, required: true },
  paid: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", PaymentSchema);
