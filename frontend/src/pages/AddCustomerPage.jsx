import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AddCustomerPage() {
  const [form, setForm] = useState({
    id: "",
    name: "",
    phone: "",
    defaultLitres: 1,
    photo: null,
  });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.id || !form.name) {
      setMsg("Please fill in all required fields.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("id", form.id.toUpperCase());
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("defaultLitres", form.defaultLitres);
      if (form.photo) formData.append("photo", form.photo);

      const res = await axios.post("http://localhost:5000/api/customers", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setMsg("✅ Customer added successfully!");
        setTimeout(() => navigate("/customers"), 1000);
      } else {
        setMsg(res.data.message || "Failed to add customer.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Error while saving customer.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-3xl bg-[#111] rounded-2xl shadow-2xl p-8 border border-gray-800">
        <h1 className="text-4xl font-bold text-green-400 mb-8 text-center flex items-center justify-center gap-2">
          🧾 Add Customer
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          encType="multipart/form-data"
        >
          {/* ID */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Customer ID (e.g., C101)
            </label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              required
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Customer Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="9876543210"
            />
          </div>

          {/* Default Litres */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Default Litres</label>
            <input
              type="number"
              step="0.1"
              value={form.defaultLitres}
              onChange={(e) => setForm({ ...form, defaultLitres: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Photo Upload */}
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-300 mb-2">Upload Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg text-gray-300 p-2 cursor-pointer"
            />
          </div>

          {/* Save Button */}
          <div className="sm:col-span-2 flex justify-center mt-4">
            <button
              type="submit"
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition"
            >
              Save Customer
            </button>
          </div>
        </form>

        {msg && (
          <p className="text-center mt-6 text-sm text-gray-400 bg-gray-800 p-2 rounded-lg">
            {msg}
          </p>
        )}
      </div>

      <button
        onClick={() => navigate("/customers")}
        className="mt-6 text-green-400 hover:underline text-sm"
      >
        ← Back to Customers
      </button>
    </div>
  );
}
