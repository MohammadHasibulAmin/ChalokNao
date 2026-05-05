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
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Processing payment...");
  const [success, setSuccess] = useState(false);

  const sessionId = searchParams.get("session_id");
  const hireId = searchParams.get("hireId");

  useEffect(() => {
    const finalizePayment = async () => {
      try {
        if (!sessionId && !hireId) {
          setMessage("Invalid payment information");
          setLoading(false);
          return;
        }

        // Call finalize payment endpoint
        const response = await api.post("/hire/payment/complete", {
          sessionId: sessionId || undefined,
          hireId: hireId || undefined,
        });

        if (response.data) {
          setMessage("Payment successful! Contract has been created.");
          setSuccess(true);
          setLoading(false);

          // Redirect to contract dashboard after 3 seconds
          setTimeout(() => {
            navigate("/contract-dashboard");
          }, 3000);
        }
      } catch (err) {
        setMessage(
          err.response?.data?.message || "Error processing payment. Please contact support."
        );
        setLoading(false);
      }
    };

    finalizePayment();
  }, [sessionId, hireId, navigate]);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {loading ? (
          <div style={{ textAlign: "center" }}>
            <div style={spinnerStyle}></div>
            <p>{message}</p>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            {success ? (
              <>
                <h2 style={{ color: "#28a745" }}>✓ {message}</h2>
                <p style={{ marginTop: "20px", color: "#D1D5DB" }}>
                  Redirecting to contract dashboard...
                </p>
              </>
            ) : (
              <>
                <h2 style={{ color: "#dc3545" }}>✗ Payment Failed</h2>
                <p style={{ marginTop: "20px", color: "#D1D5DB" }}>{message}</p>
                <button
                  onClick={() => navigate("/hire-management")}
                  style={buttonStyle}
                >
                  Return to Hire Management
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  backgroundColor: "#0D0D0D",
};

const cardStyle = {
  backgroundColor: "#141414",
  padding: "40px",
  borderRadius: "10px",
  boxShadow: "0 2px 20px rgba(0,0,0,0.45)",
  textAlign: "center",
  minWidth: "400px",
};

const spinnerStyle = {
  border: "4px solid #f3f3f3",
  borderTop: "4px solid #007bff",
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  animation: "spin 1s linear infinite",
  margin: "20px auto",
};

const buttonStyle = {
  marginTop: "20px",
  padding: "10px 20px",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "16px",
};

// Add CSS animation
if (!document.getElementById("spinner-style")) {
  const style = document.createElement("style");
  style.id = "spinner-style";
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default PaymentSuccess;
