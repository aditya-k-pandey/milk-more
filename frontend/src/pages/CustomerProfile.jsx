import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaPhoneAlt,
  FaGlassWhiskey,
  FaArrowLeft,
  FaEdit,
  FaPaperPlane,
} from "react-icons/fa";

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Default month = current month
  const [monthInput, setMonthInput] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [updated, setUpdated] = useState({
    name: "",
    phone: "",
    defaultLitres: 0,
    photo: null,
  });

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/customers/${id}`);
      setCustomer(res.data);
      setUpdated({
        name: res.data.name,
        phone: res.data.phone,
        defaultLitres: res.data.defaultLitres,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to fetch customer data");
    }
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append("name", updated.name);
      formData.append("phone", updated.phone);
      formData.append("defaultLitres", updated.defaultLitres);
      if (updated.photo) formData.append("photo", updated.photo);

      const res = await axios.put(`http://localhost:5000/api/customers/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        alert("✅ Customer updated successfully");
        setIsEditing(false);
        fetchCustomer();
      } else alert("Update failed");
    } catch (err) {
      console.error(err);
      alert("Error updating customer");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    try {
      const res = await axios.delete(`http://localhost:5000/api/customers/${id}`);
      if (res.data.success) {
        alert("✅ Customer deleted successfully");
        navigate("/customers");
      } else {
        alert("Failed to delete customer");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting customer");
    }
  };

  const handleSendReceipt = async () => {
    if (!customer?.phone) {
      alert("Customer has no phone number");
      return;
    }
    if (!monthInput) {
      alert("Please select a month first");
      return;
    }

    const [year, month] = monthInput.split("-");

    try {
      const pdfUrl = `http://localhost:5000/api/receipts/monthly-receipt?customerId=${customer.id}&month=${month}&year=${year}`;
      const message = `Hello ${customer.name}, your monthly milk receipt for ${month}-${year} is ready. 🥛\nYou can download it here: ${pdfUrl}`;

      window.open(`https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`, "_blank");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to send receipt");
    }
  };

  if (!customer)
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex items-center justify-center">
        Loading...
      </div>
    );

  const photoUrl =
    customer.photoUrl ||
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex flex-col items-center py-10 px-4 relative">
      <div className="w-full max-w-md bg-[#111] rounded-2xl shadow-2xl p-8 border border-gray-800 text-center">
        {/* Back Button */}
        <button
          onClick={() => navigate("/customers")}
          className="flex items-center gap-2 text-blue-400 hover:underline mb-4"
        >
          <FaArrowLeft /> Back to Customers
        </button>

        {/* Photo */}
        <div className="flex justify-center mb-4">
          <img
            src={photoUrl}
            alt={customer.name}
            className="w-28 h-28 rounded-full border-4 border-green-500 object-cover"
          />
        </div>

        {/* Info Section */}
        {isEditing ? (
          <div className="space-y-3 text-left">
            <label className="block text-sm text-gray-400">Name</label>
            <input
              type="text"
              value={updated.name}
              onChange={(e) => setUpdated({ ...updated, name: e.target.value })}
              className="w-full p-2 rounded bg-gray-900 border border-gray-700"
            />

            <label className="block text-sm text-gray-400">Phone</label>
            <input
              type="tel"
              value={updated.phone}
              onChange={(e) => setUpdated({ ...updated, phone: e.target.value })}
              className="w-full p-2 rounded bg-gray-900 border border-gray-700"
            />

            <label className="block text-sm text-gray-400">Default Litres</label>
            <input
              type="number"
              step="0.1"
              value={updated.defaultLitres}
              onChange={(e) => setUpdated({ ...updated, defaultLitres: e.target.value })}
              className="w-full p-2 rounded bg-gray-900 border border-gray-700"
            />

            <label className="block text-sm text-gray-400">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setUpdated({ ...updated, photo: e.target.files[0] })}
              className="w-full p-2 rounded bg-gray-900 border border-gray-700"
            />

            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={handleUpdate}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded text-white font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-green-500">{customer.name}</h2>
            <p className="text-gray-400 mt-1">ID: {customer.id}</p>


            {customer.createdAt && (
              <p className="text-gray-500 text-sm mt-1">
                🗓️ Created on:{" "}
                {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}


            <div className="mt-4 space-y-2 text-left">
              <p className="flex items-center gap-2">
                <FaPhoneAlt className="text-pink-500" />{" "}
                <span className="text-white">{customer.phone || "N/A"}</span>
              </p>
              <p className="flex items-center gap-2">
                <FaGlassWhiskey className="text-blue-400" /> Default Litres:{" "}
                <span className="text-white">{customer.defaultLitres}</span>
              </p>
            </div>

            <div className="flex justify-center gap-4 mt-6 flex-wrap">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded text-white font-semibold flex items-center gap-2"
              >
                <FaEdit /> Edit
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded text-white font-semibold flex items-center gap-2"
              >
                <FaPaperPlane /> Send Receipt
              </button>

              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded text-white font-semibold flex items-center gap-2"
              >
                🗑️ Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* ✅ Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-8 shadow-2xl w-80 text-center">
            <h3 className="text-white font-semibold text-lg mb-4">
              Select Month for Receipt
            </h3>

            <input
              type="month"
              value={monthInput}
              onChange={(e) => setMonthInput(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none mb-6"
            />

            <div className="flex justify-around">
              <button
                onClick={handleSendReceipt}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition"
              >
                Send
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-5 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
