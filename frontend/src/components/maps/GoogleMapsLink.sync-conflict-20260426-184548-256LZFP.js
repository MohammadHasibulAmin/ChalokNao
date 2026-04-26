import React from "react";
import { buildGoogleMapsCoordinatesUrl, buildGoogleMapsSearchUrl } from "../../utils/googleMaps";

const GoogleMapsLink = ({ label = "Open in Google Maps", query, lat, lng, style }) => {
  const hasCoordinates = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const href = hasCoordinates ? buildGoogleMapsCoordinatesUrl(lat, lng) : buildGoogleMapsSearchUrl(query);

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
