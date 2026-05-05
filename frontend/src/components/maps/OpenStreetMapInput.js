import React, { useEffect, useRef, useState } from "react";
import { searchOpenStreetMapPlaces } from "../../utils/openStreetMap";

const FALLBACK_LOCATIONS = [
  "Dhaka",
  "Uttara, Dhaka",
  "Mirpur, Dhaka",
  "Dhanmondi, Dhaka",
  "Gulshan, Dhaka",
  "Banani, Dhaka",
  "Chattogram",
  "Cox's Bazar",
  "Sylhet",
  "Khulna",
  "Rajshahi",
  "Rangpur",
  "Barishal",
  "Mymensingh",
  "Narayanganj",
  "Gazipur",
  "Cumilla",
  "Noakhali",
  "Jashore",
  "Bogra",
];

const buildFallbackSuggestions = (query) => {
  const searchText = String(query || "").trim().toLowerCase();

  if (searchText.length < 2) {
    return [];
  }

  return FALLBACK_LOCATIONS.filter((location) => location.toLowerCase().includes(searchText))
    .slice(0, 6)
    .map((location) => ({
      display_name: location,
      name: location,
      lat: null,
      lon: null,
      source: "fallback",
    }));
};

const OpenStreetMapInput = ({
  name = "location",
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  style,
  ...rest
}) => {
  const idRef = useRef(Math.random().toString(36).slice(2, 9));
  const listboxId = `osm-${name}-${idRef.current}`;
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [inputValue, setInputValue] = useState(String(value || ""));
  const requestIdRef = useRef(0);

  useEffect(() => {
    setInputValue(String(value || ""));
  }, [value]);

  useEffect(() => {
    const searchText = String(inputValue || "").trim();

    if (searchText.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setError("");
      setActiveIndex(-1);
      return undefined;
    }

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const results = await searchOpenStreetMapPlaces(searchText, controller.signal);
        const fallbackResults = buildFallbackSuggestions(searchText);

        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        const mergedResults = [];
        const seen = new Set();

        [...(Array.isArray(results) ? results : []), ...fallbackResults].forEach((place) => {
          const address = place.display_name || place.name || "";

          if (!address || seen.has(address)) {
            return;
          }

          seen.add(address);
          mergedResults.push(place);
        });

        setSuggestions(mergedResults);
        setActiveIndex(mergedResults.length ? 0 : -1);
      } catch (fetchError) {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          const fallbackResults = buildFallbackSuggestions(searchText);

          setSuggestions(fallbackResults);
          setActiveIndex(fallbackResults.length ? 0 : -1);
          setError(fallbackResults.length ? "" : fetchError.message || "OpenStreetMap suggestions are unavailable.");
        }
      } finally {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [inputValue]);

  const handleChange = (event) => {
    setInputValue(event.target.value);

    if (onChange) {
      onChange(event);
    }
  };

  const emitSelection = (place) => {
    if (!place) return;

    const address = place.display_name || place.name || "";
    const latitude = Number(place.lat);
    const longitude = Number(place.lon);

    if (onPlaceSelected) {
      onPlaceSelected({
        address,
        lat: Number.isFinite(latitude) ? latitude : null,
        lng: Number.isFinite(longitude) ? longitude : null,
        place,
      });
    }

    setInputValue(address);

    if (onChange) {
      onChange({ target: { name, value: address } });
    }

    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!suggestions.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      emitSelection(suggestions[activeIndex]);
    }

    if (event.key === "Escape") {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        {...rest}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={style}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        aria-controls={listboxId}
      />

      {isLoading && (
        <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748b" }}>
          Loading OpenStreetMap suggestions...
        </p>
      )}

      {!isLoading && error && (
        <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#b45309" }}>
          {error}
        </p>
      )}

      {suggestions.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 20,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            maxHeight: "260px",
            overflowY: "auto",
            border: "1px solid #cbd5e1",
            borderRadius: "12px",
            backgroundColor: "#fff",
            boxShadow: "0 16px 28px rgba(15, 23, 42, 0.12)",
          }}
        >
          {suggestions.map((place, index) => {
            const address = place.display_name || place.name || "Unnamed place";
            const isActive = index === activeIndex;

            return (
              <button
                key={`${place.osm_id || address}-${index}`}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => emitSelection(place)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "none",
                  textAlign: "left",
                  backgroundColor: isActive ? "#ecfeff" : "#fff",
                  cursor: "pointer",
                  borderBottom: index === suggestions.length - 1 ? "none" : "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                  {address}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  OpenStreetMap result
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OpenStreetMapInput;