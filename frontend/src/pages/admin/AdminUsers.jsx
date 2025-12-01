// src/pages/admin/AdminUsers.jsx
import { useNavigate } from "react-router-dom";

import React, { useEffect, useState } from "react";
import {
  adminGetUsers,
  adminDeleteUser,
  adminUpdateUser,
} from "../../api.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();


  // modal state
  const [editUser, setEditUser] = useState(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetUsers();
      const list = data?.users ?? data ?? [];
      setUsers(list);
    } catch (err) {
      setError(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this user?")) return;
    try {
      await adminDeleteUser(id);
      setUsers((prev) => prev.filter((u) => (u._id ?? u.id) !== id));
    } catch (err) {
      alert(err?.message || "Failed to delete");
    }
  }

  async function saveUser() {
    try {
      await adminUpdateUser(editUser._id, {
        name: editUser.name,
        phone: editUser.phone,
        role: editUser.role,
      });

      setUsers((prev) =>
        prev.map((u) => (u._id === editUser._id ? editUser : u))
      );

      alert("User updated");
      setEditUser(null);
    } catch (err) {
      alert(err?.message || "Update failed");
    }
  }

  const filtered = users.filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Manage Users</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name / email / phone"
          className="px-4 py-3 bg-gray-800 rounded w-80"
        />
      </div>

      {error && <div className="mb-4 text-red-400">Error: {error}</div>}

      <div className="bg-[#0f1724] border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800 text-left text-white">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Role</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-300">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u._id || u.id} className="border-t border-gray-700">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold">{u.name}</div>
                      {u.role === "admin" && (
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                          admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">{u.phone}</td>
                  <td className="p-4">{u.role}</td>
                  <td className="p-4">

                    <button
                      onClick={() => navigate(`/admin/users/${u._id}/customers`)}
                      className="px-3 py-1 bg-purple-600 rounded mr-2"
                    >
                      Customers
                    </button>

                    <button
                      className="px-3 py-2 mr-2 bg-blue-600 rounded text-white"
                      onClick={() => setEditUser(u)}
                    >
                      Edit
                    </button>


                    <button
                      className="px-3 py-2 bg-red-600 rounded text-white"
                      onClick={() => handleDelete(u._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* -------- EDIT MODAL -------- */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[#111] p-6 rounded-xl w-[350px]">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>

            <label className="block mb-2 text-gray-300">Name</label>
            <input
              className="w-full p-2 rounded bg-gray-800 mb-4"
              value={editUser.name}
              onChange={(e) =>
                setEditUser({ ...editUser, name: e.target.value })
              }
            />

            <label className="block mb-2 text-gray-300">Phone</label>
            <input
              className="w-full p-2 rounded bg-gray-800 mb-4"
              value={editUser.phone}
              onChange={(e) =>
                setEditUser({ ...editUser, phone: e.target.value })
              }
            />

            <label className="block mb-2 text-gray-300">Role</label>
            <select
              className="w-full p-2 rounded bg-gray-800 mb-4"
              value={editUser.role}
              onChange={(e) =>
                setEditUser({ ...editUser, role: e.target.value })
              }
            >
              <option value="admin">Admin</option>
              <option value="seller">Seller</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditUser(null)}
                className="px-3 py-1 bg-gray-600 rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveUser}
                className="px-3 py-1 bg-green-600 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
