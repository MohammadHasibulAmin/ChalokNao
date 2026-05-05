// REDESIGN INSTRUCTIONS FOR COPILOT:
// - Background: #0D0D0D, cards: #1A1A1A, accent: #E8321A
// - Headings use font-family: 'Syne', sans-serif, weight 800
// - Body uses font-family: 'DM Sans', sans-serif
// - All borders: 1px solid rgba(242,240,236,0.08)
// - Buttons use .btn-primary or .btn-ghost classes from global.css
// - Badges use .badge .badge-red / .badge-gold / .badge-green
// - Inputs styled dark with red focus border
// - Use CSS classes from global.css where possible
// Restyled component below:
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
      // Send a job offer to the driver
      const hire = hires.find(h => h._id === hireId);
      if (hire) {
        // If salary is not set or zero, ask owner to enter a proposed salary (optional)
        let salaryToSend = hire.salary;
        if (!salaryToSend || Number(salaryToSend) <= 0) {
          const input = window.prompt("Enter proposed salary (leave blank to send a request without salary):", "");
          if (input === null) return; // user cancelled
          const trimmed = String(input).trim();
          salaryToSend = trimmed === "" ? null : Number(trimmed);
        }

        await api.post(`/offer`, {
          ownerId: userId,
          driverId: hire.driverUserId || hire.driverId,
          hireId: hireId,
          salary: salaryToSend,
          duration: hire.duration,
          driverName: hire.driverName,
        });

        setMessage("Job offer sent to driver!");
        fetchHires();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending job offer");
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
            <h4>Driver: {hire.driverName || hire.driverId}</h4>
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
              <strong>Driver Accepted Offer:</strong> {hire.driverConfirm ? "✓" : "✗"}
            </p>
            {hire.status === "Pending" && !hire.driverConfirm && (
              <button onClick={() => handleConfirm(hire._id)} style={buttonStyle}>
                Send Job Offer
              </button>
            )}

            {hire.status === "AwaitingPayment" && (
              <div style={{ marginTop: 8 }}>
                <button onClick={() => handlePay(hire._id)} style={{ ...buttonStyle, backgroundColor: "#0366d6" }}>
                  Pay Now
                </button>
                <p style={{ marginTop: 8, color: "#D1D5DB" }}>Payment will finalize this hire and create the contract.</p>
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
  border: "1px solid rgba(242,240,236,0.12)",
  borderRadius: "8px",
  backgroundColor: "#141414",
};

const listItemStyle = { padding: "15px", border: "1px solid rgba(242,240,236,0.12)", borderRadius: "5px", marginBottom: "15px", backgroundColor: "#111" };
const buttonStyle = { marginTop: "10px", padding: "8px 15px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };

export default HireManagement;
