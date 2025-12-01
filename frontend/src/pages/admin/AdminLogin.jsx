import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../api";

export default function AdminLogin() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      // ⭐ STORE ADMIN TOKEN CORRECTLY
      localStorage.setItem("adminToken", data.token);

      // OPTIONAL: remove seller token to avoid conflicts
      localStorage.removeItem("token");

      // ⭐ FIX: give browser time to write token before ProtectedRoute loads
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 10);

    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-black text-white">
      <form onSubmit={handleSubmit} className="p-10 bg-[#07101a] rounded-xl w-[420px]">
        <h2 className="text-3xl font-bold mb-6">Admin login</h2>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <label>Email or Phone</label>
        <input
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          className="w-full p-3 rounded bg-gray-800 mt-1 mb-4"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-gray-800 mt-1 mb-6"
        />

        <button className="w-full bg-green-600 py-3 rounded text-lg font-bold">
          Sign in
        </button>
      </form>
    </div>
  );
}
