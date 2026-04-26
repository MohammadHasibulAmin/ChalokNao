import React, { useEffect, useState } from "react";
import api from "../services/api";

const OSM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

const Location = () => {
  const [draftLocation, setDraftLocation] = useState({
    city: "",
    lat: "",
    lng: "",
  });
  const [serviceAreas, setServiceAreas] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const handleDraftChange = (e) => {
    setDraftLocation({ ...draftLocation, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const loadSavedLocations = async () => {
      if (!userId) {
        setIsLoadingSaved(false);
        return;
      }

      try {
        const response = await api.get("/drivers/search");
        const currentDriver = Array.isArray(response.data)
          ? response.data.find((driver) => String(driver.userId) === String(userId))
          : null;

        const existingAreas = Array.isArray(currentDriver?.serviceAreas)
          ? currentDriver.serviceAreas
              .map((item) => ({
                name: item?.name || "",
                lat: item?.lat ? String(item.lat) : "",
                lng: item?.lng ? String(item.lng) : "",
              }))
              .filter((item) => item.name)
          : [];

        if (existingAreas.length) {
          setServiceAreas(existingAreas);
        } else if (currentDriver?.location?.city) {
          setServiceAreas([
            {
              name: currentDriver.location.city,
              lat: currentDriver?.location?.coordinates?.lat ? String(currentDriver.location.coordinates.lat) : "",
              lng: currentDriver?.location?.coordinates?.lng ? String(currentDriver.location.coordinates.lng) : "",
            },
          ]);
        }
      } catch (err) {
        setMessage(err.response?.data?.message || "Error loading saved service areas");
        setMessageType("error");
      } finally {
        setIsLoadingSaved(false);
      }
    };

    loadSavedLocations();
  }, [userId]);

  useEffect(() => {
    const searchText = draftLocation.city.trim();
    if (searchText.length < 2) {
      setSuggestions([]);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const url = `${OSM_SEARCH_URL}?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(searchText)}`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Suggestion fetch failed");
        }

        const data = await response.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [draftLocation.city]);

  const handleSuggestionSelect = (item) => {
    setDraftLocation((current) => ({
      ...current,
      city: item.display_name || current.city,
      lat: item.lat || current.lat,
      lng: item.lon || current.lng,
    }));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const persistServiceAreas = async (nextAreas) => {
    if (!userId) {
      setMessage("User not found. Please login first.");
      setMessageType("error");
      return false;
    }

    try {
      await api.post("/drivers/location", {
        userId,
        serviceAreas: nextAreas,
      });
      setMessage("Service areas updated successfully!");
      setMessageType("success");
      return true;
    } catch (err) {
      setMessage(err.response?.data?.message || "Error updating location");
      setMessageType("error");
      return false;
    }
  };

  const addLocation = async () => {
    const trimmedName = draftLocation.city.trim();
    if (!trimmedName) {
      setMessage("Type and select a service area first.");
      setMessageType("error");
      return;
    }

    const alreadyExists = serviceAreas.some(
      (item) => String(item.name || "").toLowerCase() === trimmedName.toLowerCase()
    );
    if (alreadyExists) {
      setMessage("This location is already added.");
      setMessageType("error");
      return;
    }

    const nextAreas = [
      ...serviceAreas,
      {
        name: trimmedName,
        lat: draftLocation.lat,
        lng: draftLocation.lng,
      },
    ];

    const saved = await persistServiceAreas(nextAreas);
    if (!saved) {
      return;
    }

    setServiceAreas(nextAreas);
    setDraftLocation({ city: "", lat: "", lng: "" });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const removeLocation = async (index) => {
    const nextAreas = serviceAreas.filter((_, itemIndex) => itemIndex !== index);
    const saved = await persistServiceAreas(nextAreas);
    if (!saved) {
      return;
    }

    setServiceAreas(nextAreas);
  };

  return (
    <div style={containerStyle}>
      <h2>Location & Service Area</h2>
      {message && <p style={{ color: messageType === "error" ? "#b91c1c" : "#166534" }}>{message}</p>}

      <div style={formStyle}>
        <div style={autocompleteWrapStyle}>
          <input
            type="text"
            name="city"
            placeholder="Type service area (city, zone, district)"
            value={draftLocation.city}
            onChange={handleDraftChange}
            onFocus={() => setShowSuggestions(true)}
            style={inputStyle}
            autoComplete="off"
          />
          {showSuggestions && (draftLocation.city.trim().length >= 2) && (
            <div style={suggestionPanelStyle}>
              {isSearching ? (
                <div style={suggestionHintStyle}>Searching OpenStreetMap...</div>
              ) : suggestions.length ? (
                suggestions.map((item) => (
                  <button
                    key={item.place_id}
                    type="button"
                    style={suggestionButtonStyle}
                    onClick={() => handleSuggestionSelect(item)}
                  >
                    <span style={suggestionTitleStyle}>{item.display_name}</span>
                  </button>
                ))
              ) : (
                <div style={suggestionHintStyle}>No suggestions found.</div>
              )}
            </div>
          )}
        </div>
        <button type="button" onClick={addLocation} style={addButtonStyle}>
          Add Service Area
        </button>
        <p style={{ fontSize: "12px", color: "#666" }}>
          Add one or more service areas. Suggestions come from OpenStreetMap.
        </p>

        <div style={listWrapStyle}>
          <h3 style={listHeadingStyle}>Added Service Areas</h3>
          {isLoadingSaved ? (
            <p style={listInfoStyle}>Loading saved locations...</p>
          ) : serviceAreas.length === 0 ? (
            <p style={listInfoStyle}>No service area added yet.</p>
          ) : (
            serviceAreas.map((item, index) => (
              <div key={`${item.name}-${index}`} style={listItemStyle}>
                <div>{item.name}</div>
                <a
                  href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(item.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={previewLinkStyle}
                >
                  View
                </a>
                <button type="button" onClick={() => removeLocation(index)} style={removeButtonStyle}>
                  🗑
                </button>
              </div>
            ))
          )}
        </div>
      </div>
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

const formStyle = { display: "flex", flexDirection: "column", gap: "10px" };
const inputStyle = { padding: "10px", borderRadius: "5px", border: "1px solid #ccc" };
const addButtonStyle = { padding: "10px", backgroundColor: "#0f766e", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };
const removeButtonStyle = { padding: "8px 10px", backgroundColor: "#e2e8f0", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "5px", cursor: "pointer", fontSize: "16px", lineHeight: 1 };
const listWrapStyle = { marginTop: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px", backgroundColor: "#fff" };
const listHeadingStyle = { margin: "0 0 8px" };
const listInfoStyle = { margin: 0, color: "#64748b" };
const listItemStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  gap: "8px",
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid #f1f5f9",
};
const autocompleteWrapStyle = { position: "relative" };
const suggestionPanelStyle = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  zIndex: 20,
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  backgroundColor: "#fff",
  boxShadow: "0 10px 24px rgba(0, 0, 0, 0.12)",
  maxHeight: "240px",
  overflowY: "auto",
};
const suggestionButtonStyle = {
  width: "100%",
  border: "none",
  background: "transparent",
  textAlign: "left",
  padding: "10px 12px",
  cursor: "pointer",
  borderBottom: "1px solid #f1f5f9",
};
const suggestionTitleStyle = { color: "#0f172a", fontSize: "13px", lineHeight: 1.4 };
const suggestionHintStyle = { padding: "10px 12px", color: "#64748b", fontSize: "13px" };
const previewLinkStyle = {
  display: "inline-block",
  color: "#1d4ed8",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "14px",
};

export default Location;
