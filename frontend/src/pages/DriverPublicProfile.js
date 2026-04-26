import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import GoogleMapsLink from "../components/maps/GoogleMapsLink";

const DriverPublicProfile = () => {
  const { driverId } = useParams();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDriver = async () => {
      if (!driverId) {
        setError("Driver profile id is missing.");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/drivers/${driverId}`);
        setDriver(res.data || null);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load driver profile");
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, [driverId]);

  const trainingBadges = useMemo(() => {
    return Array.isArray(driver?.trainingBadges) ? driver.trainingBadges : [];
  }, [driver?.trainingBadges]);

  const profileBadges = useMemo(() => {
    return Array.isArray(driver?.badges) ? driver.badges : [];
  }, [driver?.badges]);

  if (loading) {
    return <div style={containerStyle}><p>Loading driver profile...</p></div>;
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "#b91c1c" }}>{error}</p>
        <Link to="/marketplace" style={backLinkStyle}>Back to marketplace</Link>
      </div>
    );
  }

  if (!driver) {
    return (
      <div style={containerStyle}>
        <p>Driver profile not found.</p>
        <Link to="/marketplace" style={backLinkStyle}>Back to marketplace</Link>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={heroStyle}>
        <p style={eyebrowStyle}>Driver Profile</p>
        <h2 style={{ margin: "8px 0" }}>{driver.name || "Unnamed Driver"}</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          {driver.location?.city || "Location not set"} {driver.workType ? `• ${driver.workType}` : ""}
        </p>
      </div>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Training Progress</h3>
        <div style={statsRowStyle}>
          <span style={metricPillStyle}>Completion: {Number(driver.trainingSummary?.completionRate || 0)}%</span>
          <span style={metricPillStyle}>Avg Score: {Number(driver.trainingSummary?.avgScore || 0)}</span>
          <span style={metricPillStyle}>Certificates: {Number(driver.trainingSummary?.certificateCount || 0)}</span>
          <span style={metricPillStyle}>{driver.trainingSummary?.isTrained ? "Trained Driver" : "In Training"}</span>
        </div>

        <h4 style={subTitleStyle}>Training Badges</h4>
        {trainingBadges.length ? (
          <div style={badgeWrapStyle}>
            {trainingBadges.map((badge) => (
              <span key={badge} style={trainingBadgeStyle}>{badge}</span>
            ))}
          </div>
        ) : (
          <p style={mutedStyle}>No training badges earned yet.</p>
        )}
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Driver Highlights</h3>
        <div style={statsRowStyle}>
          <span style={metricPillStyle}>{Number(driver.ratingAvg || 0).toFixed(1)} rating</span>
          <span style={metricPillStyle}>{Number(driver.experienceYears || 0)} years experience</span>
          <span style={metricPillStyle}>Status: {driver.status || "Available"}</span>
        </div>

        {profileBadges.length ? (
          <>
            <h4 style={subTitleStyle}>Experience Badges</h4>
            <div style={badgeWrapStyle}>
              {profileBadges.map((badge) => (
                <span key={badge} style={profileBadgeStyle}>{badge}</span>
              ))}
            </div>
          </>
        ) : null}

        {driver.location?.city && (
          <div style={{ marginTop: "10px" }}>
            <GoogleMapsLink
              label="View Location"
              query={driver.location.city}
              lat={driver.location?.coordinates?.lat}
              lng={driver.location?.coordinates?.lng}
            />
          </div>
        )}
      </section>

      <Link to="/marketplace" style={backLinkStyle}>Back to marketplace</Link>
    </div>
  );
};

const containerStyle = {
  maxWidth: "920px",
  margin: "20px auto",
  padding: "20px",
};

const heroStyle = {
  borderRadius: "16px",
  padding: "18px",
  marginBottom: "14px",
  color: "#fff",
  background: "linear-gradient(135deg, #0f172a, #0f766e)",
};

const eyebrowStyle = {
  margin: 0,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontSize: "12px",
  opacity: 0.8,
};

const cardStyle = {
  borderRadius: "14px",
  border: "1px solid #dbe5ef",
  backgroundColor: "#fff",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.05)",
  padding: "16px",
  marginBottom: "12px",
};

const sectionTitleStyle = { margin: 0, marginBottom: "8px" };
const subTitleStyle = { marginTop: "14px", marginBottom: "8px", fontSize: "15px" };
const mutedStyle = { color: "#64748b", margin: 0 };

const statsRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const metricPillStyle = {
  padding: "5px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#1f2937",
  backgroundColor: "#e2e8f0",
};

const badgeWrapStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const trainingBadgeStyle = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#166534",
  backgroundColor: "#dcfce7",
  border: "1px solid #86efac",
};

const profileBadgeStyle = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#0f5f8f",
  backgroundColor: "#e0f2fe",
  border: "1px solid #7dd3fc",
};

const backLinkStyle = {
  display: "inline-block",
  textDecoration: "none",
  marginTop: "8px",
  color: "#0f766e",
  fontWeight: 700,
};

export default DriverPublicProfile;
