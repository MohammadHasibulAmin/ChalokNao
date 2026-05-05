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
import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import OpenStreetMapLink from "../components/maps/OpenStreetMapLink";
import { getCompareDriverIds, toggleCompareDriverId } from "../utils/compareList";

const Shortlist = () => {
  const [shortlist, setShortlist] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [message, setMessage] = useState("");
  const [compareIds, setCompareIds] = useState(() => getCompareDriverIds());

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const loadShortlist = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await api.get(`/owner/shortlist/${userId}`);
      const driverIds = Array.isArray(res.data?.driverIds) ? res.data.driverIds.map(String) : [];
      setShortlist(driverIds);

      if (driverIds.length) {
        const driverResults = await Promise.all(driverIds.map((id) => api.get(`/drivers/${id}`).catch(() => null)));
        setDrivers(driverResults.filter(Boolean).map((result) => result.data));
      } else {
        setDrivers([]);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Error loading shortlist");
    }
  }, [userId]);

  useEffect(() => {
    loadShortlist();
  }, [userId, loadShortlist]);

  useEffect(() => {
    const refreshCompare = (event) => setCompareIds(Array.isArray(event?.detail) ? event.detail : getCompareDriverIds());
    window.addEventListener("driver-compare-updated", refreshCompare);
    return () => window.removeEventListener("driver-compare-updated", refreshCompare);
  }, []);

  const shortlistCountText = useMemo(() => {
    return shortlist.length ? `${shortlist.length} shortlisted driver${shortlist.length === 1 ? "" : "s"}` : "No shortlisted drivers yet.";
  }, [shortlist.length]);


  const handleRemoveFromShortlist = async (driverId) => {
    try {
      const res = await api.delete(`/owner/shortlist/${userId}/${driverId}`);
      setShortlist(Array.isArray(res.data?.driverIds) ? res.data.driverIds.map(String) : []);
      setMessage("Driver removed from shortlist.");
      await loadShortlist();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error removing from shortlist");
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Driver Shortlist</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <p style={{ color: "#475569", marginTop: 0 }}>{shortlistCountText}</p>

      <div style={{ marginTop: "20px" }}>
        <h3>Shortlisted Drivers</h3>
        {drivers.length === 0 ? (
          <p>No shortlisted drivers yet.</p>
        ) : (
          drivers.map((driver) => (
            <div key={driver._id} style={listItemStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <h4 style={{ margin: 0 }}>{driver.name || "Unnamed Driver"}</h4>
                  <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                    {driver.location?.city || "Location not set"}{driver.workType ? ` • ${driver.workType}` : ""}
                  </p>
                  {driver.location?.city && (
                    <OpenStreetMapLink
                      label="View in OpenStreetMap"
                      query={driver.location.city}
                      lat={driver.location?.coordinates?.lat}
                      lng={driver.location?.coordinates?.lng}
                      style={{ fontSize: "12px" }}
                    />
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Link to={`/driver/${driver._id}`} style={{ ...compareButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '10px 12px' }}>View Profile</Link>
                    <button
                      type="button"
                      onClick={() => toggleCompareDriverId(driver._id, driver.name)}
                      style={compareIds.includes(String(driver._id)) ? compareActiveButtonStyle : compareButtonStyle}
                    >
                      {compareIds.includes(String(driver._id)) ? "Remove from Compare" : "Add to Compare"}
                    </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromShortlist(driver._id)}
                    style={{ padding: "10px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
                  >
                    Remove from Shortlist
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual add removed — shortlist drivers from Marketplace */}
    </div>
  );
};

const containerStyle = {
  maxWidth: "600px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid rgba(242,240,236,0.12)",
  borderRadius: "8px",
  backgroundColor: "#0D0D0D",
};


const listItemStyle = { padding: "12px", border: "1px solid rgba(242,240,236,0.12)", borderRadius: "5px", marginBottom: "10px", backgroundColor: "#141414" };
const compareButtonStyle = { padding: "10px", backgroundColor: "#141414", color: "#F2F0EC", border: "1px solid rgba(242,240,236,0.14)", borderRadius: "5px", cursor: "pointer" };
const compareActiveButtonStyle = { ...compareButtonStyle, backgroundColor: "#4ABB78", color: "#111", borderColor: "#4ABB78" };

export default Shortlist;
