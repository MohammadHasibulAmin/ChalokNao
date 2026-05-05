import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import OpenStreetMapLink from "../components/maps/OpenStreetMapLink";
import OpenStreetMapInput from "../components/maps/OpenStreetMapInput";
import { getCompareDriverIds, toggleCompareDriverId } from "../utils/compareList";

const DriverPublicProfile = () => {
  const { driverId } = useParams();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [compareIds, setCompareIds] = useState(() => getCompareDriverIds());
  const [interviewType, setInterviewType] = useState("online");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewLocationLat, setInterviewLocationLat] = useState("");
  const [interviewLocationLng, setInterviewLocationLng] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isOwner = currentUser?.role === "owner";

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
        setInterviewLocation(res.data?.location?.city || "");
        setInterviewLocationLat(res.data?.location?.coordinates?.lat ? String(res.data.location.coordinates.lat) : "");
        setInterviewLocationLng(res.data?.location?.coordinates?.lng ? String(res.data.location.coordinates.lng) : "");
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load driver profile");
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, [driverId]);

  useEffect(() => {
    const refreshCompare = (event) => setCompareIds(Array.isArray(event?.detail) ? event.detail : getCompareDriverIds());
    window.addEventListener("driver-compare-updated", refreshCompare);
    return () => window.removeEventListener("driver-compare-updated", refreshCompare);
  }, []);

  const trainingBadges = useMemo(() => {
    return Array.isArray(driver?.trainingBadges) ? driver.trainingBadges : [];
  }, [driver?.trainingBadges]);

  const profileBadges = useMemo(() => {
    return Array.isArray(driver?.badges) ? driver.badges : [];
  }, [driver?.badges]);

  const handleRequestInterview = async (event) => {
    event.preventDefault();

    if (!isOwner || !currentUser?.id || !driver?._id) {
      setMessage("You must be logged in as an owner to request an interview.");
      return;
    }

    const newErrors = {};
    if (!interviewDate) newErrors.date = "Please choose an interview date.";
    if (interviewType === "offline" && !interviewLocation) newErrors.location = "Address is required for offline interviews.";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      setIsSubmitting(true);
      setMessage("");
      await api.post("/interviews/owner/interview", {
        ownerId: currentUser.id,
        driverId: driver._id,
        type: interviewType,
        date: interviewDate,
        location: interviewType === "offline" ? (interviewLocation || driver.location?.city || "") : null,
        locationLat: interviewType === "offline" ? interviewLocationLat : null,
        locationLng: interviewType === "offline" ? interviewLocationLng : null,
      });
      setMessage("Interview request sent.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to send interview request.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <OpenStreetMapLink
              label="View Location"
              query={driver.location.city}
              lat={driver.location?.coordinates?.lat}
              lng={driver.location?.coordinates?.lng}
            />
          </div>
        )}

        {isOwner && (
          <div style={ownerActionCardStyle}>
            <div style={ownerActionHeaderStyle}>
              <div>
                <h4 style={{ margin: 0 }}>Owner Actions</h4>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                  Shortlist this driver, request an interview, or add them to your compare list.
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleCompareDriverId(driver._id, driver.name)}
                style={compareIds.includes(String(driver._id)) ? actionPrimaryButtonStyle : actionOutlineButtonStyle}
              >
                {compareIds.includes(String(driver._id)) ? "Remove from Compare" : "Add to Compare"}
              </button>
            </div>

            {/* Shortlist handled from Marketplace/Shortlist — removed button here */}

            <form onSubmit={handleRequestInterview} style={{ marginTop: "14px" }}>
              <div style={ownerFormGridStyle}>
                <div>
                  <label style={ownerLabelStyle} htmlFor="interviewType">Interview Type</label>
                  <select
                    id="interviewType"
                    value={interviewType}
                    onChange={(event) => setInterviewType(event.target.value)}
                    style={ownerInputStyle}
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="chat">Chat</option>
                  </select>
                </div>

                <div>
                  <label style={ownerLabelStyle} htmlFor="interviewDate">Interview Date</label>
                  <input
                    id="interviewDate"
                    type="datetime-local"
                    value={interviewDate}
                    onChange={(event) => setInterviewDate(event.target.value)}
                    style={errors.date ? { ...ownerInputStyle, borderColor: "#ef4444" } : ownerInputStyle}
                  />
                  {errors.date && <div style={{ color: "#b91c1c", fontSize: 13 }}>{errors.date}</div>}
                </div>

                {interviewType === "offline" && (
                  <div>
                    <label style={ownerLabelStyle} htmlFor="interviewLocation">Interview Location</label>
                    <OpenStreetMapInput
                      name="interviewLocation"
                      placeholder="Address (required for offline interviews)"
                      value={interviewLocation}
                      onChange={(e) => setInterviewLocation(e.target.value)}
                      onPlaceSelected={({ address, lat, lng }) => {
                        setInterviewLocation(address || interviewLocation);
                        setInterviewLocationLat(Number.isFinite(lat) ? String(lat) : interviewLocationLat);
                        setInterviewLocationLng(Number.isFinite(lng) ? String(lng) : interviewLocationLng);
                      }}
                      style={errors.location ? { ...ownerInputStyle, borderColor: "#ef4444" } : ownerInputStyle}
                    />

                    {!!interviewLocation && (
                      <OpenStreetMapLink
                        label="Check location in OpenStreetMap"
                        query={interviewLocation}
                        lat={interviewLocationLat}
                        lng={interviewLocationLng}
                      />
                    )}
                    {errors.location && <div style={{ color: "#b91c1c", fontSize: 13 }}>{errors.location}</div>}
                  </div>
                )}
              </div>

              <button type="submit" disabled={isSubmitting} style={{ ...actionPrimaryButtonStyle, marginTop: "12px" }}>
                {isSubmitting ? "Sending..." : "Request Interview"}
              </button>
            </form>
          </div>
        )}
      </section>

      {message && <p style={{ marginTop: "12px", color: "#0f766e", fontWeight: 700 }}>{message}</p>}

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

const ownerActionCardStyle = {
  marginTop: "14px",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid rgba(11, 128, 116, 0.08)",
  backgroundColor: "#ffffff",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
};

const ownerActionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  alignItems: "flex-start",
};



const ownerFormGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "10px",
};

const ownerLabelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "6px",
  color: "#334155",
};

const ownerInputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  backgroundColor: "#fff",
};

const actionPrimaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#0ea5a0",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(14,165,160,0.12)",
  transition: "transform .08s ease, box-shadow .12s ease",
};

const actionOutlineButtonStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(15,118,110,0.12)",
  backgroundColor: "#fff",
  color: "#0f766e",
  fontWeight: 700,
  cursor: "pointer",
  transition: "background-color .12s ease, transform .08s ease",
};

export default DriverPublicProfile;
