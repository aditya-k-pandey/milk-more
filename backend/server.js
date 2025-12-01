// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// routes
const userRoutes = require("./routes/UserRoutes");
const dailySummaryRoutes = require("./routes/DailySummaryRoutes");
const customerRoutes = require("./routes/CustomerRoutes");
const entryRoutes = require("./routes/entryRoutes");
const paymentRoutes = require("./routes/PaymentRoutes");
const receiptRoutes = require("./routes/ReceiptRoutes");
const passwordRoutes = require("./routes/passwordRoutes");

const app = express();

// parse JSON
app.use(express.json());

// CORS: allow frontend origin (vite dev server). Use env FRONTEND_URL or default to localhost:5173
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like curl, server-to-server)
      if (!origin) return callback(null, true);
      if (origin === FRONTEND) return callback(null, true);
      // allow localhost:5173 and localhost:3000 just in case
      if (origin.includes("localhost:5173") || origin.includes("localhost:3000"))
        return callback(null, true);

      // anything else blocked
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// connect to mongo
const mongoUrl = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/milkmore";
mongoose
  .connect(mongoUrl, {
    tls: true,
    tlsAllowInvalidCertificates: false,
  })

  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("MongoDB error", err));

app.use("/api/user", userRoutes);
app.use("/api/daily", dailySummaryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/admin", require("./routes/adminRoutes"));



const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log("🚀 Server running on port", port);
});
