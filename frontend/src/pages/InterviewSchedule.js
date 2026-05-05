import React, { useState } from "react";
import api from "../services/api";
import OpenStreetMapInput from "../components/maps/OpenStreetMapInput";
import OpenStreetMapLink from "../components/maps/OpenStreetMapLink";

const InterviewSchedule = () => {
  const [formData, setFormData] = useState({
    driverId: "",
    type: "online",
    date: "",
    location: "",
    locationLat: "",
    locationLng: "",
  });
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newErrors = {};
      if (!formData.driverId) newErrors.driverId = "Driver ID is required.";
      if (!formData.date) newErrors.date = "Please choose an interview date.";
      if (formData.type === "offline" && !formData.location) newErrors.location = "Address is required for offline interviews.";

      if (Object.keys(newErrors).length) {
        setErrors(newErrors);
        return;
      }

      setErrors({});

      await api.post("/interviews/owner/interview", {
        ownerId: userId,
        driverId: formData.driverId,
        type: formData.type,
        date: formData.date,
        location: formData.type === "offline" ? formData.location : null,
        locationLat: formData.type === "offline" ? formData.locationLat : null,
        locationLng: formData.type === "offline" ? formData.locationLng : null,
      });
      setMessage("Interview scheduled!");
      setFormData({ driverId: "", type: "online", date: "", location: "", locationLat: "", locationLng: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Error scheduling interview");
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Schedule Interview</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          type="text"
          name="driverId"
          placeholder="Driver ID"
          value={formData.driverId}
          onChange={handleChange}
          required
          style={errors.driverId ? { ...inputStyle, borderColor: "#ef4444" } : inputStyle}
        />
        {errors.driverId && <div style={{ color: "#b91c1c", fontSize: 13 }}>{errors.driverId}</div>}
        <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="chat">Chat</option>
        </select>
        <input
          type="datetime-local"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          style={errors.date ? { ...inputStyle, borderColor: "#ef4444" } : inputStyle}
        />
        {errors.date && <div style={{ color: "#b91c1c", fontSize: 13 }}>{errors.date}</div>}
        {formData.type === "offline" && (
          <>
            <OpenStreetMapInput
              name="location"
              placeholder="Address (required for offline interviews)"
              value={formData.location}
              onChange={handleChange}
              onPlaceSelected={({ address, lat, lng }) => {
                setFormData((current) => ({
                  ...current,
                  location: address || current.location,
                  locationLat: Number.isFinite(lat) ? String(lat) : current.locationLat,
                  locationLng: Number.isFinite(lng) ? String(lng) : current.locationLng,
                }));
              }}
              style={errors.location ? { ...inputStyle, borderColor: "#ef4444" } : inputStyle}
            />
            {!!formData.location && (
              <OpenStreetMapLink
                label="Check location in OpenStreetMap"
                query={formData.location}
                lat={formData.locationLat}
                lng={formData.locationLng}
              />
            )}
            {errors.location && <div style={{ color: "#b91c1c", fontSize: 13 }}>{errors.location}</div>}
          </>
        )}
        <button type="submit" style={buttonStyle}>
          Schedule Interview
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

export default InterviewSchedule;
