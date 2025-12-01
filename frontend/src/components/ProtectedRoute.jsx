import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const token = adminOnly
          ? localStorage.getItem("adminToken")
          : localStorage.getItem("token");

        if (!token) {
          setUser(false);
          return;
        }

        const endpoint = adminOnly
          ? "/api/admin/profile"
          : "/api/user/profile";

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );


        const data = await res.json();
        setUser(data);
      } catch {
        setUser(false);
      }
    }
    load();
  }, []);

  if (user === null) return <p className="text-white p-4">Loading...</p>;

  if (!user) {
    return <Navigate to={adminOnly ? "/admin/login" : "/login"} />;
  }


  // FIXED ADMIN CHECK
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" />;
  }


  return children;
}
