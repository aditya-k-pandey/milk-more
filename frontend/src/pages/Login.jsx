import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrPhone, password }),
        }
      );

      const data = await res.json();
      console.log("login response:", res.status, data);

      if (!res.ok) {
        alert(data.message || "Invalid login");
        return;
      }

      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err) {
      console.error("login error:", err);
      alert("Login failed.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form
        className="bg-gray-800 p-8 rounded-xl w-full max-w-sm shadow-xl"
        onSubmit={handleLogin}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Milk More Login</h2>

        <>
          <input
            type="text"
            placeholder="Email or Phone"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            className="w-full p-3 mb-4 rounded bg-gray-700 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-6 rounded bg-gray-700 outline-none"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded font-semibold"
          >
            Login
          </button>

          <p className="text-center mt-3">
            <a href="/forgot-password" className="text-green-400 hover:underline">
              Forgot Password?
            </a>
          </p>

          <p className="mt-4 text-center text-sm">
            Don’t have an account?{" "}
            <a href="/register" className="text-blue-400 underline">
              Register
            </a>
          </p>

          <p className="mt-4 text-center text-sm">
            <a href="/admin/login" className="text-yellow-400 underline">
              Admin Login
            </a>
          </p>

        </>
      </form>
    </div>
  );
}
