import React, { useState } from "react";
import api from "../services/api";

const OfferSubmit = () => {
  const [formData, setFormData] = useState({
    driverId: "",
    amount: "",
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
      await api.post("/offer", {
        ownerId: userId,
        driverId: formData.driverId,
        amount: Number(formData.amount),
      });
      setMessage("Offer submitted successfully!");
      setFormData({ driverId: "", amount: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Error submitting offer");
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Submit Salary Offer</h2>
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
        <input
          type="number"
          name="amount"
          placeholder="Offered Amount"
          value={formData.amount}
          onChange={handleChange}
          step="100"
          required
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>
          Submit Offer
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

export default OfferSubmit;
