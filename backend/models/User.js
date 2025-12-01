const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },

  passwordHash: { type: String },
  role: {
  type: String,
  enum: ["admin", "seller"],
  default: "seller",
},


  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
