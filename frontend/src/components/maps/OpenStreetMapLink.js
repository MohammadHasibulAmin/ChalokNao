import React from "react";
import {
  buildOpenStreetMapCoordinatesUrl,
  buildOpenStreetMapSearchUrl,
} from "../../utils/openStreetMap";

const OpenStreetMapLink = ({ label = "Open in OpenStreetMap", query, lat, lng, style }) => {
  const hasCoordinates = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const href = hasCoordinates
    ? buildOpenStreetMapCoordinatesUrl(lat, lng)
    : buildOpenStreetMapSearchUrl(query);

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

export default OpenStreetMapLink;