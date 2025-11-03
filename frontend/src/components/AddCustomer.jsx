import React, { useState } from "react";

function AddCustomer() {
  const [form, setForm] = useState({
    id: "",
    name: "",
    defaultLitres: "",
    phone: "",
    image: null
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm({ ...form, image: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("id", form.id);
    formData.append("name", form.name);
    formData.append("defaultLitres", form.defaultLitres);
    formData.append("phone", form.phone);
    if (form.image) formData.append("image", form.image);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) setMessage("✅ Customer added successfully!");
      else setMessage("❌ " + data.message);
    } catch (err) {
      setMessage("❌ Error adding customer");
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "20px auto" }}>
      <h2>Add Customer</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="id" placeholder="ID" onChange={handleChange} required /><br /><br />
        <input type="text" name="name" placeholder="Name" onChange={handleChange} required /><br /><br />
        <input type="number" name="defaultLitres" placeholder="Default Litres" onChange={handleChange} /><br /><br />
        <input type="text" name="phone" placeholder="Phone" onChange={handleChange} /><br /><br />
        <input type="file" name="image" onChange={handleChange} /><br /><br />
        <button type="submit">Add Customer</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default AddCustomer;
