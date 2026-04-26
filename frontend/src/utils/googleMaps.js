const GOOGLE_MAPS_SCRIPT_ID = "chaloknao-google-maps-script";
let mapsScriptPromise;

export const getGoogleMapsApiKey = () => {
  return process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";
};

export const loadGoogleMapsPlaces = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is unavailable"));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (mapsScriptPromise) {
    return mapsScriptPromise;
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("Missing REACT_APP_GOOGLE_MAPS_API_KEY"));
  }

  mapsScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google));
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));

    document.head.appendChild(script);
  });

  return mapsScriptPromise;
};

export const buildGoogleMapsSearchUrl = (query) => {
  if (!query) {
    return "https://www.google.com/maps";
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(query))}`;
};

export const buildGoogleMapsCoordinatesUrl = (lat, lng) => {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return buildGoogleMapsSearchUrl("");
  }

  return `https://www.google.com/maps/search/?api=1&query=${Number(lat)},${Number(lng)}`;
};
