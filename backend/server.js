require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./db");
const fs = require("fs");


const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Connect Database
connectDB();

// ✅ Middlewares
const allowedOrigins = [
  "https://milk-more.netlify.app", // your frontend domain
  "http://localhost:5173"          // for local testing
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

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
// ✅ Serve Frontend (only if dist exists)
const distPath = path.join(__dirname, "../frontend/dist");

if (process.env.NODE_ENV === "production" && fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.log("⚠️  Frontend dist folder not found. Skipping static serve.");
}




// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
