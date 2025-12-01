import { useEffect, useState } from "react";
import { getSellerProfile, updateSellerProfile } from "../api";

export default function SellerProfile() {
  const [user, setUser] = useState(null);
  const [edit, setEdit] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    async function load() {
      const profile = await getSellerProfile();
      setUser(profile);
      setName(profile.name);
      setPhone(profile.phone);
    }
    load();
  }, []);

  async function handleUpdate() {
    const form = new FormData();
    form.append("name", name);
    form.append("phone", phone);

    if (photo) form.append("photo", photo);

    await updateSellerProfile(form);
    alert("Profile updated!");
    setEdit(false);

    const refreshed = await getSellerProfile();
    setUser(refreshed);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  if (!user) return <p className="text-white p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-black flex justify-center mt-8 px-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-lg text-white">

        {/* TOP SECTION */}
        <div className="flex flex-col items-center">

          <div className="w-32 h-32 rounded-full border-4 border-green-500 overflow-hidden flex items-center justify-center bg-gray-900">
            <img
              src={
                user.photo
                  ? `${import.meta.env.VITE_API_BASE_URL}${user.photo}`
                  : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              }

              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>




          <h1 className="text-3xl font-bold mt-4">{user.name}</h1>
          <p className="text-gray-300">{user.email}</p>
          <p className="text-gray-400 text-sm mt-1">
            Joined: {new Date(user.createdAt).toDateString()}
          </p>
        </div>

        <hr className="my-6 border-gray-600" />

        {/* DETAILS */}
        {!edit ? (
          <div className="space-y-3">
            <p><b>Name:</b> {user.name}</p>
            <p><b>Email:</b> {user.email}</p>
            <p><b>Phone:</b> {user.phone}</p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEdit(true)}
                className="bg-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Edit Profile
              </button>

              <button
                onClick={handleLogout}
                className="bg-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm mt-3">Name</label>
            <input
              className="w-full p-2 rounded bg-gray-700 mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label className="block text-sm mt-3">Phone</label>
            <input
              className="w-full p-2 rounded bg-gray-700 mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label className="block text-sm mt-3">Profile Photo</label>
            <input
              type="file"
              className="w-full p-2 rounded bg-gray-700 mt-1"
              onChange={(e) => setPhoto(e.target.files[0])}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdate}
                className="bg-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                Save
              </button>

              <button
                onClick={() => setEdit(false)}
                className="bg-gray-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
