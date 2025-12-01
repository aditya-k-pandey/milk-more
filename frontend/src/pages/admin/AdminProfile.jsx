import { useEffect, useState } from "react";
import { getAdminProfile } from "../../api";

export default function AdminProfile() {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    loadAdmin();
  }, []);

  async function loadAdmin() {
    const data = await getAdminProfile();
    setAdmin(data);
  }

  if (!admin) return <p className="text-white p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-black flex justify-center mt-10 px-4">
      <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-lg text-white shadow-xl">

        {/* ADMIN BADGE */}
        <div className="flex justify-center mb-4">
          <span className="px-4 py-1 bg-red-600 text-white rounded-full text-sm">
            ADMIN
          </span>
        </div>

        <h1 className="text-3xl font-bold text-center">{admin.name}</h1>
        <p className="text-center text-gray-300">{admin.email}</p>

        <p className="text-center text-gray-400 mt-2">
          Joined: {new Date(admin.createdAt).toDateString()}
        </p>

        <hr className="border-gray-600 my-6"/>

        <p><b>Email:</b> {admin.email}</p>
        <p><b>Phone:</b> {admin.phone}</p>

      </div>
    </div>
  );
}
