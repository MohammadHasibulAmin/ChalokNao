import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const EmploymentHistory = () => {
  const [employmentList, setEmploymentList] = useState([]);
  const [jobOffers, setJobOffers] = useState([]);
  const [formData, setFormData] = useState({
    employerName: "",
    duration: "",
    description: "",
  });
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const loadEmploymentHistory = useCallback(async () => {
    if (!userId) {
      setEmploymentList([]);
      return;
    }

    try {
      const response = await api.get("/drivers/search");
      const currentDriver = Array.isArray(response.data)
        ? response.data.find((driver) => String(driver.userId) === String(userId))
        : null;
      setEmploymentList(currentDriver?.employmentHistory || []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error loading employment history");
    }
  }, [userId]);

  const loadJobOffers = useCallback(async () => {
    if (!userId) {
      setJobOffers([]);
      return;
    }

    try {
      const response = await api.get(`/offers/driver/list?userId=${userId}`);
      const pendingOffers = Array.isArray(response.data)
        ? response.data.filter((offer) => offer.status === "pending")
        : [];
      setJobOffers(pendingOffers);
    } catch (err) {
      console.error("Error loading job offers:", err);
      setJobOffers([]);
    }
  }, [userId]);

  useEffect(() => {
    loadEmploymentHistory();
    loadJobOffers();
  }, [loadEmploymentHistory, loadJobOffers]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const response = await api.put(`/drivers/employment/${editing}?userId=${userId}`, {
          userId,
          ...formData,
        });
        setEmploymentList(response.data?.employmentHistory || []);
        setMessage("Employment updated!");
      } else {
        const response = await api.post("/drivers/employment", {
          userId,
          ...formData,
        });
        setEmploymentList(response.data?.employmentHistory || []);
        setMessage("Employment added!");
      }
      setFormData({ employerName: "", duration: "", description: "" });
      setEditing(null);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/drivers/employment/${id}?userId=${userId}`);
      setEmploymentList(response.data?.employmentHistory || []);
      setMessage("Employment deleted!");
    } catch (err) {
      setMessage("Error deleting employment");
    }
  };

  const handleOfferResponse = async (offerId, status) => {
    try {
      await api.put(`/offers/${offerId}/status`, {
        status,
      });
      setMessage(`Job offer ${status}!`);
      loadJobOffers();
    } catch (err) {
      setMessage(err.response?.data?.message || `Error ${status} job offer`);
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Employment & Job Offers</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      {/* Job Offers Section */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ borderBottom: "2px solid #007bff", paddingBottom: "10px" }}>Pending Job Offers</h3>
        {jobOffers.length === 0 ? (
          <p style={{ color: "#666" }}>No pending job offers.</p>
        ) : (
          jobOffers.map((offer) => (
            <div key={offer._id} style={jobOfferCardStyle}>
              <div>
                <h4 style={{ margin: "0 0 8px 0" }}>Job Offer from Owner</h4>
                <p style={{ margin: "4px 0", color: "#666" }}>
                  <strong>Salary:</strong> ${offer.salary}
                </p>
                <p style={{ margin: "4px 0", color: "#666" }}>
                  <strong>Duration:</strong> {offer.duration || "Not specified"}
                </p>
                <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => handleOfferResponse(offer._id, "accepted")}
                    style={{ ...offerButtonStyle, backgroundColor: "#28a745" }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleOfferResponse(offer._id, "rejected")}
                    style={{ ...offerButtonStyle, backgroundColor: "#dc3545" }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Employment History Section */}
      <div>
        <h3 style={{ borderBottom: "2px solid #28a745", paddingBottom: "10px" }}>My Employment History</h3>

      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          type="text"
          name="employerName"
          placeholder="Employer Name"
          value={formData.employerName}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <input
          type="text"
          name="duration"
          placeholder="Duration (e.g., 2 years)"
          value={formData.duration}
          onChange={handleChange}
          style={inputStyle}
        />
        <textarea
          name="description"
          placeholder="Job Description"
          value={formData.description}
          onChange={handleChange}
          style={{ ...inputStyle, height: "80px" }}
        />
        <button type="submit" style={buttonStyle}>
          {editing ? "Update" : "Add"} Employment
        </button>
      </form>

      <div style={{ marginTop: "20px" }}>
        {employmentList.length === 0 ? (
          <p>No employment history yet.</p>
        ) : (
          employmentList.map((emp) => (
            <div key={emp._id} style={listItemStyle}>
              <h4>{emp.employerName}</h4>
              <p>{emp.duration}</p>
              <p>{emp.description}</p>
              <button onClick={() => handleDelete(emp._id)} style={deleteButtonStyle}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
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
const deleteButtonStyle = { ...buttonStyle, backgroundColor: "#dc3545", marginTop: "10px" };
const listItemStyle = { padding: "15px", border: "1px solid #ddd", borderRadius: "5px", marginBottom: "10px", backgroundColor: "#fff" };

const jobOfferCardStyle = {
  padding: "15px",
  border: "2px solid #007bff",
  borderRadius: "8px",
  marginBottom: "12px",
  backgroundColor: "#f0f7ff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const offerButtonStyle = {
  padding: "8px 12px",
  border: "none",
  borderRadius: "5px",
  color: "#fff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
};

export default EmploymentHistory;
