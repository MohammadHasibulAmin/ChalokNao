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
import React, { useState, useEffect } from "react";
import api from "../services/api";

const OfferSubmit = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState("search"); // 'search' or 'shortlist'

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  // Load shortlist on mount
  useEffect(() => {
    fetchShortlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchShortlist = async () => {
    try {
      const response = await api.get(`/shortlist/${userId}`);
      const shortlistData = response.data || {};
      
      if (shortlistData.driverIds && shortlistData.driverIds.length > 0) {
        // Fetch full driver details for each driver in shortlist
        const driversResponse = await api.get("/drivers/search");
        const allDrivers = driversResponse.data || [];
        
        const shortlistedDrivers = allDrivers.filter(driver =>
          shortlistData.driverIds.includes(driver.userId)
        );
        
        setShortlist(shortlistedDrivers);
      }
    } catch (err) {
      console.error("Failed to load shortlist:", err);
    }
  };

  const searchDrivers = async (query) => {
    if (!query.trim()) {
      setDrivers([]);
      setShowSearchResults(false);
      return;
    }

    setLoading(true);
    try {
      // Search by name - fetch drivers and filter
      const response = await api.get("/drivers/search");
      const filtered = response.data.filter((driver) =>
        driver.name?.toLowerCase().includes(query.toLowerCase()) ||
        driver.location?.city?.toLowerCase().includes(query.toLowerCase())
      );
      setDrivers(filtered);
      setShowSearchResults(true);
    } catch (err) {
      setMessage("Error searching drivers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      searchDrivers(query);
    } else {
      setShowSearchResults(false);
      setDrivers([]);
    }
  };

  const selectDriver = (driver) => {
    setSelectedDriver(driver);
    setShowSearchResults(false);
    setSearchQuery("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriver || !amount) {
      setMessage("Please select a driver and enter an amount");
      return;
    }

    setLoading(true);
    try {
      await api.post("/offer", {
        ownerId: userId,
        driverId: selectedDriver.userId,
        salary: Number(amount),
      });
      setMessage("✓ Offer submitted successfully!");
      setSelectedDriver(null);
      setAmount("");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error submitting offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Send Salary Offer to Driver</h2>
      {message && (
        <p style={{ color: message.includes("✓") ? "green" : "red", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "5px" }}>
          {message}
        </p>
      )}

      {!selectedDriver ? (
        <>
          {/* Tab Selection */}
          <div style={tabsStyle}>
            <button
              onClick={() => setActiveTab("search")}
              style={{ ...tabButtonStyle, backgroundColor: activeTab === "search" ? "#007bff" : "#e0e0e0" }}
            >
              Search Drivers
            </button>
            <button
              onClick={() => setActiveTab("shortlist")}
              style={{ ...tabButtonStyle, backgroundColor: activeTab === "shortlist" ? "#007bff" : "#e0e0e0" }}
            >
              My Shortlist ({shortlist.length})
            </button>
          </div>

          {/* Search Tab */}
          {activeTab === "search" && (
            <div style={searchSectionStyle}>
              <input
                type="text"
                placeholder="Search by driver name or location..."
                value={searchQuery}
                onChange={handleSearchChange}
                style={inputStyle}
              />
              {loading && <p style={{ color: "#D1D5DB" }}>Searching...</p>}

              {showSearchResults && drivers.length > 0 && (
                <div style={resultsStyle}>
                  {drivers.map((driver) => (
                    <div key={driver._id} style={driverCardStyle} onClick={() => selectDriver(driver)}>
                      <h4 style={{ margin: "0 0 8px 0" }}>{driver.name}</h4>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Location:</strong> {driver.location?.city || "Not specified"}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Experience:</strong> {driver.experienceYears || 0} years
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Rating:</strong> {driver.ratingAvg?.toFixed(1) || "N/A"} / 5
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Expected Salary:</strong> ${driver.expectedSalary?.monthly || 0}/month
                      </p>
                      <button style={selectButtonStyle}>Select</button>
                    </div>
                  ))}
                </div>
              )}

              {showSearchResults && drivers.length === 0 && !loading && (
                <p style={{ color: "#B0B0B0", textAlign: "center", marginTop: "20px" }}>No drivers found</p>
              )}
            </div>
          )}

          {/* Shortlist Tab */}
          {activeTab === "shortlist" && (
            <div style={searchSectionStyle}>
              {shortlist.length > 0 ? (
                <div style={resultsStyle}>
                  {shortlist.map((driver) => (
                    <div key={driver._id} style={driverCardStyle} onClick={() => selectDriver(driver)}>
                      <h4 style={{ margin: "0 0 8px 0" }}>{driver.name}</h4>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Location:</strong> {driver.location?.city || "Not specified"}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Experience:</strong> {driver.experienceYears || 0} years
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Rating:</strong> {driver.ratingAvg?.toFixed(1) || "N/A"} / 5
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Expected Salary:</strong> ${driver.expectedSalary?.monthly || 0}/month
                      </p>
                      <button style={selectButtonStyle}>Select</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#B0B0B0", textAlign: "center", padding: "20px" }}>Your shortlist is empty</p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Selected Driver Details */}
          <div style={selectedDriverStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <h3 style={{ margin: "0 0 10px 0" }}>{selectedDriver.name}</h3>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>
                  <strong>📍 Location:</strong> {selectedDriver.location?.city || "Not specified"}
                </p>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>
                  <strong>👨‍💼 Experience:</strong> {selectedDriver.experienceYears || 0} years
                </p>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>
                  <strong>⭐ Rating:</strong> {selectedDriver.ratingAvg?.toFixed(1) || "N/A"} / 5 ({selectedDriver.totalReviews || 0} reviews)
                </p>
                <p style={{ margin: "5px 0", fontSize: "14px", color: "#2196F3" }}>
                  <strong>💰 Expected Salary:</strong> ${selectedDriver.expectedSalary?.monthly || 0}/month, ${selectedDriver.expectedSalary?.daily || 0}/day
                </p>
              </div>
              <button
                onClick={() => setSelectedDriver(null)}
                style={{ padding: "8px 12px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
              >
                Change Driver
              </button>
            </div>
          </div>

          {/* Offer Amount Form */}
          <form onSubmit={handleSubmit} style={formStyle}>
            <label>
              <strong>Offer Amount (Monthly):</strong>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter your offer amount"
                step="100"
                min="0"
                required
                style={inputStyle}
              />
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" disabled={loading} style={submitButtonStyle}>
                {loading ? "Submitting..." : "Submit Offer"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedDriver(null)}
                style={{ ...submitButtonStyle, backgroundColor: "#6B7280" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

const containerStyle = {
  maxWidth: "900px",
  margin: "20px auto",
  padding: "30px",
  border: "1px solid rgba(242,240,236,0.12)",
  borderRadius: "8px",
  backgroundColor: "#141414",
};

const tabsStyle = {
  display: "flex",
  gap: "10px",
  marginBottom: "20px",
  borderBottom: "1px solid rgba(242,240,236,0.18)",
};

const tabButtonStyle = {
  padding: "10px 20px",
  border: "none",
  borderRadius: "5px 5px 0 0",
  cursor: "pointer",
  fontWeight: "bold",
  color: "#111827",
  transition: "all 0.3s",
};

const searchSectionStyle = {
  marginBottom: "20px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "5px",
  border: "1px solid rgba(242,240,236,0.18)",
  fontSize: "14px",
  marginTop: "10px",
  boxSizing: "border-box",
};

const resultsStyle = {
  marginTop: "20px",
  maxHeight: "500px",
  overflowY: "auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "15px",
};

const driverCardStyle = {
  padding: "15px",
  backgroundColor: "white",
  border: "1px solid #e0e0e0",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.3s",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  ":hover": {
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  },
};

const selectButtonStyle = {
  width: "100%",
  marginTop: "10px",
  padding: "10px",
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold",
};

const selectedDriverStyle = {
  padding: "20px",
  backgroundColor: "white",
  border: "2px solid #2196F3",
  borderRadius: "8px",
  marginBottom: "20px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  padding: "20px",
  backgroundColor: "white",
  borderRadius: "8px",
  border: "1px solid rgba(242,240,236,0.18)",
};

const submitButtonStyle = {
  padding: "12px 20px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
};

export default OfferSubmit;
