const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

export const buildOpenStreetMapSearchUrl = (query) => {
  const searchText = String(query || "").trim();

  if (!searchText) {
    return "https://www.openstreetmap.org";
  }

  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(searchText)}`;
};

export const buildOpenStreetMapCoordinatesUrl = (lat, lng, zoom = 16) => {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return buildOpenStreetMapSearchUrl("");
  }

  return `https://www.openstreetmap.org/#map=${Number(zoom) || 16}/${latitude}/${longitude}`;
};

export const searchOpenStreetMapPlaces = async (query, signal) => {
  const searchText = String(query || "").trim();

  if (searchText.length < 2) {
    return [];
  }

  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", searchText);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");

  const response = await fetch(url.toString(), { signal });

  if (!response.ok) {
    throw new Error("Unable to load OpenStreetMap suggestions");
  }

  return response.json();
};