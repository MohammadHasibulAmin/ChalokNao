import React, { useState } from "react";
import api from "../services/api";
import GoogleMapsLink from "../components/maps/GoogleMapsLink";

const DriverComparison = () => {
  const [drivers, setDrivers] = useState([]);
  const [driverIds, setDriverIds] = useState("");
  const [message, setMessage] = useState("");

  const handleCompare = async (e) => {
    e.preventDefault();
    const ids = driverIds.split(",").map((id) => id.trim());
    if (ids.length < 2) {
      setMessage("Please enter at least 2 driver IDs separated by commas");
      return;
    }

    try {
      const results = await Promise.all(ids.map((id) => api.get(`/drivers/${id}`)));
      setDrivers(results.map((r) => r.data));
      setMessage("");
    } catch (err) {
      setMessage("Error fetching drivers");
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Driver Comparison</h2>
      {message && <p style={{ color: "red" }}>{message}</p>}

      <form onSubmit={handleCompare} style={formStyle}>
        <textarea
          placeholder="Enter Driver IDs separated by commas (e.g., id1, id2, id3)"
          value={driverIds}
          onChange={(e) => setDriverIds(e.target.value)}
          style={{ ...inputStyle, height: "60px" }}
        />
        <button type="submit" style={buttonStyle}>
          Compare Drivers
        </button>
      </form>

      {drivers.length > 0 && (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th>Attribute</th>
                {drivers.map((driver) => (
                  <th key={driver._id}>{driver.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Experience</td>
                {drivers.map((driver) => (
                  <td key={driver._id}>{driver.experienceYears || 0} years</td>
                ))}
              </tr>
              <tr>
                <td>Rating</td>
                {drivers.map((driver) => (
                  <td key={driver._id}>{driver.ratingAvg?.toFixed(1) || "N/A"}</td>
                ))}
              </tr>
              <tr>
                <td>Monthly Salary</td>
                {drivers.map((driver) => (
                  <td key={driver._id}>${driver.expectedSalary?.monthly || 0}</td>
                ))}
              </tr>
              <tr>
                <td>Daily Salary</td>
                {drivers.map((driver) => (
                  <td key={driver._id}>${driver.expectedSalary?.daily || 0}</td>
                ))}
              </tr>
              <tr>
                <td>Work Type</td>
                {drivers.map((driver) => (
                  <td key={driver._id}>{driver.workType}</td>
                ))}
              </tr>
              <tr>
                <td>Status</td>
                {drivers.map((driver) => (
                  <td key={driver._id} style={{ color: driver.status === "Available" ? "#28a745" : "#FFA500" }}>
                    {driver.status}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Location</td>
                {drivers.map((driver) => {
                  const locationText = driver.location?.city || "Not set";
                  return (
                    <td key={driver._id}>
                      <div>{locationText}</div>
                      {driver.location?.city && (
                        <GoogleMapsLink
                          label="Map"
                          query={driver.location.city}
                          lat={driver.location?.coordinates?.lat}
                          lng={driver.location?.coordinates?.lng}
                          style={{ fontSize: "12px" }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const containerStyle = {
  maxWidth: "900px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const formStyle = { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" };
const inputStyle = { padding: "10px", borderRadius: "5px", border: "1px solid #ccc" };
const buttonStyle = { padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };
const tableContainerStyle = { overflowX: "auto", marginTop: "20px" };
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  border: "1px solid #ddd",
  th: { backgroundColor: "#007bff", color: "#fff", padding: "10px", textAlign: "left" },
  td: { padding: "10px", borderBottom: "1px solid #ddd" },
};

export default DriverComparison;
