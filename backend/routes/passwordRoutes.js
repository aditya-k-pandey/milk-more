const express = require("express");
const router = express.Router();
const User = require("../models/User");
const nodemailer = require("nodemailer");

// temporary in-memory OTP store
const otpStore = new Map();  

// SEND OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000); // 6 digit

  otpStore.set(email, otp);

  // Email config
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "yourgmail@gmail.com",
      pass: "your-app-password",
    },
  });

  await transporter.sendMail({
    from: "Milk More",
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP is: ${otp}`,
  });

  res.json({ success: true, message: "OTP sent to email" });
});


// RESET PASSWORD
router.post("/reset", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const storedOtp = otpStore.get(email);
  if (!storedOtp || storedOtp != otp)
    return res.status(400).json({ error: "Invalid or expired OTP" });

  const user = await User.findOne({ email });
  user.password = newPassword;
  await user.save();

  otpStore.delete(email);

  res.json({ success: true, message: "Password reset successful" });
});

module.exports = router;
