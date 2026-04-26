import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const ContractDashboard = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const fetchContracts = useCallback(async () => {
    try {
      const res = await api.get(`/contracts/owner/${userId}`);
      setContracts(res.data);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return (
    <div style={containerStyle}>
      <h2>Contract Management</h2>

      {loading ? (
        <p>Loading contracts...</p>
      ) : contracts.length === 0 ? (
        <p>No contracts yet.</p>
      ) : (
        <div>
          <h3>Ongoing Contracts</h3>
          {contracts
            .filter((c) => c.paymentStatus !== "completed")
            .map((contract) => (
              <div key={contract._id} style={listItemStyle}>
                <h4>Driver {contract.driverId}</h4>
                <p>
                  <strong>Amount:</strong> ${contract.amount}
                </p>
                <p>
                  <strong>Duration:</strong> {contract.duration}
                </p>
                <p>
                  <strong>Payment Status:</strong>{" "}
                  <span style={{ color: getPaymentColor(contract.paymentStatus) }}>
                    {contract.paymentStatus}
                  </span>
                </p>
                <p>
                  <strong>Created:</strong> {new Date(contract.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}

          <h3 style={{ marginTop: "30px" }}>Completed Contracts</h3>
          {contracts
            .filter((c) => c.paymentStatus === "completed")
            .map((contract) => (
              <div key={contract._id} style={{ ...listItemStyle, opacity: 0.7 }}>
                <h4>Driver {contract.driverId}</h4>
                <p>
                  <strong>Amount:</strong> ${contract.amount}
                </p>
                <p>
                  <strong>Completed:</strong> {new Date(contract.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

const getPaymentColor = (status) => {
  if (status === "pending") return "#FFA500";
  if (status === "completed") return "#28a745";
  if (status === "failed") return "#dc3545";
  return "#000";
};

const containerStyle = {
  maxWidth: "700px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const listItemStyle = { padding: "15px", border: "1px solid #ddd", borderRadius: "5px", marginBottom: "15px", backgroundColor: "#fff" };

export default ContractDashboard;
