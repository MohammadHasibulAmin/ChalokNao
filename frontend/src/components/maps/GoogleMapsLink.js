import React from "react";

const buildOpenStreetMapSearchUrl = (query) => {
  if (!query) {
    return "https://www.openstreetmap.org";
  }

  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(String(query))}`;
};

const buildOpenStreetMapCoordinatesUrl = (lat, lng) => {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return buildOpenStreetMapSearchUrl("");
  }

  const latitude = Number(lat);
  const longitude = Number(lng);
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`;
};

const GoogleMapsLink = ({ label = "Open in OpenStreetMap", query, lat, lng, style }) => {
  const hasCoordinates = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const href = hasCoordinates ? buildOpenStreetMapCoordinatesUrl(lat, lng) : buildOpenStreetMapSearchUrl(query);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#0f766e", fontWeight: 700, textDecoration: "none", ...style }}
    >
      {label}
    </a>
  );
};

export default GoogleMapsLink;
