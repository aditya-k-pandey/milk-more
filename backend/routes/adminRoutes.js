const router = require("express").Router();
const User = require("../models/User");
const Customer = require("../models/Customer");
const Entry = require("../models/Entry");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminAuth = require("../middleware/adminAuth");   // ✅ ADD THIS


// ---------------- ADMIN LOGIN ----------------
router.post("/login", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password)
      return res.status(400).json({ message: "Missing fields" });

    // Check user exists
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Must be admin
    if (user.role !== "admin")
      return res.status(403).json({ message: "You are not an admin." });

    // Validate password
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    // Generate admin token
    const token = jwt.sign(
      { id: user._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Admin login successful",
      token,
      user,
    });

  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: err.message });
  }
});


// ---------------- ADMIN PROTECTED APIS ----------------
router.get("/users", adminAuth, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

router.get("/customers", adminAuth, async (req, res) => {
  const customers = await Customer.find();
  res.json(customers);
});

router.put("/users/:id", adminAuth, async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

router.put("/customers/:id", adminAuth, async (req, res) => {
  const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

router.put("/entries/:id", adminAuth, async (req, res) => {
  const updated = await Entry.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

router.delete("/users/:userId/customers/:customerId", adminAuth, async (req, res) => {
  try {
    const { userId, customerId } = req.params;

    const deleted = await Customer.findOneAndDelete({
      _id: customerId,
      sellerId: userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// delete
router.delete("/:collection/:id", adminAuth, async (req, res) => {
  const modelMap = {
    users: User,
    customers: Customer,
    entries: Entry
  };

  const model = modelMap[req.params.collection];
  if (!model) return res.status(400).json({ message: "Invalid request" });

  await model.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ---------------- ADMIN PROFILE ----------------
router.get("/profile", adminAuth, async (req, res) => {
  res.json(req.user);
});

// ---------------- ADMIN GET ALL ENTRIES ----------------
router.get("/entries", adminAuth, async (req, res) => {
  try {
    const entries = await Entry.find()
      .populate("customerId", "name phone")
      .sort({ date: -1 });

    res.json({ entries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/users/:id/customers", adminAuth, async (req, res) => {
  try {
    const customers = await Customer.find({ sellerId: req.params.id });
    res.json({ customers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a customer under a specific seller


// ---------------- ADMIN: ADD CUSTOMER FOR ANY USER ----------------
router.post("/users/:userId/customers", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { id, name, phone, defaultLitres } = req.body;

    const newCustomer = await Customer.create({
      id: id.trim(),
      name,
      phone,
      defaultLitres,
      sellerId: userId,        // 🔥 Very important
    });

    res.json({ customer: newCustomer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




module.exports = router;
