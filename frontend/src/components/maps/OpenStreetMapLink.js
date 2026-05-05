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