import React, { useState, useEffect } from "react";
import api from "../services/api";

const SalaryConfig = () => {
  const [formData, setFormData] = useState({
    monthly: "",
    daily: "",
  });
  const [message, setMessage] = useState("");
  const [currentSalary, setCurrentSalary] = useState(null);
  const [offers, setOffers] = useState([]);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  useEffect(() => {
    fetchCurrentSalary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchCurrentSalary = async () => {
    try {
      const response = await api.get(`/drivers/search`);
      const driver = response.data?.find(d => d.userId === userId);
      if (driver) {
        const salary = driver.expectedSalary || {};
        setFormData({
          monthly: salary.monthly || "",
          daily: salary.daily || "",
        });
        setCurrentSalary(salary);
      }
    } catch (err) {
      console.error("Error fetching current salary:", err);
    }
  };

  const fetchOffers = async () => {
    setOffersLoading(true);
    try {
      const response = await api.get(`/offer/driver/list?userId=${userId}`);
      setOffers(response.data || []);
    } catch (err) {
      console.error("Error loading salary offers:", err);
      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  };

  const handleShowOffers = () => {
    setShowOffersModal(true);
    fetchOffers();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put("/drivers/salary", {
        userId,
        ...formData,
      });
      setMessage("✓ Salary configuration updated successfully!");
      setCurrentSalary(formData);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error updating salary");
    }
  };

  const handleOfferResponse = async (offerId, status) => {
    try {
      await api.put(`/offer/${offerId}/status`, { status });
      setMessage(`✓ Offer ${status} successfully!`);
      await fetchOffers();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Error updating offer");
      console.error(err);
    }
  };

  const getFilteredAndSortedOffers = () => {
    let filtered = offers;

    if (filterStatus !== "all") {
      filtered = filtered.filter((offer) => offer.status === filterStatus);
    }

    filtered = filtered.sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "highest") {
        return b.amount - a.amount;
      } else if (sortBy === "lowest") {
        return a.amount - b.amount;
      }
      return 0;
    });

    return filtered;
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: { bg: "#FFF3CD", color: "#856404" },
      accepted: { bg: "#D4EDDA", color: "#155724" },
      rejected: { bg: "#F8D7DA", color: "#721C24" },
    };
    const style = colors[status] || { bg: "#f0f0f0", color: "#333" };
    return (
      <span style={{ padding: "5px 12px", backgroundColor: style.bg, color: style.color, borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredOffers = getFilteredAndSortedOffers();

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h2>💼 My Salary Configuration</h2>
          <p style={{ color: "#666", marginTop: "5px" }}>
            Set your expected salary to help employers find the right match
          </p>
        </div>
      </div>

      {message && (
        <div style={{ ...messageStyle, backgroundColor: message.includes("✓") ? "#D4EDDA" : "#F8D7DA", borderLeft: `4px solid ${message.includes("✓") ? "#28a745" : "#dc3545"}` }}>
          {message}
        </div>
      )}

      <div style={contentWrapperStyle}>
        {/* Salary Configuration Section */}
        <div style={formSectionStyle}>
          <h3 style={{ marginTop: "0" }}>Set Your Expected Salary</h3>

          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                <span style={labelTextStyle}>Monthly Salary Expectation</span>
                <input
                  type="number"
                  name="monthly"
                  placeholder="e.g., 50000"
                  value={formData.monthly}
                  onChange={handleChange}
                  step="100"
                  min="0"
                  style={inputStyle}
                />
                <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
                  Your expected monthly salary
                </small>
              </label>
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                <span style={labelTextStyle}>Daily Salary Expectation</span>
                <input
                  type="number"
                  name="daily"
                  placeholder="e.g., 2500"
                  value={formData.daily}
                  onChange={handleChange}
                  step="50"
                  min="0"
                  style={inputStyle}
                />
                <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
                  Your expected daily rate
                </small>
              </label>
            </div>

            <button type="submit" style={buttonStyle}>
              💾 Update Salary Configuration
            </button>
          </form>
        </div>

        {/* Current Configuration Display */}
        {currentSalary && (currentSalary.monthly || currentSalary.daily) && (
          <div style={infoSectionStyle}>
            <h3 style={{ marginTop: "0" }}>📊 Current Configuration</h3>
            <div style={configBoxStyle}>
              <div style={configItemStyle}>
                <span style={{ color: "#666" }}>Monthly Expected:</span>
                <p style={{ fontSize: "24px", fontWeight: "bold", color: "#2196F3", margin: "10px 0 0 0" }}>
                  ${(currentSalary.monthly || 0).toLocaleString()}
                </p>
              </div>
              <div style={configItemStyle}>
                <span style={{ color: "#666" }}>Daily Expected:</span>
                <p style={{ fontSize: "24px", fontWeight: "bold", color: "#4CAF50", margin: "10px 0 0 0" }}>
                  ${(currentSalary.daily || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <p style={{ marginTop: "15px", padding: "10px", backgroundColor: "#E3F2FD", borderRadius: "5px", color: "#1565C0", fontSize: "14px" }}>
              💡 Tip: Keep this updated to help employers make competitive offers
            </p>
          </div>
        )}
      </div>

      {/* Quick Action to View Offers */}
      <div style={quickActionStyle}>
        <div>
          <h3 style={{ marginTop: "0", marginBottom: "10px" }}>📩 Salary Offers</h3>
          <p style={{ color: "#666", marginBottom: "15px" }}>
            View all salary offers you've received from employers
          </p>
        </div>
        <button
          onClick={handleShowOffers}
          style={viewOffersButtonStyle}
        >
          View Salary Offers ({offers.length})
        </button>
      </div>

      {/* Salary Offers Modal */}
      {showOffersModal && (
        <div style={modalOverlayStyle} onClick={() => setShowOffersModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h2 style={{ margin: 0 }}>💰 Salary Offers</h2>
              <button
                onClick={() => setShowOffersModal(false)}
                style={closeButtonStyle}
              >
                ✕
              </button>
            </div>

            {/* Filters */}
            <div style={filtersStyle}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Offers ({offers.length})</option>
                <option value="pending">Pending ({offers.filter((o) => o.status === "pending").length})</option>
                <option value="accepted">Accepted ({offers.filter((o) => o.status === "accepted").length})</option>
                <option value="rejected">Rejected ({offers.filter((o) => o.status === "rejected").length})</option>
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>

            {/* Offers List */}
            <div style={offersContainerStyle}>
              {offersLoading ? (
                <p style={{ textAlign: "center", color: "#666" }}>Loading offers...</p>
              ) : filteredOffers.length === 0 ? (
                <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>
                  {offers.length === 0 ? "No salary offers yet" : "No offers match your filters"}
                </p>
              ) : (
                filteredOffers.map((offer) => (
                  <div key={offer._id} style={offerItemStyle}>
                    <div style={offerHeaderInnerStyle}>
                      <div>
                        <h4 style={{ margin: "0 0 5px 0" }}>Salary Offer</h4>
                        <p style={{ margin: "0", color: "#666", fontSize: "13px" }}>
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(offer.status)}
                    </div>

                    <div style={offerAmountStyle}>
                      <span style={{ color: "#666" }}>Amount:</span>
                      <p style={{ fontSize: "20px", fontWeight: "bold", color: "#2196F3", margin: "5px 0 0 0" }}>
                        ${offer.amount.toLocaleString()}
                      </p>
                    </div>

                    {offer.status === "pending" && (
                      <div style={actionButtonsStyle}>
                        <button
                          onClick={() => handleOfferResponse(offer._id, "accepted")}
                          style={acceptButtonStyle}
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleOfferResponse(offer._id, "rejected")}
                          style={rejectButtonStyle}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const containerStyle = {
  maxWidth: "900px",
  margin: "20px auto",
  padding: "30px",
  backgroundColor: "#f5f5f5",
  borderRadius: "8px",
};

const headerStyle = {
  marginBottom: "30px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
};

const messageStyle = {
  padding: "15px",
  marginBottom: "20px",
  borderRadius: "5px",
  fontSize: "14px",
  fontWeight: "bold",
};

const contentWrapperStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginBottom: "30px",
};

const formSectionStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};

const infoSectionStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const inputGroupStyle = {
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
};

const labelTextStyle = {
  fontWeight: "bold",
  marginBottom: "8px",
  color: "#333",
};

const inputStyle = {
  padding: "12px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  fontSize: "14px",
  fontFamily: "inherit",
};

const buttonStyle = {
  padding: "12px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
  transition: "background-color 0.3s",
};

const configBoxStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "15px",
  marginBottom: "15px",
};

const configItemStyle = {
  padding: "15px",
  backgroundColor: "#f9f9f9",
  borderRadius: "5px",
  border: "1px solid #e0e0e0",
};

const quickActionStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const viewOffersButtonStyle = {
  padding: "12px 24px",
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
  transition: "background-color 0.3s",
  whiteSpace: "nowrap",
};

// Modal Styles
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: "white",
  borderRadius: "8px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
  maxWidth: "600px",
  width: "90%",
  maxHeight: "80vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px",
  borderBottom: "1px solid #e0e0e0",
};

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#666",
  padding: "0",
  width: "30px",
  height: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  ":hover": {
    color: "#000",
  },
};

const filtersStyle = {
  display: "flex",
  gap: "10px",
  padding: "15px 20px",
  borderBottom: "1px solid #e0e0e0",
  backgroundColor: "#f9f9f9",
};

const selectStyle = {
  flex: 1,
  padding: "8px 12px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  fontSize: "13px",
  backgroundColor: "white",
  cursor: "pointer",
};

const offersContainerStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "15px 20px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const offerItemStyle = {
  padding: "15px",
  backgroundColor: "#f9f9f9",
  borderRadius: "6px",
  border: "1px solid #e0e0e0",
};

const offerHeaderInnerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  marginBottom: "12px",
};

const offerAmountStyle = {
  marginBottom: "12px",
};

const actionButtonsStyle = {
  display: "flex",
  gap: "8px",
};

const acceptButtonStyle = {
  flex: 1,
  padding: "8px 12px",
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "13px",
};

const rejectButtonStyle = {
  flex: 1,
  padding: "8px 12px",
  backgroundColor: "#f44336",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "13px",
};

export default SalaryConfig;
