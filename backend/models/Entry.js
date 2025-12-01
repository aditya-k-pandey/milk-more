const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  date: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },

  litres: { type: Number, required: true },
  amount: { type: Number, required: true },
});

module.exports = mongoose.model("Entry", entrySchema);
