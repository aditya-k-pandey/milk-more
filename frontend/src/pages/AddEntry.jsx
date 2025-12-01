import React, { useEffect, useState } from "react";
import Select from "react-select";

// ✅ use API helper instead of axios
import { getCustomers, addEntry } from "../api";

function todayLocalYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AddEntry() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    date: todayLocalYYYYMMDD(),
    customerId: "",
    litres: "",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchCustomers();
    setForm((f) => ({ ...f, date: todayLocalYYYYMMDD() }));
  }, []);

  // ✅ FIXED — use getCustomers() (token included)
  async function fetchCustomers() {
    try {
      const res = await getCustomers();
      const list = Array.isArray(res) ? res : res.data || [];
      setCustomers(list);
    } catch (err) {
      console.error("fetchCustomers error:", err);
      setMsg("Cannot load customers. Check backend.");
    }
  }

  function onCustomerChange(selectedOption) {
    if (!selectedOption) {
      setForm((f) => ({ ...f, customerId: "", litres: "" }));
      return;
    }

    const cust = customers.find(
      (c) => String(c._id) === String(selectedOption.value)
    );

    setForm((f) => ({
      ...f,
      customerId: String(selectedOption.value),   // ALWAYS MongoDB _id
      litres: cust ? String(cust.defaultLitres || "") : "",
    }));
  }


  // 🔥 FIXED — send entry using addEntry()
  async function handleSave(e) {
    e.preventDefault();
    setMsg("Saving...");

    if (!form.date || !form.customerId || form.litres === "" || form.litres == null) {
      setMsg("Please fill all fields.");
      return;
    }

    const payload = {
      date: String(form.date),
      customerId: String(form.customerId),
      litres: Number(form.litres),
    };

    if (Number.isNaN(payload.litres)) {
      setMsg("Litres must be a number.");
      return;
    }

    try {
      const res = await addEntry(payload.date, payload.customerId, payload.litres);

      if (res.success) {
        setMsg(res.message || "Saved ✓");

        const cust = customers.find(
          (c) => String(c._id || c.id) === String(form.customerId)
        );

        setForm({
          ...form,
          litres: cust ? String(cust.defaultLitres || "") : "",
          date: todayLocalYYYYMMDD(),
        });

        setTimeout(() => window.location.reload(), 100);
      } else {
        setMsg(res?.message || "Save failed.");
      }
    } catch (err) {
      console.error("save error:", err);
      setMsg(err.message || "Error saving entry.");
    }
  }

  // Convert customers into react-select options
  const customerOptions = customers.map((c) => ({
    value: String(c._id),                    // ✅ FIX: always use MongoDB _id
    label: c.id ? `${c.id} — ${c.name}` : c.name,
  }));




  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-4">
      <h1 className="text-5xl font-extrabold text-white mb-10 tracking-wide text-center">
        🥛 Milk More
      </h1>

      <div className="bg-gray-950 p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-800">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">
          Add Milk Entry
        </h2>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Customer</label>
            <Select
              options={customerOptions}
              value={customerOptions.find(
                (opt) => opt.value === form.customerId
              )}
              onChange={onCustomerChange}
              placeholder="-- Select or Search Customer --"
              isClearable
              isSearchable
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Litres</label>
            <input
              type="number"
              step="0.1"
              value={form.litres}
              onChange={(e) => setForm({ ...form, litres: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-center items-center mt-6">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition duration-200 shadow-md"
            >
              Save
            </button>
          </div>
        </form>

        {msg && <p className="text-sm text-gray-400 text-center mt-4">{msg}</p>}
      </div>
    </div>
  );
}
