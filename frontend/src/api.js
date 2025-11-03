// frontend/src/api.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function getHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
  } catch (err) {
    console.error("Health check failed:", err);
    return null;
  }
}
