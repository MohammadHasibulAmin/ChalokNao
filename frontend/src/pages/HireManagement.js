import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const HireManagement = () => {
  const [hires, setHires] = useState([]);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const fetchHires = useCallback(async () => {
    try {
      const res = await api.get(`/hire/owner/${userId}`);
      setHires(res.data);
    } catch (err) {
      console.error("Error fetching hires:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchHires();
  }, [fetchHires]);

  const handleConfirm = async (hireId) => {
    try {
      await api.put(`/hire/confirm/${hireId}`, {
        actor: "driver",
      });
      setMessage("Hire confirmed!");
      fetchHires();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error confirming hire");
    }
  };

  const handlePay = async (hireId) => {
    try {
      const res = await api.post(`/hire/pay/${hireId}`);
      if (res.data?.url) {
        // redirect owner to Stripe Checkout
        window.location.href = res.data.url;
      } else {
        setMessage("Unable to create payment session");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Error initiating payment");
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Hire Management</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      {hires.length === 0 ? (
        <p>No hire requests.</p>
      ) : (
        hires.map((hire) => (
          <div key={hire._id} style={listItemStyle}>
            <h4>Driver: {hire.driverId}</h4>
            <p>
              <strong>Salary:</strong> ${hire.salary}
            </p>
            <p>
              <strong>Duration:</strong> {hire.duration || "Not specified"}
            </p>
            <p>
              <strong>Status:</strong> <span style={{ color: getStatusColor(hire.status) }}>{hire.status}</span>
            </p>
            <p>
              <strong>Owner Confirmed:</strong> {hire.ownerConfirm ? "✓" : "✗"}
            </p>
            <p>
              <strong>You Confirmed:</strong> {hire.driverConfirm ? "✓" : "✗"}
            </p>
            {hire.status === "Pending" && !hire.driverConfirm && (
              <button onClick={() => handleConfirm(hire._id)} style={buttonStyle}>
                Accept Hire
              </button>
            )}

            {hire.status === "AwaitingPayment" && (
              <div style={{ marginTop: 8 }}>
                <button onClick={() => handlePay(hire._id)} style={{ ...buttonStyle, backgroundColor: "#0366d6" }}>
                  Pay Now
                </button>
                <p style={{ marginTop: 8, color: "#666" }}>Payment will finalize this hire and create the contract.</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

const getStatusColor = (status) => (status === "Confirmed" ? "#28a745" : "#FFA500");

const containerStyle = {
  maxWidth: "700px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const listItemStyle = { padding: "15px", border: "1px solid #ddd", borderRadius: "5px", marginBottom: "15px", backgroundColor: "#fff" };
const buttonStyle = { marginTop: "10px", padding: "8px 15px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };

export default HireManagement;
