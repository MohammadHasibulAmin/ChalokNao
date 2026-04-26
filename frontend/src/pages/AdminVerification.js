import React, { useState } from "react";
import api from "../services/api";

const AdminVerification = () => {
  const [driverId, setDriverId] = useState("");
  const [status, setStatus] = useState("approved");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");

  const handleVerifyDocument = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/verify-doc/${driverId}`, { status });
      setMessage("Document verification status updated!");
      setDriverId("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error updating verification");
    }
  };

  const handleSuspendUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/suspend-user/${userId}`, {});
      setMessage("User suspended!");
      setUserId("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error suspending user");
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Admin Verification Dashboard</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <div style={sectionStyle}>
        <h3>Verify Driver Documents</h3>
        <form onSubmit={handleVerifyDocument} style={formStyle}>
          <input
            type="text"
            placeholder="Driver ID"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            required
            style={inputStyle}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="submit" style={buttonStyle}>
            Update Verification Status
          </button>
        </form>
      </div>

      <div style={sectionStyle}>
        <h3>Suspend User</h3>
        <form onSubmit={handleSuspendUser} style={formStyle}>
          <input
            type="text"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            style={inputStyle}
          />
          <button type="submit" style={{ ...buttonStyle, backgroundColor: "#dc3545" }}>
            Suspend User
          </button>
        </form>
      </div>
    </div>
  );
};

const containerStyle = {
  maxWidth: "700px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const sectionStyle = { marginBottom: "30px", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#fff" };
const formStyle = { display: "flex", flexDirection: "column", gap: "10px" };
const inputStyle = { padding: "10px", borderRadius: "5px", border: "1px solid #ccc" };
const buttonStyle = { padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };

export default AdminVerification;
