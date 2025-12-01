import React, { useEffect, useState } from "react";
import {
  adminGetCustomers,
  adminUpdateCustomer,
  adminDeleteCustomer,
} from "../../api";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await adminGetCustomers();
      setCustomers(data.customers || data);
    } catch (err) {
      alert(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onDelete(id) {
    if (!confirm("Delete this customer?")) return;
    try {
      await adminDeleteCustomer(id);
      setCustomers((s) => s.filter((c) => c._id !== id));
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  async function onEdit(c) {
    const name = prompt("Name", c.name);
    if (name == null) return;

    const phone = prompt("Phone", c.phone || "");
    if (phone == null) return;

    const id = prompt("Customer ID", c.id || "");
    if (id == null) return;

    const defaultLitres = prompt("Default Litres", c.defaultLitres || "");
    if (defaultLitres == null) return;

    try {
      const updated = await adminUpdateCustomer(c._id, {
        name,
        phone,
        id,
        defaultLitres,
      });

      setCustomers((s) =>
        s.map((x) => (x._id === c._id ? { ...x, ...updated } : x))
      );

      alert("Saved");
    } catch (err) {
      alert(err.message || "Update failed");
    }
  }


  const filtered = customers.filter((c) =>
    (c.name || "").toLowerCase().includes(q.toLowerCase()) ||
    (c.phone || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Customers</h1>
        <input
          className="px-3 py-2 rounded bg-gray-800 text-white"
          placeholder="Search name or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="bg-gray-800 rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan="3" className="p-6">No customers</td></tr>}
            {filtered.map((c) => (
              <tr key={c._id} className="border-t border-gray-700">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3 space-x-2">
                  <button onClick={() => onEdit(c)} className="px-3 py-1 bg-blue-600 rounded">Edit</button>
                  <button onClick={() => onDelete(c._id)} className="px-3 py-1 bg-red-600 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
