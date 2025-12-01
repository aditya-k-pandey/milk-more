import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  adminGetUserCustomers,
  adminUpdateCustomer,
  adminDeleteCustomer,
  adminAddCustomerForUser,
} from "../../api";

export default function AdminUserCustomers() {
  const { userId } = useParams();
  const [customers, setCustomers] = useState([]);

  async function load() {
    const data = await adminGetUserCustomers(userId);
    setCustomers(data.customers || []);
  }

  useEffect(() => { load(); }, [userId]);

  async function handleDelete(cid) {
    if (!confirm("Delete this customer?")) return;

    try {
      await adminDeleteCustomer(userId, cid);
      setCustomers((s) => s.filter((x) => x._id !== cid));
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }


  async function editCustomer(c) {
    const name = prompt("Name", c.name);
    if (name == null) return;

    const phone = prompt("Phone", c.phone);
    if (phone == null) return;

    const id = prompt("Customer ID", c.id);
    if (id == null) return;

    const defaultLitres = prompt("Default Litres", c.defaultLitres);
    if (defaultLitres == null) return;

    const updated = await adminUpdateCustomer(c._id, {
      name,
      phone,
      id,
      defaultLitres,
    });

    setCustomers((list) =>
      list.map((x) => (x._id === c._id ? { ...x, ...updated } : x))
    );
  }

  async function createCustomer() {
  const id = prompt("Customer ID:");
  if (!id) return;

  const name = prompt("Customer Name:");
  if (!name) return;

  const phone = prompt("Phone:");
  if (!phone) return;

  const defaultLitres = prompt("Default Litres:", "1");
  if (defaultLitres == null) return;

  try {
    const newCust = await adminAddCustomerForUser(userId, {
      id,
      name,
      phone,
      defaultLitres,
    });

    setCustomers((prev) => [...prev, newCust.customer]);
  } catch (err) {
    alert(err.message || "Create failed");
  }
}


  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-4">User Customers</h1>
      <button
        className="mb-4 px-3 py-2 bg-green-600 rounded"
        onClick={createCustomer}
      >
        Add Customer
      </button>

      <table className="w-full bg-gray-900 rounded">
        <thead>
          <tr className="bg-gray-800">
            <th className="p-3">ID</th>
            <th className="p-3">Name</th>
            <th className="p-3">Phone</th>
            <th className="p-3">Default Litres</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((c) => (
            <tr key={c._id} className="border-t border-gray-700">
              <td className="p-3">{c.id}</td>
              <td className="p-3">{c.name}</td>
              <td className="p-3">{c.phone}</td>
              <td className="p-3">{c.defaultLitres}</td>
              <td className="p-3">
                <button
                  className="px-3 py-1 bg-blue-600 rounded mr-2"
                  onClick={() => editCustomer(c)}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(c._id)}
                  className="px-3 py-1 bg-red-600 rounded"
                >
                  Delete
                </button>

              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
