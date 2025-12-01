import { useState } from "react";
import { registerUser } from "../api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

    try {
      await registerUser(name, email, phone, password);

      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      alert("Registration failed.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form
        className="bg-gray-800 p-8 rounded-xl w-full max-w-sm shadow-xl"
        onSubmit={handleRegister}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Create Milk Seller Account
        </h2>

        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-3 mb-4 rounded bg-gray-700 outline-none"
          value={name}
          onChange={(e) => setName(e.target.value.trim())}

        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded bg-gray-700 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}

        />

        <input
          type="text"
          placeholder="Phone"
          className="w-full p-3 mb-4 rounded bg-gray-700 outline-none"
          value={phone}
          onChange={(e) => setPhone(e.target.value.trim())}

        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-6 rounded bg-gray-700 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value.trim())}

        />

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-500 p-3 rounded font-semibold"
        >
          Register
        </button>

        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-blue-400 underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
