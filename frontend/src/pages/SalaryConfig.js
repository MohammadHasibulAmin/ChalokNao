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
import { useState, useEffect } from "react";
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
    if (!userId) {
      setOffers([]);
      setOffersLoading(false);
      return;
    }
    setOffersLoading(true);
    try {
      const response = await api.get(`/offer/driver/list?userId=${userId}`);
      setOffers(Array.isArray(response.data) ? response.data : []);
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
        return ((b.salary || b.amount) || 0) - ((a.salary || a.amount) || 0);
      } else if (sortBy === "lowest") {
        return ((a.salary || a.amount) || 0) - ((b.salary || b.amount) || 0);
      }
      return 0;
    });

    return filtered;
  };

  const getStatusBadge = (status) => {
    const typeClass = status === "accepted" ? "badge-green" : status === "rejected" ? "badge-red" : "badge-gold";
    return (
      <span className={`badge ${typeClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredOffers = getFilteredAndSortedOffers();

  return (
    <div className="cn-card salary-config-container">
      <div className="salary-config-header">
        <div>
          <h2>💼 My Salary Configuration</h2>
          <p className="salary-config-subtitle">
            Set your expected salary to help employers find the right match
          </p>
        </div>
      </div>

      {message && (
        <div className={`salary-message ${message.includes("✓") ? "salary-message-success" : "salary-message-error"}`}>
          {message}
        </div>
      )}

      <div className="salary-content-grid">
        {/* Salary Configuration Section */}
        <div className="cn-card salary-card-section">
          <h3>Set Your Expected Salary</h3>

          <form onSubmit={handleSubmit} className="salary-form">
            <div className="salary-input-group">
              <label className="salary-label">
                <span>Monthly Salary Expectation</span>
                <input
                  className="salary-input"
                  type="number"
                  name="monthly"
                  placeholder="e.g., 50000"
                  value={formData.monthly}
                  onChange={handleChange}
                  step="100"
                  min="0"
                />
                <small>Your expected monthly salary</small>
              </label>
            </div>

            <div className="salary-input-group">
              <label className="salary-label">
                <span>Daily Salary Expectation</span>
                <input
                  className="salary-input"
                  type="number"
                  name="daily"
                  placeholder="e.g., 2500"
                  value={formData.daily}
                  onChange={handleChange}
                  step="50"
                  min="0"
                />
                <small>Your expected daily rate</small>
              </label>
            </div>

            <button type="submit" className="btn-primary">
              💾 Update Salary Configuration
            </button>
          </form>
        </div>

        {/* Current Configuration Display */}
        {currentSalary && (currentSalary.monthly || currentSalary.daily) && (
          <div className="cn-card salary-card-section">
            <h3>📊 Current Configuration</h3>
            <div className="salary-config-box">
              <div className="salary-config-item">
                <span>Monthly Expected:</span>
                <p className="salary-config-value salary-config-monthly">
                  ${(currentSalary.monthly || 0).toLocaleString()}
                </p>
              </div>
              <div className="salary-config-item">
                <span>Daily Expected:</span>
                <p className="salary-config-value salary-config-daily">
                  ${(currentSalary.daily || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="salary-tip">
              💡 Tip: Keep this updated to help employers make competitive offers
            </p>
          </div>
        )}
      </div>

      {/* Quick Action to View Offers */}
      <div className="cn-card salary-offers-action">
        <div>
          <h3>📩 Salary Offers</h3>
          <p className="salary-config-subtitle">
            View all salary offers you've received from employers
          </p>
        </div>
        <button onClick={handleShowOffers} className="btn-ghost">
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
            <div className="salary-offers-list">
              {offersLoading ? (
                <p className="salary-empty-message">Loading offers...</p>
              ) : filteredOffers.length === 0 ? (
                <p className="salary-empty-message">
                  {offers.length === 0 ? "No salary offers yet" : "No offers match your filters"}
                </p>
              ) : (
                filteredOffers.map((offer) => (
                  <div key={offer._id} className="cn-card salary-offer-item">
                    <div className="salary-offer-header">
                      <div>
                        <h4>Salary Offer</h4>
                        <p className="salary-offer-date">
                          {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                      {getStatusBadge(offer.status)}
                    </div>

                    <div className="salary-offer-amount">
                      <span>Amount:</span>
                      <p className="salary-offer-value">
                        ${(offer.salary !== undefined && offer.salary !== null) || (offer.amount !== undefined && offer.amount !== null) ? ((offer.salary || offer.amount) || 0).toLocaleString() : 'N/A'}
                      </p>
                    </div>

                    {offer.status === "pending" && (
                      <div className="salary-offer-actions">
                        <button
                          onClick={() => handleOfferResponse(offer._id, "accepted")}
                          className="btn-primary"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleOfferResponse(offer._id, "rejected")}
                          className="btn-ghost"
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
  borderBottom: "1px solid rgba(242,240,236,0.18)",
};

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#D1D5DB",
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
  borderBottom: "1px solid rgba(242,240,236,0.12)",
  backgroundColor: "#141414",
};

const selectStyle = {
  flex: 1,
  padding: "8px 12px",
  borderRadius: "5px",
  border: "1px solid rgba(242,240,236,0.18)",
  fontSize: "13px",
  backgroundColor: "#0d0d0d",
  color: "rgba(242,240,236,0.94)",
  cursor: "pointer",
};

export default SalaryConfig;
