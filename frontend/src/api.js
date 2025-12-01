// frontend/src/api.js
import axios from "axios";


const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ---------------- HELPERS ----------------

function getToken() {
  return (
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token")
  );
}


async function authFetch(url, options = {}) {
  const token = options.admin
    ? localStorage.getItem("adminToken")
    : localStorage.getItem("token");



  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // 🟢 Parse response safely
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  // 🟠 Handle errors properly
  // 🟠 Handle errors properly
  if (!res.ok) {
    console.error("❌ API ERROR:", data);

    // remove tokens on unauthorized
    if (res.status === 401) {
      // remove both tokens so user is forced to login again
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
    }

    // convert error payload to thrown message so caller sees it
    throw new Error(data?.message || data?.error || "Request failed");
  }

  return data;
}

// ---------------- AUTH API ----------------

export async function registerUser(name, email, phone, password) {
  return authFetch(`${API_BASE}/api/user/register`, {
    method: "POST",
    body: JSON.stringify({ name, email, phone, password }),
  });
}

export async function loginUser({ emailOrPhone, password }) {
  try {
    const data = await authFetch(`${API_BASE}/api/user/login`, {
      method: "POST",
      body: JSON.stringify({ emailOrPhone, password }),
    });

    localStorage.setItem("token", data.token);
    return data.user;
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err.message);
    throw err;
  }
}

export function logoutUser() {
  localStorage.removeItem("token");
}

// ---------------- CUSTOMERS ----------------

export async function getCustomers() {
  return authFetch(`${API_BASE}/api/customers`, {
    method: "GET",
  });
}


export async function addCustomer(formData) {
  try {
    const res = await axios.post(
      "http://localhost:5000/api/customers",
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error("addCustomer error:", err);
    throw err;
  }
}



export async function updateCustomer(id, formData) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/customer/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Request failed");
  }

  return res.json();
}

export async function deleteCustomer(id) {
  return authFetch(`${API_BASE}/api/customer/${id}`, {
    method: "DELETE",
  });
}

// ---------------- ENTRIES ----------------

export async function addEntry(date, customerId, litres) {
  return authFetch(`${API_BASE}/api/entries`, {
    method: "POST",
    body: JSON.stringify({ date, customerId, litres }),
  });
}


export async function getDailyEntries(date) {
  return authFetch(`${API_BASE}/api/entries/daily?date=${date}`);
}


export async function getMonthlyEntries(customerId, month, year) {
  return authFetch(
    `${API_BASE}/api/entries/monthly?customerId=${encodeURIComponent(customerId)}&month=${month}&year=${year}`
  );
}


// ---------------- SUMMARY ----------------

export async function getLatestSummary() {
  return authFetch(`${API_BASE}/api/daily/latest`);
}

export async function getAllSummaries() {
  return authFetch(`${API_BASE}/api/daily`);
}

// ---------------- PAYMENTS ----------------

export async function getPaymentStatus(month, year) {
  return authFetch(
    `${API_BASE}/api/payment/status?month=${month}&year=${year}`
  );
}

export async function markPaid(customerId, month, year, method = "Cash") {
  return authFetch(`${API_BASE}/api/payment/mark-paid`, {
    method: "POST",
    body: JSON.stringify({ customerId, month, year, method }),
  });
}

export async function markUnpaid(customerId, month, year) {
  return authFetch(`${API_BASE}/api/payment/mark-unpaid`, {
    method: "POST",
    body: JSON.stringify({ customerId, month, year }),
  });
}

// ---------------- HEALTH CHECK ----------------

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

// ---------------- USER PROFILE ----------------

export async function getSellerProfile() {
  return authFetch(`${API_BASE}/api/user/profile`);
}

export async function updateSellerProfile(data) {
  return authFetch(`${API_BASE}/api/user/profile`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// 2FA Step 1 — Start login (verify password + send OTP)
export async function startLogin2FA({ emailOrPhone, password }) {
  const res = await fetch(`${API_BASE}/api/2fa/start-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrPhone, password }),
  });
  return res.json();
}

// 2FA Step 2 — Verify OTP
export async function verifyLoginOTP({ emailOrPhone, otp }) {
  const res = await fetch(`${API_BASE}/api/2fa/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrPhone, otp }),
  });
  return res.json();
}

export async function getAdminProfile() {
  const token = localStorage.getItem("adminToken");

  const res = await fetch(`${API_BASE}/api/admin/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.json();
}

// get admin token
function getAdminToken() {
  return localStorage.getItem("adminToken");
}

// fetch wrapper for admin routes
async function adminFetch(url, options = {}) {
  const token = getAdminToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  let data = null;

  try {
    data = await res.json();
  } catch { }

  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Admin access only");
  }

  return data;
}

// Admin API (add to frontend/src/api.js)
export async function adminGetUsers() {
  return authFetch(`${API_BASE}/api/admin/users`, {
    method: "GET",
    admin: true
  });
}

export async function adminUpdateUser(id, data) {
  return authFetch(`${API_BASE}/api/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    admin: true
  });
}


export async function adminDeleteUser(id) {
  return authFetch(`${API_BASE}/api/admin/users/${id}`, {
    method: "DELETE",
    admin: true
  });
}

export async function adminGetCustomers() {
  return authFetch(`${API_BASE}/api/admin/customers`, {
    method: "GET",
    admin: true,   // ⭐ use adminToken
  });
}


// ---------------- ADMIN API ----------------

export async function adminUpdateCustomer(id, formData) {
  return authFetch(`${API_BASE}/api/admin/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(formData),
    admin: true,
  });
}


export async function adminDeleteCustomer(userId, customerId) {
  return authFetch(`/admin/users/${userId}/customers/${customerId}`, {
    method: "DELETE",
  });
}


export async function adminGetEntries({ page = 1, limit = 50, q = "" } = {}) {
  const query = new URLSearchParams({ page, limit, q }).toString();
  return authFetch(`${API_BASE}/api/admin/entries?${query}`, {
    method: "GET",
    admin: true,   // ⭐ required
  });
}

export async function adminUpdateEntry(id, data) {
  return authFetch(`${API_BASE}/api/admin/entry/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    admin: true,   // ⭐ required
  });
}

export async function adminDeleteEntry(id) {
  return authFetch(`${API_BASE}/api/admin/entry/${id}`, {
    method: "DELETE",
    admin: true,   // ⭐ required
  });
}

export async function adminGetUserCustomers(userId) {
  return authFetch(`${API_BASE}/api/admin/users/${userId}/customers`, {
    method: "GET",
    admin: true,
  });
}

export async function adminAddCustomerForUser(userId, data) {
  return authFetch(`${API_BASE}/api/admin/users/${userId}/customers`, {
    method: "POST",
    body: JSON.stringify(data),
    admin: true,
  });
}


export async function getMonthlyReceipt(customerId, month, year) {
  return authFetch(
    `${API_BASE}/api/receipts/monthly-receipt?customerId=${encodeURIComponent(customerId)}&month=${month}&year=${year}`
  );
}





export { authFetch };


