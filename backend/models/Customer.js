const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },   // REMOVE unique: true
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },


    name: { type: String, required: true },
    defaultLitres: { type: Number, default: 1 },
    phone: { type: String },
    imagePath: { type: String },

    payments: {
      type: Map,
      of: Boolean, // true = paid, false = unpaid
      default: {},
    },
  },
  { timestamps: true }
);

customerSchema.index({ sellerId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model("Customer", customerSchema);
