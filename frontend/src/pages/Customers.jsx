// src/pages/Customers.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaUserPlus } from "react-icons/fa";
import { getCustomers } from "../api";

export default function Customers() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await getCustomers();
        console.log("customers:", res);
        setList(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("fetchCustomers error:", err);
        alert("Error fetching customers. Make sure you are logged in.");
      }
    }
    load();
  }, []);


  async function loadCustomers() {
    try {
      const res = await getCustomers(); // ✅ USE API.JS FUNCTION
      console.log("customers:", res);

      const raw = Array.isArray(res) ? res : [];

      raw.sort((a, b) => {
        const aNum = parseInt(String(a.id || "").replace(/\D/g, ""), 10);
        const bNum = parseInt(String(b.id || "").replace(/\D/g, ""), 10);

        const aHasNum = !Number.isNaN(aNum);
        const bHasNum = !Number.isNaN(bNum);

        if (aHasNum && bHasNum) return aNum - bNum;
        if (aHasNum && !bHasNum) return -1;
        if (!aHasNum && bHasNum) return 1;

        return String(a.id || "").localeCompare(String(b.id || ""), undefined, { sensitivity: "base" });
      });

      setList(raw);
    } catch (err) {
      console.log(err);
      alert("Error fetching customers");
    }
  }

  const filtered = list.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-white text-center mb-6">
        🧾 Customers
      </h1>

      <div className="flex justify-between items-center mb-6 max-w-3xl mx-auto">
        <div className="flex items-center bg-gray-900 rounded-lg px-3 w-2/3">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent w-full py-2 outline-none text-white"
          />
        </div>

        <Link
          to="/add-customer"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FaUserPlus /> Add Customer
        </Link>
      </div>

      <div className="max-w-3xl mx-auto bg-gray-950 rounded-lg shadow-lg border border-gray-800">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-6">No customers found</p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-green-900 text-green-100">
              <tr>
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Litres</th>
                <th className="py-3 px-4 text-left">Profile</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={i}
                  className={`${i % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                    } hover:bg-gray-700 transition`}
                >
                  <td className="py-3 px-4">{c.id}</td>
                  <td className="py-3 px-4">{c.name}</td>
                  <td className="py-3 px-4">{c.phone}</td>
                  <td className="py-3 px-4">{c.defaultLitres}</td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/customer/${c.id}`}
                      className="text-green-400 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
