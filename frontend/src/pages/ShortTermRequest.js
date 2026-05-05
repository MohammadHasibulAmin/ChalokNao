import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import OpenStreetMapLink from "../components/maps/OpenStreetMapLink";

const ShortTermRequest = () => {
  const [shortTermDrivers, setShortTermDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ query: "", location: "", rating: "" });

  

  useEffect(() => {
    const fetchShortTermDrivers = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/drivers/search");
        // Filter to show only temporary drivers
        const temporaryDrivers = Array.isArray(res.data)
          ? res.data.filter((d) => String(d.workType || "").toLowerCase() === "temporary")
          : [];
        setShortTermDrivers(temporaryDrivers);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load short-term drivers");
        setShortTermDrivers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchShortTermDrivers();
  }, []);

  const getDriverLocation = useCallback((driver) => {
    if (typeof driver.location === "string") {
      return driver.location;
    }
    return driver.locationCity || driver.location?.city || "";
  }, []);

  const scoreByFilters = useCallback((driver, filters) => {
    const location = getDriverLocation(driver) || "";
    const rating = Number(driver.ratingAvg || 0);
    const query = filters.query.trim();
    const locationQuery = filters.location.trim();
    const ratingFilter = filters.rating ? Number(filters.rating) : 0;

    let score = 0;
    score += String(driver.name || "").toLowerCase().includes(query.toLowerCase()) ? 2 : 0;
    score += location.toLowerCase().includes(locationQuery.toLowerCase()) ? 2 : 0;
    score += rating;

    if (ratingFilter && rating >= ratingFilter) {
      score += 5;
    }

    return score;
  }, [getDriverLocation]);

  const rankedDrivers = useMemo(() => {
    return [...shortTermDrivers]
      .filter((driver) => {
        const query = filters.query.trim().toLowerCase();
        if (!query) return true;
        return (
          String(driver.name || "").toLowerCase().includes(query) ||
          String(driver.userName || "").toLowerCase().includes(query) ||
          getDriverLocation(driver).toLowerCase().includes(query)
        );
      })
      .filter((driver) => {
        if (!filters.location) return true;
        return getDriverLocation(driver).toLowerCase().includes(filters.location.toLowerCase());
      })
      .sort((left, right) => scoreByFilters(right, filters) - scoreByFilters(left, filters));
  }, [shortTermDrivers, filters, scoreByFilters, getDriverLocation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = () => setFilters({ query: "", location: "", rating: "" });

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <h2 style={{ margin: "10px 0 8px", fontSize: "34px" }}>
          Temporary Driver Hiring
        </h2>
        <p style={{ margin: 0, maxWidth: "760px", lineHeight: 1.6, opacity: 0.92 }}>
          Find experienced drivers available for temporary/short-term contracts. Browse by location, rating, and experience.
        </p>
      </div>

      <div style={{ ...panelStyle, marginBottom: "18px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ ...badgeStyle, backgroundColor: "#fef3c7", color: "#92400e" }}>
            Temporary Drivers
          </span>
        </div>

        <div style={filterGrid}>
          <input
            name="query"
            value={filters.query}
            onChange={handleChange}
            placeholder="Search by name or city"
            style={inputStyle}
          />
          <input
            name="location"
            value={filters.location}
            onChange={handleChange}
            placeholder="Filter by location"
            style={inputStyle}
          />
          <input
            name="rating"
            value={filters.rating}
            onChange={handleChange}
            type="number"
            min="0"
            max="5"
            step="0.1"
            placeholder="Minimum rating"
            style={inputStyle}
          />
          <button type="button" onClick={resetFilters} style={buttonStyle}>
            Clear Filters
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#b91c1c", marginBottom: "16px" }}>{error}</p>}

      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
          <div>
            <h3 style={{ margin: 0 }}>Available Temporary Drivers</h3>
            <p style={{ ...mutedStyle, margin: "6px 0 0" }}>
              Results are ranked by filter match, location, and rating.
            </p>
          </div>
          <span style={badgeStyle}>
            {loading ? "Loading..." : `${rankedDrivers.length} results`}
          </span>
        </div>

        <div style={listStyle}>
          {rankedDrivers.map((driver) => {
            const score = scoreByFilters(driver, filters);
            return (
              <article key={driver._id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{driver.name || driver._id || "Unnamed Driver"}</h4>
                    <p style={{ ...mutedStyle, margin: "6px 0 0" }}>
                      {getDriverLocation(driver) || "Unknown city"} • <span style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>Temporary</span>
                    </p>
                    {getDriverLocation(driver) && (
                      <OpenStreetMapLink
                        label="View in OpenStreetMap"
                        query={getDriverLocation(driver)}
                        lat={driver.location?.coordinates?.lat}
                        lng={driver.location?.coordinates?.lng}
                        style={{ fontSize: "12px" }}
                      />
                    )}
                  </div>
                </div>

                <div style={metaStyle}>
                  <span style={badgeStyle}>{driver.ratingAvg?.toFixed(1) || "0.0"} rating</span>
                  <span style={badgeStyle}>{driver.experienceYears || 0} yrs experience</span>
                  <span style={badgeStyle}>Status: {driver.status || "Available"}</span>
                  <span style={badgeStyle}>Training: {Number(driver.trainingSummary?.completionRate || 0)}%</span>
                </div>

                {Array.isArray(driver.trainingBadges) && driver.trainingBadges.length > 0 && (
                  <div style={{ ...metaStyle, marginTop: "8px" }}>
                    {driver.trainingBadges.map((item) => (
                      <span key={item} style={{ ...badgeStyle, backgroundColor: "#dcfce7", color: "#166534" }}>{item}</span>
                    ))}
                  </div>
                )}

                <p style={{ ...mutedStyle, marginBottom: "12px" }}>
                  Match score: {score.toFixed(1)}
                </p>

                <div style={actionRowStyle}>
                  <Link to={`/driver/${driver._id}`} style={{ ...profileLinkStyle, padding: '8px 12px', borderRadius: 8, background: '#b45309', color: '#fff' }}>
                    View Profile
                  </Link>
                </div>
              </article>
            );
          })}

          {!loading && rankedDrivers.length === 0 && (
            <p style={mutedStyle}>No temporary drivers found. Check back later or adjust your filters.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const pageStyle = {
  maxWidth: "1200px",
  margin: "24px auto",
  padding: "24px",
};

const heroStyle = {
  padding: "24px",
  borderRadius: "20px",
  background: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)",
  color: "#fff",
  marginBottom: "20px",
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.2)",
};

const panelStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 12px 24px rgba(15, 23, 42, 0.06)",
};

const filterGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "12px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  backgroundColor: "#fff",
};

const buttonStyle = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#b45309",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const listStyle = {
  display: "grid",
  gap: "14px",
  maxHeight: "none",
  overflowY: "auto",
};

const cardStyle = {
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
};

const metaStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "10px",
};

const badgeStyle = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "999px",
  backgroundColor: "#f0f9ff",
  color: "#075985",
  fontSize: "12px",
  fontWeight: 700,
};

const mutedStyle = {
  color: "#64748b",
  fontSize: "14px",
};

const profileLinkStyle = {
  display: "inline-block",
  marginTop: "8px",
  fontSize: "13px",
  fontWeight: 700,
  textDecoration: "none",
};

const actionRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "10px",
};

export default ShortTermRequest;
