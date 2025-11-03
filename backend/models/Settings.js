// backend/models/Settings.js
const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. "milkRate"
  value: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
