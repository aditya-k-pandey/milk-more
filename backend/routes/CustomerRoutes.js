const express = require("express");

const multer = require("multer");
const path = require("path");
const Customer = require("../models/Customer");


const router = express.Router();

// ✅ Setup multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Add a new customer
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const { id, name, address, phone } = req.body;
    if (!id || !name)
      return res.status(400).json({ success: false, message: "Missing fields" });

    // prevent duplicate IDs
    const existing = await Customer.findOne({ id });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Customer ID already exists" });

    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const newCustomer = new Customer({ id, name, address, phone, photo });
    await newCustomer.save();

    res.json({ success: true, message: "Customer added successfully", data: newCustomer });
  } catch (err) {
    console.error("Error adding customer:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Get all customers
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.json(customers);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// ✅ Get single customer by MongoDB _id or custom id
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const customer =
      (await Customer.findOne({ id })) || (await Customer.findById(id));
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

// ✅ Update customer
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const id = req.params.id;
    const { name, address, phone } = req.body;

    const updateData = { name, address, phone };
    if (req.file) updateData.photo = `/uploads/${req.file.filename}`;

    const customer =
      (await Customer.findOneAndUpdate({ id }, updateData, { new: true })) ||
      (await Customer.findByIdAndUpdate(id, updateData, { new: true }));

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

// ✅ Mark customer as paid for a specific month
router.put("/:id/pay", async (req, res) => {
  try {
    const { month } = req.body; // Example: "2025-11"
    if (!month) {
      return res.status(400).json({ success: false, message: "Month required" });
    }

    const customer = await Customer.findOne({ id: req.params.id });
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // ✅ Update or create payment record for that month
    customer.payments.set(month, true);
    await customer.save();

    res.json({ success: true, message: "Payment updated successfully", data: customer });
  } catch (err) {
    console.error("Error marking payment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ Delete customer
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const customer =
      (await Customer.findOneAndDelete({ id })) || (await Customer.findByIdAndDelete(id));

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Error deleting customer:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Mark as paid
router.put("/:id/pay", async (req, res) => {
  try {
    const { month } = req.body;
    const customer = await Customer.findOne({ id: req.params.id });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    customer.payments = customer.payments || {};
    customer.payments[month] = true;
    await customer.save();

    res.json({ success: true, message: "Payment marked as paid", data: customer });
  } catch (err) {
    console.error("Error marking as paid:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Mark as unpaid
router.put("/:id/unpay", async (req, res) => {
  try {
    const { month } = req.body;
    const customer = await Customer.findOne({ id: req.params.id });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    if (customer.payments && customer.payments[month]) {
      delete customer.payments[month];
      await customer.save();
    }

    res.json({ success: true, message: "Payment reverted to unpaid", data: customer });
  } catch (err) {
    console.error("Error marking as unpaid:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
