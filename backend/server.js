require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Connect Database
connectDB();

// ✅ Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Route Imports
const customerRoutes = require("./routes/CustomerRoutes");
const entryRoutes = require("./routes/entryRoutes");
const dailySummaryRoutes = require("./routes/DailySummaryRoutes");
const receiptRoutes = require("./routes/ReceiptRoutes"); // <-- ✅ ADD THIS
const paymentRoutes = require("./routes/PaymentRoutes");


// ✅ Use Routes
app.use("/api/customers", customerRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/daily-summary", dailySummaryRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/payments", paymentRoutes); 

// ✅ Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "API running fine", time: new Date() });
});

// ✅ Serve Frontend (for production build)
// ✅ Serve Frontend (for production build)
// Serve Frontend (production build) — Vite uses "dist"
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // named wildcard route compatible with path-to-regexp v6 / Express v5
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

}



// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
