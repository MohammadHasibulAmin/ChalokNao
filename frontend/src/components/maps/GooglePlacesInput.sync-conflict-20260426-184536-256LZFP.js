import React, { useEffect, useRef, useState } from "react";
import { loadGoogleMapsPlaces } from "../../utils/googleMaps";

const GooglePlacesInput = ({ name = "location", value, onChange, onPlaceSelected, placeholder, style, ...rest }) => {
  const inputRef = useRef(null);
  const [mapsReady, setMapsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let autocomplete;
    let listener;

    loadGoogleMapsPlaces()
      .then((google) => {
        if (cancelled || !inputRef.current) return;

        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "name"],
        });

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const lat = place?.geometry?.location?.lat?.();
          const lng = place?.geometry?.location?.lng?.();
          const locationText = place?.formatted_address || place?.name || "";

          if (onPlaceSelected) {
            onPlaceSelected({
              address: locationText,
              lat: Number.isFinite(lat) ? lat : null,
              lng: Number.isFinite(lng) ? lng : null,
            });
          }

          if (onChange) {
            onChange({ target: { name, value: locationText } });
          }
        });

        setMapsReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setMapsReady(false);
        }
      });

    return () => {
      cancelled = true;
      if (listener?.remove) {
        listener.remove();
      }
    };
  }, [name, onChange, onPlaceSelected]);

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={style}
        {...rest}
      />
      {!mapsReady && (
        <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748b" }}>
          Google Maps autocomplete is unavailable. Add REACT_APP_GOOGLE_MAPS_API_KEY to enable it.
        </p>
      )}
    </div>
  );
};

export default GooglePlacesInput;
