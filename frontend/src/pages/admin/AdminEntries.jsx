import React, { useEffect, useState } from "react";
import {
  adminGetEntries,
  adminUpdateEntry,
  adminDeleteEntry,
} from "../../api";

export default function AdminEntries() {
  const [entries, setEntries] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await adminGetEntries({ page: 1, limit: 200 });
      setEntries(data.entries || data);
    } catch (err) {
      alert(err.message || "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onDelete(id) {
    if (!confirm("Delete this entry?")) return;
    try {
      await adminDeleteEntry(id);
      setEntries((s) => s.filter((e) => e._id !== id));
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  async function onEdit(e) {
    const litres = prompt("Litres", e.litres);
    if (litres == null) return;
    const date = prompt("Date (YYYY-MM-DD)", e.date ? e.date.split("T")[0] : "");
    if (date == null) return;

    try {
      const updated = await adminUpdateEntry(e._id, { litres, date });
      setEntries((s) => s.map((x) => (x._id === e._id ? { ...x, ...updated } : x)));
      alert("Saved");
    } catch (err) {
      alert(err.message || "Update failed");
    }
  }

  const filtered = entries.filter((ent) => {
    const name =
      ent.customerName ||
      ent.customer?.name ||
      ent.customerId?.name ||
      "";
    return (
      name.toLowerCase().includes(q.toLowerCase()) ||
      String(ent.litres).includes(q)
    );
  });


  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Entries</h1>
        <input
          className="px-3 py-2 rounded bg-gray-800 text-white"
          placeholder="Search by customer or litres"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="bg-gray-800 rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Litres</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="4" className="p-6">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan="4" className="p-6">No entries</td></tr>}
            {!loading && filtered.map((e) => (
              <tr key={e._id} className="border-t border-gray-700">
                <td className="p-3">{e.date ? new Date(e.date).toLocaleDateString() : ""}</td>
                <td className="p-3">
                  {e.customerName ||
                    e.customer?.name ||
                    e.customerId?.name ||
                    "Unknown"}
                </td>

                <td className="p-3">{e.litres}</td>
                <td className="p-3 space-x-2">
                  <button onClick={() => onEdit(e)} className="px-3 py-1 bg-blue-600 rounded">Edit</button>
                  <button onClick={() => onDelete(e._id)} className="px-3 py-1 bg-red-600 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
