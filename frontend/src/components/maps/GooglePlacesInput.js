import React, { useEffect, useMemo, useState } from "react";

const OSM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

const panelStyle = {
  marginTop: "6px",
  maxHeight: "220px",
  overflowY: "auto",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#fff",
  boxShadow: "0 6px 14px rgba(15, 23, 42, 0.08)",
};

const optionStyle = {
  width: "100%",
  textAlign: "left",
  background: "none",
  border: "none",
  borderBottom: "1px solid #e2e8f0",
  padding: "10px",
  cursor: "pointer",
  fontSize: "13px",
};

const hintStyle = {
  margin: 0,
  padding: "10px",
  color: "#64748b",
  fontSize: "12px",
};

const GooglePlacesInput = ({ name = "location", value, onChange, onPlaceSelected, placeholder, style, ...rest }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const queryText = useMemo(() => String(value || "").trim(), [value]);

  useEffect(() => {
    if (queryText.length < 2) {
      setSuggestions([]);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const url = `${OSM_SEARCH_URL}?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(queryText)}`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("OpenStreetMap search failed");
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
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [queryText]);

  const handleSelect = (item) => {
    const nextValue = item?.display_name || "";
    const lat = Number(item?.lat);
    const lng = Number(item?.lon);

    if (onPlaceSelected) {
      onPlaceSelected({
        address: nextValue,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
      });
    }

    if (onChange) {
      onChange({ target: { name, value: nextValue } });
    }

    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder={placeholder}
        style={style}
        autoComplete="off"
        {...rest}
      />
      {showSuggestions && queryText.length >= 2 && (
        <div style={panelStyle}>
          {isSearching ? (
            <p style={hintStyle}>Searching OpenStreetMap...</p>
          ) : suggestions.length ? (
            suggestions.map((item) => (
              <button
                key={item.place_id}
                type="button"
                style={optionStyle}
                onClick={() => handleSelect(item)}
              >
                {item.display_name}
              </button>
            ))
          ) : (
            <p style={hintStyle}>No suggestions found.</p>
          )}
        </div>
      )}
      <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748b" }}>
        Suggestions are powered by OpenStreetMap.
      </p>
    </div>
  );
};

export default GooglePlacesInput;
