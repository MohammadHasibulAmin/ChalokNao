import React, { useMemo, useState } from "react";
import api from "../services/api";
import OpenStreetMapInput from "../components/maps/OpenStreetMapInput";
import OpenStreetMapLink from "../components/maps/OpenStreetMapLink";

const Location = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const initialServiceAreas = useMemo(() => {
    const storedServiceAreas = Array.isArray(user?.location?.serviceAreas) ? user.location.serviceAreas : [];

    if (storedServiceAreas.length > 0) {
      return storedServiceAreas
        .map((area) => ({
          city: String(area?.city || area?.name || "").trim(),
          coordinates: {
            lat: Number.isFinite(Number(area?.coordinates?.lat)) ? Number(area.coordinates.lat) : null,
            lng: Number.isFinite(Number(area?.coordinates?.lng)) ? Number(area.coordinates.lng) : null,
          },
        }))
        .filter((area) => area.city);
    }

    const primaryCity = String(user?.location?.city || "").trim();

    return primaryCity
      ? [
          {
            city: primaryCity,
            coordinates: {
              lat: Number.isFinite(Number(user?.location?.coordinates?.lat)) ? Number(user.location.coordinates.lat) : null,
              lng: Number.isFinite(Number(user?.location?.coordinates?.lng)) ? Number(user.location.coordinates.lng) : null,
            },
          },
        ]
      : [];
  }, [user]);

  const [serviceAreas, setServiceAreas] = useState(initialServiceAreas);
  const [draftLocation, setDraftLocation] = useState("");
  const [draftCoordinates, setDraftCoordinates] = useState({ lat: null, lng: null });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name !== "city") {
      return;
    }

    setDraftLocation(value);

    if (e.nativeEvent) {
      setDraftCoordinates({ lat: null, lng: null });
    }
  };

  const syncServiceAreas = async (nextServiceAreas) => {
    try {
      await api.post("/drivers/location", {
        userId,
        city: nextServiceAreas[0]?.city || "",
        lat: nextServiceAreas[0]?.coordinates?.lat ?? null,
        lng: nextServiceAreas[0]?.coordinates?.lng ?? null,
        serviceAreas: nextServiceAreas,
      });
      setMessage(`Saved ${nextServiceAreas.length} service area${nextServiceAreas.length === 1 ? "" : "s"}.`);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error updating location");
    }
  };

  const handleAddLocation = async () => {
    const trimmedLocation = draftLocation.trim();

    if (!trimmedLocation) {
      setMessage("Type a location before adding it.");
      return;
    }

    const nextServiceAreas = [
      ...serviceAreas.filter((area) => area.city.toLowerCase() !== trimmedLocation.toLowerCase()),
      {
        city: trimmedLocation,
        coordinates: draftCoordinates,
      },
    ];

    setServiceAreas(nextServiceAreas);
    setDraftLocation("");
    setDraftCoordinates({ lat: null, lng: null });
    await syncServiceAreas(nextServiceAreas);
  };

  const handleDeleteLocation = async (indexToDelete) => {
    const nextServiceAreas = serviceAreas.filter((_, index) => index !== indexToDelete);

    setServiceAreas(nextServiceAreas);
    await syncServiceAreas(nextServiceAreas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (draftLocation.trim()) {
      await handleAddLocation();
      return;
    }

    await syncServiceAreas(serviceAreas);
  };

  return (
    <div style={containerStyle}>
      <h2>Location & Service Area</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputRowStyle}>
          <OpenStreetMapInput
            name="city"
            value={draftLocation}
            onChange={handleChange}
            onPlaceSelected={({ address, lat, lng }) => {
              setDraftLocation(address || "");
              setDraftCoordinates({
                lat: Number.isFinite(Number(lat)) ? Number(lat) : null,
                lng: Number.isFinite(Number(lng)) ? Number(lng) : null,
              });
            }}
            placeholder="Search city or service area"
            style={inputStyle}
          />
          <button type="button" onClick={handleAddLocation} style={secondaryButtonStyle}>
            Add Location
          </button>
        </div>

        <div style={listStyle}>
          <h3 style={{ margin: 0 }}>Service Areas</h3>
          {serviceAreas.length === 0 ? (
            <p style={{ margin: 0, color: "#64748b" }}>No service areas added yet.</p>
          ) : (
            <ul style={locationListStyle}>
              {serviceAreas.map((location, index) => (
                <li key={`${location.city}-${index}`} style={locationItemStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{location.city}</div>
                  </div>
                  <div style={locationActionsStyle}>
                    <OpenStreetMapLink label="Open" query={location.city} lat={location.coordinates?.lat} lng={location.coordinates?.lng} style={{ fontSize: "13px" }} />
                    <button type="button" onClick={() => handleDeleteLocation(index)} style={deleteButtonStyle}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </div>
  );
};

const containerStyle = {
  maxWidth: "600px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const formStyle = { display: "flex", flexDirection: "column", gap: "12px" };
const inputRowStyle = { display: "flex", gap: "10px", alignItems: "flex-start", flexWrap: "wrap" };
const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#fff",
};
const locationListStyle = { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" };
const locationItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 12px",
  borderRadius: "8px",
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  alignItems: "center",
};
const locationActionsStyle = { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" };
const inputStyle = { flex: "1 1 260px", width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" };
const secondaryButtonStyle = { padding: "10px 14px", backgroundColor: "#0f766e", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };
const deleteButtonStyle = { padding: "8px 12px", backgroundColor: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "5px", cursor: "pointer" };

export default Location;
