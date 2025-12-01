import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [newPassword, setNewPassword] = useState("");

  async function sendOtp() {
    await fetch("http://localhost:5000/api/password/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    alert("OTP sent!");
    setStep(2);
  }

  async function resetPassword() {
    await fetch("http://localhost:5000/api/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    alert("Password reset!");
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-black text-white">
      <div className="bg-gray-800 p-8 rounded-lg w-96">

        {step === 1 && (
          <>
            <h1 className="text-2xl mb-4">Forgot Password</h1>
            <input
              type="email"
              placeholder="Enter Email"
              className="w-full p-2 mb-3 rounded bg-gray-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={sendOtp}
              className="w-full bg-green-600 py-2 rounded"
            >
              Send OTP
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl mb-4">Enter OTP</h1>
            <input
              type="text"
              placeholder="OTP"
              className="w-full p-2 mb-3 rounded bg-gray-700"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              className="w-full p-2 mb-3 rounded bg-gray-700"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              onClick={resetPassword}
              className="w-full bg-blue-600 py-2 rounded"
            >
              Reset Password
            </button>
          </>
        )}
      </div>
    </div>
  );
}
