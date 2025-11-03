const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema({
  date: { type: String, required: true },
  customerId: { type: String, ref: "Customer", required: true },
  litres: { type: Number, required: true },
  amount: { type: Number, required: true },
});

module.exports = mongoose.model("Entry", entrySchema);
