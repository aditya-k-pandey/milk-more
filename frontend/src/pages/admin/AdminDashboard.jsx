import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaUserEdit, FaListAlt, FaSignOutAlt } from "react-icons/fa";

export default function AdminDashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/admin/login");
  }

  const items = [
    {
      title: "Manage Users",
      desc: "View, edit, delete sellers",
      icon: <FaUsers size={28} />,
      link: "/admin/users",
    },
    {
      title: "Manage Customers",
      desc: "Update customer information",
      icon: <FaUserEdit size={28} />,
      link: "/admin/customers",
    },
    {
      title: "Manage Entries",
      desc: "Modify milk entries",
      icon: <FaListAlt size={28} />,
      link: "/admin/entries",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] px-6 py-10 text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold tracking-wide">Admin Dashboard</h1>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => navigate(item.link)}
            className="cursor-pointer bg-[#162032] border border-gray-700 rounded-2xl p-7 shadow-lg 
                       hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="text-green-400">{item.icon}</div>
              <h2 className="text-2xl font-semibold">{item.title}</h2>
            </div>

            <p className="text-gray-300 text-lg">{item.desc}</p>
          </div>
        ))}

      </div>
    </div>
  );
}
