const express = require("express");
const multer = require("multer");
const path = require("path");
const Customer = require("../models/Customer");
const auth = require("../middleware/auth");

const router = express.Router();

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// --------------------- ADD CUSTOMER ---------------------
router.post("/", auth, upload.single("photo"), async (req, res) => {
  console.log("REQ BODY:", req.body);

  try {
    const { id, name, phone, defaultLitres } = req.body;

    if (!id || id.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const newCustomer = {
      id: id.trim(),
      name,
      phone,
      defaultLitres,
      // If admin sends sellerId, use that. Otherwise use logged-in user.
      sellerId: req.user.role === "admin" && req.body.sellerId
        ? req.body.sellerId
        : req.user.id,

      photoUrl: req.file ? `/uploads/${req.file.filename}` : "",
    };

    const created = await Customer.create(newCustomer);

    res.json({
      success: true,
      data: created,
      message: "Customer added successfully",
    });
  } catch (err) {
    console.error("Error adding customer:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});



// --------------------- GET ALL CUSTOMERS ---------------------
router.get("/", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const customers = await Customer.find({ sellerId });
    res.json(customers);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// --------------------- GET SINGLE CUSTOMER ---------------------
router.get("/:id", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const id = req.params.id;

    const customer =
      (await Customer.findOne({ sellerId, id })) ||
      (await Customer.findOne({ sellerId, _id: id }));

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    res.json(customer);
  } catch (err) {
    console.error("Error fetching customer:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------- UPDATE CUSTOMER ---------------------
router.put("/:id", auth, upload.single("photo"), async (req, res) => {
  try {
    const sellerId = req.user.id;
    const id = req.params.id;
    const { name, address, phone } = req.body;

    const updateData = { name, address, phone };
    if (req.file) updateData.imagePath = `/uploads/${req.file.filename}`;

    const customer =
      (await Customer.findOneAndUpdate({ sellerId, id }, updateData, { new: true })) ||
      (await Customer.findOneAndUpdate({ sellerId, _id: id }, updateData, { new: true }));

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    res.json({ success: true, message: "Customer updated", data: customer });
  } catch (err) {
    console.error("Error updating customer:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------- DELETE CUSTOMER ---------------------
router.delete("/:id", auth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const id = req.params.id;

    const deleted =
      (await Customer.findOneAndDelete({ sellerId, id })) ||
      (await Customer.findOneAndDelete({ sellerId, _id: id }));

    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Error deleting customer:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
