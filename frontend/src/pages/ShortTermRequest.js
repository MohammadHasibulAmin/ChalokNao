import React, { useState } from "react";
import api from "../services/api";

const ShortTermRequest = () => {
  const [formData, setFormData] = useState({
    driverId: "",
    startDate: "",
    endDate: "",
  });
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/request", {
        ownerId: userId,
        driverId: formData.driverId,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      setMessage("Short-term request submitted!");
      setFormData({ driverId: "", startDate: "", endDate: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Error submitting request");
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Short-Term Hiring Request</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          type="text"
          name="driverId"
          placeholder="Driver ID"
          value={formData.driverId}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <label>
          Start Date:
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </label>
        <button type="submit" style={buttonStyle}>
          Submit Request
        </button>
      </form>
    </div>
  );
};

const containerStyle = {
  maxWidth: "600px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const formStyle = { display: "flex", flexDirection: "column", gap: "10px" };
const inputStyle = { padding: "10px", borderRadius: "5px", border: "1px solid #ccc" };
const buttonStyle = { padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };

export default ShortTermRequest;
