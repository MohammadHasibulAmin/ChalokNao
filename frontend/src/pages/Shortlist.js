import React, { useState } from "react";
import api from "../services/api";

const Shortlist = () => {
  const [shortlist, setShortlist] = useState([]);
  const [driverId, setDriverId] = useState("");
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const handleAddToShortlist = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/owner/shortlist", {
        ownerId: userId,
        driverId,
      });
      setShortlist(Array.isArray(res.data?.driverIds) ? res.data.driverIds : []);
      setMessage("Driver added to shortlist!");
      setDriverId("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error adding to shortlist");
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Driver Shortlist</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form onSubmit={handleAddToShortlist} style={formStyle}>
        <input
          type="text"
          placeholder="Driver ID"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          required
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>
          Add to Shortlist
        </button>
      </form>

      <div style={{ marginTop: "20px" }}>
        <h3>Shortlisted Drivers</h3>
        {shortlist.length === 0 ? (
          <p>No shortlisted drivers yet.</p>
        ) : (
          shortlist.map((driver, idx) => (
            <div key={idx} style={listItemStyle}>
              <p>
                <strong>Driver ID:</strong> {driver}
              </p>
            </div>
          ))
        )}
      </div>
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

const formStyle = { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" };
const inputStyle = { padding: "10px", borderRadius: "5px", border: "1px solid #ccc" };
const buttonStyle = { padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };
const listItemStyle = { padding: "12px", border: "1px solid #ddd", borderRadius: "5px", marginBottom: "10px", backgroundColor: "#fff" };

export default Shortlist;
