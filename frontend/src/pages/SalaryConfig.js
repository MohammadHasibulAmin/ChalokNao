import React, { useState } from "react";
import api from "../services/api";

const SalaryConfig = () => {
  const [formData, setFormData] = useState({
    monthly: "",
    daily: "",
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
      await api.put("/drivers/salary", {
        userId,
        ...formData,
      });
      setMessage("Salary configuration updated!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error updating salary");
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Expected Salary Configuration</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form onSubmit={handleSubmit} style={formStyle}>
        <label>
          Monthly Salary Expectation:
          <input
            type="number"
            name="monthly"
            placeholder="Amount"
            value={formData.monthly}
            onChange={handleChange}
            step="100"
            style={inputStyle}
          />
        </label>
        <label>
          Daily Salary Expectation:
          <input
            type="number"
            name="daily"
            placeholder="Amount"
            value={formData.daily}
            onChange={handleChange}
            step="50"
            style={inputStyle}
          />
        </label>
        <button type="submit" style={buttonStyle}>
          Update Salary
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

const formStyle = { display: "flex", flexDirection: "column", gap: "15px" };
const inputStyle = { padding: "10px", borderRadius: "5px", border: "1px solid #ccc", marginTop: "5px" };
const buttonStyle = { padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };

export default SalaryConfig;
