// frontend/src/components/DriverProfile.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const DriverProfile = () => {
  const [formData, setFormData] = useState({
    age: "",
    experience: "",
    licenseNumber: "",
    workType: "full-time",
    salaryExpectation: "",
    location: ""
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  // Prefill userId from logged-in user
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.id) setUserId(user.id);
  }, []);

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFileChange = e => setFile(e.target.files[0]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!userId) {
      setMessage("User not logged in");
      return;
    }

    try {
      const data = new FormData();
      data.append("userId", userId);

      for (let key in formData) {
        data.append(key, formData[key]);
      }

      if (file) data.append("photo", file); // field name must match multer.single("photo")

      const res = await axios.post(
        "http://localhost:5000/api/drivers/profile",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setMessage("Profile saved successfully!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error saving profile");
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Driver Profile</h2>
      {message && <p style={{ textAlign: "center", color: "green" }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} style={inputStyle} required />
        <input type="text" name="experience" placeholder="Experience" value={formData.experience} onChange={handleChange} style={inputStyle} required />
        <input type="text" name="licenseNumber" placeholder="License Number" value={formData.licenseNumber} onChange={handleChange} style={inputStyle} required />
        <select name="workType" value={formData.workType} onChange={handleChange} style={inputStyle}>
          <option value="full-time">Full-time</option>
          <option value="temporary">Temporary</option>
        </select>
        <input type="number" name="salaryExpectation" placeholder="Expected Salary" value={formData.salaryExpectation} onChange={handleChange} style={inputStyle} required />
        <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} style={inputStyle} required />
        <input type="file" onChange={handleFileChange} style={{ marginBottom: "15px" }} />
        <button type="submit" style={buttonStyle}>Save Profile</button>
      </form>
    </div>
  );
};

const containerStyle = {
  maxWidth: "500px",
  margin: "50px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  backgroundColor: "#f9f9f9",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "15px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  fontSize: "14px"
};

const buttonStyle = {
  width: "100%",
  padding: "10px",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "16px"
};

export default DriverProfile;