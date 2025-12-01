const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// REGISTER
const sanitize = (v) => v?.trim().replace(/,$/, "");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const cleanEmail = sanitize(email);
    const cleanPhone = sanitize(phone);
    const cleanName  = sanitize(name);
    const cleanPassword = (password || "").trim();

    const hash = await bcrypt.hash(cleanPassword, 10);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash: hash
    });

    res.json({ message: "User created", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// LOGIN
// LOGIN
router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN ROUTE HIT");      // 👈 ADD THIS LINE
    console.log("REQ BODY:", req.body);  // (Already correct)

    let { emailOrPhone, password } = req.body;
    emailOrPhone = (emailOrPhone || "").trim().replace(/,$/, "");
    const cleanPassword = (password || "").trim();

    if (!emailOrPhone || !cleanPassword)
      return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!match) return res.status(400).json({ error: "Wrong password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ message: "Login success", token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});





// GET PROFILE
router.get("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE PROFILE
router.put("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { name, phone } = req.body;

    const updated = await User.findByIdAndUpdate(
      decoded.id,
      { name, phone },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DEBUG compare route — remove after debug
router.post("/_debug/compare", async (req, res) => {
  try {
    const { plain, id } = req.body;
    if (!plain || !id) return res.status(400).json({ ok: false, error: "need plain + id" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ ok: false, error: "user not found" });

    const ok = await bcrypt.compare((plain||"").trim(), user.passwordHash);
    res.json({ ok, hash: user.passwordHash });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});



module.exports = router;
