// src/pages/OwnerSearch.js
import React, { useState } from "react";
import axios from "axios";

const OwnerSearch = () => {
  const [location, setLocation] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState("");

  const handleSearch = async e => {
    e.preventDefault();
    setError("");
    setDrivers([]);

    try {
      const res = await axios.get(`http://localhost:5000/api/drivers/search?location=${encodeURIComponent(location)}`);
      setDrivers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Server error");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", padding: "20px", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Search Drivers</h2>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={e => setLocation(e.target.value)}
          required
          style={{ flex: 1, padding: "10px" }}
        />
        <button type="submit" style={{ padding: "10px", backgroundColor: "#2196F3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Search
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {drivers.map(driver => (
          <li key={driver._id} style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
            <strong>{driver.userId}</strong> - {driver.experience} yrs experience - {driver.location} - {driver.workType} - ${driver.salaryExpectation}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OwnerSearch;