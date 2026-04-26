import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import GoogleMapsLink from "../components/maps/GoogleMapsLink";

const publicDirectoryKey = "chaloknao_public_owner_directory";

const pageStyle = {
  maxWidth: "1200px",
  margin: "24px auto",
  padding: "24px",
};

const heroStyle = {
  padding: "24px",
  borderRadius: "20px",
  background: "linear-gradient(135deg, #0f172a 0%, #0f766e 100%)",
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
  backgroundColor: "#0f766e",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const listStyle = {
  display: "grid",
  gap: "14px",
  maxHeight: "620px",
  overflowY: "auto",
  paddingRight: "6px",
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
  backgroundColor: "#e0f2fe",
  color: "#075985",
  fontSize: "12px",
  fontWeight: 700,
};

const mutedStyle = {
  color: "#64748b",
  fontSize: "14px",
};

const defaultFilters = {
  query: "",
  location: "",
  rating: "",
  salary: "",
  workType: "",
};

const profileLinkStyle = {
  display: "inline-block",
  marginTop: "8px",
  fontSize: "13px",
  fontWeight: 700,
  color: "#0f766e",
  textDecoration: "none",
};

const getPublicOwners = () => {
  try {
    return JSON.parse(localStorage.getItem(publicDirectoryKey) || "[]");
  } catch {
    return [];
  }
};

const getDriverName = (driver) => {
  return driver.name || driver.userName || driver.userId || driver._id || "Unnamed Driver";
};

const getDriverLocation = (driver) => {
  if (typeof driver.location === "string") {
    return driver.location;
  }
  return driver.locationCity || driver.location?.city || "";
};

const scoreTextMatch = (text, query) => {
  if (!query) return 0;
  return String(text || "").toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
};

const scoreLocationMatch = (location, query) => {
  if (!query) return 0;
  return String(location || "").toLowerCase().includes(query.toLowerCase()) ? 2 : 0;
};

const scoreByFilters = (item, filters, kind) => {
  const location = item.location?.city || item.location || "";
  const rating = Number(item.ratingAvg || item.rating || 0);
  const monthlySalary = Number(item.expectedSalary?.monthly || item.monthlySalary || 0);
  const query = filters.query.trim();
  const locationQuery = filters.location.trim();
  const ratingFilter = filters.rating ? Number(filters.rating) : 0;
  const salaryFilter = filters.salary ? Number(filters.salary) : 0;

  let score = 0;
  score += scoreTextMatch(item.name || item.company, query) * 2;
  score += scoreLocationMatch(location, locationQuery);
  score += rating;

  if (ratingFilter && rating >= ratingFilter) {
    score += 5;
  }

  if (salaryFilter) {
    if (kind === "driver") {
      score += monthlySalary <= salaryFilter ? 4 : 0;
    } else {
      score += monthlySalary > 0 ? Math.max(0, 4 - Math.abs(monthlySalary - salaryFilter) / 10000) : 0;
    }
  }

  if (filters.workType && kind === "driver") {
    score += String(item.workType || "").toLowerCase().includes(filters.workType.toLowerCase()) ? 3 : 0;
  }

  return score;
};

const Marketplace = ({ currentRole }) => {
  const showDrivers = currentRole === "owner";
  const showEmployers = currentRole === "driver";
  const [filters, setFilters] = useState(defaultFilters);
  const [drivers, setDrivers] = useState([]);
  const [owners, setOwners] = useState(getPublicOwners());
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const refreshOwners = () => setOwners(getPublicOwners());
    refreshOwners();
    window.addEventListener("storage", refreshOwners);
    return () => window.removeEventListener("storage", refreshOwners);
  }, []);

  useEffect(() => {
    const fetchDrivers = async () => {
      if (!showDrivers) {
        return;
      }

      setLoadingDrivers(true);
      setError("");

      try {
        const res = await api.get("/drivers/search");
        setDrivers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load drivers");
      } finally {
        setLoadingDrivers(false);
      }
    };

    fetchDrivers();
  }, [showDrivers]);

  const rankedDrivers = useMemo(() => {
    return [...drivers]
      .filter((driver) => {
        const query = filters.query.trim().toLowerCase();
        if (!query) return true;
        const locationText = getDriverLocation(driver);
        return (
          String(getDriverName(driver)).toLowerCase().includes(query) ||
          String(locationText || "").toLowerCase().includes(query) ||
          String(driver.workType || "").toLowerCase().includes(query)
        );
      })
      .filter((driver) => {
        if (!filters.location) return true;
        const locationText = getDriverLocation(driver);
        return String(locationText || "").toLowerCase().includes(filters.location.toLowerCase());
      })
      .filter((driver) => {
        if (!filters.rating) return true;
        return Number(driver.ratingAvg || 0) >= Number(filters.rating);
      })
      .filter((driver) => {
        if (!filters.salary) return true;
        return Number(driver.expectedSalary?.monthly || 0) <= Number(filters.salary);
      })
      .filter((driver) => {
        if (!filters.workType) return true;
        return String(driver.workType || "").toLowerCase().includes(filters.workType.toLowerCase());
      })
      .sort((left, right) => scoreByFilters(right, filters, "driver") - scoreByFilters(left, filters, "driver"));
  }, [drivers, filters]);

  const rankedOwners = useMemo(() => {
    return [...owners]
      .filter((owner) => {
        const query = filters.query.trim().toLowerCase();
        if (!query) return true;
        const jobLocations = Array.isArray(owner.jobLocations) ? owner.jobLocations.join(" ") : String(owner.jobLocations || "");
        return (
          String(owner.name || "").toLowerCase().includes(query) ||
          String(owner.company || "").toLowerCase().includes(query) ||
          String(owner.location || "").toLowerCase().includes(query) ||
          jobLocations.toLowerCase().includes(query)
        );
      })
      .filter((owner) => {
        if (!filters.location) return true;
        const locationQuery = filters.location.toLowerCase();
        const jobLocations = Array.isArray(owner.jobLocations) ? owner.jobLocations : [];
        return (
          String(owner.location || "").toLowerCase().includes(locationQuery) ||
          jobLocations.some((jobLocation) => String(jobLocation || "").toLowerCase().includes(locationQuery))
        );
      })
      .sort((left, right) => scoreByFilters(right, filters, "owner") - scoreByFilters(left, filters, "owner"));
  }, [owners, filters]);

  const visibleItems = showDrivers ? rankedDrivers : rankedOwners;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <p style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.85, fontWeight: 700 }}>
          Scrolling marketplace
        </p>
        <h2 style={{ margin: "10px 0 8px", fontSize: "34px" }}>
          Browse drivers and employers with ranked recommendations
        </h2>
        <p style={{ margin: 0, maxWidth: "760px", lineHeight: 1.6, opacity: 0.92 }}>
          Use location, rating, salary, and work-type filters to prioritize the best matches. Drivers can browse employers; owners can browse drivers.
        </p>
      </div>

      <div style={{ ...panelStyle, marginBottom: "18px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ ...badgeStyle, backgroundColor: "#dcfce7", color: "#166534" }}>
            {showDrivers ? "Owner mode: drivers only" : "Driver mode: employers only"}
          </span>
        </div>

        <div style={filterGrid}>
          <input
            name="query"
            value={filters.query}
            onChange={handleChange}
            placeholder="Search by name, company, or city"
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
          <input
            name="salary"
            value={filters.salary}
            onChange={handleChange}
            type="number"
            min="0"
            placeholder="Target monthly salary"
            style={inputStyle}
          />
          <input
            name="workType"
            value={filters.workType}
            onChange={handleChange}
            placeholder="Work type"
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
            <h3 style={{ margin: 0 }}>{showDrivers ? "Available Drivers" : "Available Employers"}</h3>
            <p style={{ ...mutedStyle, margin: "6px 0 0" }}>
              Results are ranked by filter match, location, and rating priority.
            </p>
          </div>
          <span style={badgeStyle}>
            {loadingDrivers && showDrivers ? "Loading..." : `${visibleItems.length} results`}
          </span>
        </div>

        <div style={listStyle}>
          {showDrivers && rankedDrivers.map((driver, index) => {
            const score = scoreByFilters(driver, filters, "driver");
            return (
              <article key={driver._id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{driver.name || driver._id || "Unnamed Driver"}</h4>
                    <p style={{ ...mutedStyle, margin: "6px 0 0" }}>
                      {getDriverLocation(driver) || "Unknown city"} {driver.workType ? `• ${driver.workType}` : ""}
                    </p>
                    {getDriverLocation(driver) && (
                      <GoogleMapsLink
                        label="View on Google Maps"
                        query={getDriverLocation(driver)}
                        lat={driver.location?.coordinates?.lat}
                        lng={driver.location?.coordinates?.lng}
                        style={{ fontSize: "12px" }}
                      />
                    )}
                  </div>
                  <span style={badgeStyle}>Priority #{index + 1}</span>
                </div>

                <div style={metaStyle}>
                  <span style={badgeStyle}>{driver.ratingAvg?.toFixed(1) || "0.0"} rating</span>
                  <span style={badgeStyle}>{driver.experienceYears || 0} yrs experience</span>
                  <span style={badgeStyle}>Salary: {driver.expectedSalary?.monthly || 0}/month</span>
                  <span style={badgeStyle}>Status: {driver.status || "Available"}</span>
                </div>

                <p style={{ ...mutedStyle, marginBottom: 0 }}>
                  Recommendation score: {score.toFixed(1)}
                </p>
              </article>
            );
          })}

          {showEmployers && rankedOwners.map((owner, index) => {
            const score = scoreByFilters(owner, filters, "owner");
            const jobLocations = Array.isArray(owner.jobLocations) ? owner.jobLocations : [];
            return (
              <article key={owner.ownerId} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{owner.name || "Unnamed Owner"}</h4>
                    <p style={{ ...mutedStyle, margin: "6px 0 0" }}>
                      {owner.company || "No company name"}{owner.location ? ` • ${owner.location}` : ""}
                    </p>
                    {owner.location && <GoogleMapsLink label="View on Google Maps" query={owner.location} style={{ fontSize: "12px" }} />}
                  </div>
                  <span style={badgeStyle}>Priority #{index + 1}</span>
                </div>

                <div style={metaStyle}>
                  <span style={badgeStyle}>{Number(owner.ratingAvg || 0).toFixed(1)} rating</span>
                  <span style={badgeStyle}>{owner.totalReviews || 0} reviews</span>
                  <span style={badgeStyle}>{jobLocations.length ? jobLocations.join(", ") : "No job locations yet"}</span>
                </div>

                <p style={{ ...mutedStyle, marginBottom: "12px" }}>
                  {owner.description || "This owner has not added a public description yet."}
                </p>

                <Link to={`/owner-profile/${owner.ownerId}`} style={profileLinkStyle}>
                  View Owner Profile
                </Link>

                <p style={{ ...mutedStyle, marginBottom: 0 }}>
                  Recommendation score: {score.toFixed(1)}
                </p>
              </article>
            );
          })}

          {showDrivers && !loadingDrivers && rankedDrivers.length === 0 && (
            <p style={mutedStyle}>No drivers found for the current filters.</p>
          )}

          {showEmployers && rankedOwners.length === 0 && (
            <p style={mutedStyle}>No employers have published a profile yet. Ask an owner to save their profile first.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
