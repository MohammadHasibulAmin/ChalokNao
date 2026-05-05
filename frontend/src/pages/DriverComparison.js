import React, { useEffect, useState } from "react";
import api from "../services/api";
import OpenStreetMapLink from "../components/maps/OpenStreetMapLink";
import { getCompareDriverIds, getCompareDriverNames, setCompareDriverIds, toggleCompareDriverId } from "../utils/compareList";

const DriverComparison = () => {
  const [drivers, setDrivers] = useState([]);
  const [message, setMessage] = useState("");
  const [compareIds, setCompareIds] = useState(() => getCompareDriverIds());
  const [compareDrivers, setCompareDrivers] = useState([]);
  const [compareNamesMap, setCompareNamesMap] = useState(() => getCompareDriverNames());

  useEffect(() => {
    const refreshCompare = (event) => {
      const ids = Array.isArray(event?.detail) ? event.detail : getCompareDriverIds();
      setCompareIds(ids);
      setCompareNamesMap(getCompareDriverNames());
    };
    window.addEventListener("driver-compare-updated", refreshCompare);
    return () => window.removeEventListener("driver-compare-updated", refreshCompare);
  }, []);

  // no prefilling: only compare drivers explicitly added via "Add to compare"

  useEffect(() => {
    let mounted = true;
    const fetchCompareDrivers = async () => {
      if (!compareIds.length) {
        setCompareDrivers([]);
        return;
      }

      try {
        const results = await Promise.all(compareIds.map((id) => api.get(`/drivers/${id}`)));
        if (mounted) setCompareDrivers(results.map((r) => r.data));
      } catch (err) {
        if (mounted) setCompareDrivers([]);
      }
    };

    fetchCompareDrivers();
    return () => {
      mounted = false;
    };
  }, [compareIds]);

  const handleCompare = async () => {
    if (!compareIds || compareIds.length < 2) {
      setMessage("Please add at least 2 drivers using 'Add to compare'");
      return;
    }

    try {
      const results = await Promise.all(compareIds.map((id) => api.get(`/drivers/${id}`)));
      setDrivers(results.map((r) => r.data));
      setMessage("");
    } catch (err) {
      setMessage("Error fetching drivers — ensure selected drivers are valid");
    }
  };

  const attrs = [
    { key: "experienceYears", label: "Experience", get: (d) => d.experienceYears || 0, format: (v) => `${v} yrs` },
    { key: "ratingAvg", label: "Rating", get: (d) => (d.ratingAvg != null ? Number(d.ratingAvg) : null), format: (v) => (v != null ? v.toFixed(1) : "N/A") },
    { key: "expectedMonthly", label: "Monthly Salary", get: (d) => d.expectedSalary?.monthly || 0, format: (v) => `$${v}` },
    { key: "expectedDaily", label: "Daily Salary", get: (d) => d.expectedSalary?.daily || 0, format: (v) => `$${v}` },
    { key: "workType", label: "Work Type", get: (d) => d.workType || "-", format: (v) => v },
    { key: "status", label: "Status", get: (d) => d.status || "-", format: (v) => v },
    { key: "location", label: "Location", get: (d) => d.location?.city || "Not set", format: (v) => v },
  ];

  const diffs = React.useMemo(() => {
    if (!drivers || drivers.length <= 1) return {};
    const map = {};
    attrs.forEach((a) => {
      const vals = drivers.map((d) => {
        try {
          return String(a.get(d));
        } catch {
          return "";
        }
      });
      const allSame = vals.every((v) => v === vals[0]);
      map[a.key] = !allSame;
    });
    return map;
  // attrs is static in this component; including it in deps causes noise.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivers]);

  return (
    <div style={containerStyle}>
      <h2>Driver Comparison</h2>
      <p style={{ color: "#475569", marginTop: 0 }}>
        Compare drivers from your shortlist or any saved compare list.
      </p>
      {message && <p style={{ color: "red" }}>{message}</p>}

      {compareIds.length > 0 && (
        <div style={{ marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <strong style={{ color: "#334155" }}>Saved compare list:</strong>
          {compareIds.map((id, idx) => {
            const drv = compareDrivers.find((d) => String(d._id) === String(id));
            const label = drv?.name || compareNamesMap?.[id] || id;
            return (
              <div key={id} style={chipWrapperStyle}>
                <span
                  style={compareChipStyle}
                  title={drv ? `${drv.name} — ${drv.workType || ""}` : "Click to remove"}
                >
                  <span style={{ marginRight: 8 }}>{label}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${label}`}
                    onClick={() => {
                      const next = toggleCompareDriverId(id);
                      setCompareIds(next);
                      setCompareNamesMap(getCompareDriverNames());
                    }}
                    style={chipCloseButtonStyle}
                  >
                    ×
                  </button>
                </span>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setCompareDriverIds([]);
              setCompareIds([]);
              // no driverIds state anymore
            }}
            style={clearCompareButtonStyle}
          >
            Clear Compare List
          </button>
        </div>
      )}

      <div style={formStyle}>
        <p style={{ margin: 0, color: "#475569" }}>Use the "Add to compare" action when viewing drivers; selected drivers appear as chips below.</p>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button type="button" onClick={handleCompare} style={buttonStyle}>
            Compare Selected Drivers
          </button>
          <button
            type="button"
            onClick={() => {
              setDrivers([]);
              setMessage("");
            }}
            style={{ ...buttonStyle, backgroundColor: "#6b7280" }}
          >
            Clear Results
          </button>
        </div>
      </div>

      {drivers.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={cardContainerStyle}>
            {drivers.map((driver) => (
              <div key={driver._id} style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={driver.photo ? `/uploads/${driver.photo}` : "https://via.placeholder.com/72?text=No+Photo"} alt={driver.name} style={photoStyle} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{driver.name}</div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>{driver.workType || "-"} • {driver.status || "-"}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  {attrs.map((a) => {
                    const val = a.get(driver);
                    const formatted = a.format ? a.format(val) : String(val);
                    const isDiff = !!diffs[a.key];
                    return (
                      <div key={a.key} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ color: "#64748b" }}>{a.label}</div>
                        <div style={isDiff ? diffValueStyle : attrValueStyle}>{formatted}</div>
                      </div>
                    );
                  })}
                </div>

                {driver.location?.city && (
                  <div style={{ marginTop: 10 }}>
                    <OpenStreetMapLink label="View Map" query={driver.location.city} lat={driver.location?.coordinates?.lat} lng={driver.location?.coordinates?.lng} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const containerStyle = {
  maxWidth: "900px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const formStyle = { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" };
const buttonStyle = { padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };
// table styles removed — kept earlier table code replaced by card layout
const compareChipStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: "999px",
  backgroundColor: "#e0f2fe",
  color: "#075985",
  fontSize: "12px",
  fontWeight: 700,
};
const chipWrapperStyle = { display: "inline-block" };
const chipCloseButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#075985",
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
  marginLeft: 6,
};
const clearCompareButtonStyle = {
  padding: "8px 12px",
  backgroundColor: "#fff",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: "5px",
  cursor: "pointer",
};

const cardContainerStyle = {
  display: "flex",
  gap: 16,
  overflowX: "auto",
  paddingBottom: 8,
};

const cardStyle = {
  minWidth: 260,
  background: "#fff",
  borderRadius: 12,
  padding: 12,
  boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
  border: "1px solid #e6eef6",
};

const photoStyle = { width: 72, height: 72, objectFit: "cover", borderRadius: 8 };
const attrValueStyle = { fontWeight: 700 };
const diffValueStyle = { fontWeight: 800, color: "#b91c1c" };

export default DriverComparison;
