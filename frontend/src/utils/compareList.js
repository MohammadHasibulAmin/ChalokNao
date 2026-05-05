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
const compareStorageKey = "chaloknao_compare_driver_ids";
const compareNamesKey = "chaloknao_compare_driver_names";

export const getCompareDriverIds = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(compareStorageKey) || "[]");
    return Array.isArray(parsed) ? parsed.map((id) => String(id)).filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const getCompareDriverNames = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(compareNamesKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const setCompareDriverNames = (map) => {
  try {
    localStorage.setItem(compareNamesKey, JSON.stringify(map || {}));
  } catch {
    // ignore
  }
};

export const setCompareDriverIds = (driverIds) => {
  const uniqueIds = Array.from(new Set((Array.isArray(driverIds) ? driverIds : []).map((id) => String(id)).filter(Boolean)));
  localStorage.setItem(compareStorageKey, JSON.stringify(uniqueIds));

  // prune names map to only include current ids
  const nameMap = getCompareDriverNames();
  const pruned = {};
  uniqueIds.forEach((id) => {
    if (nameMap[id]) pruned[id] = nameMap[id];
  });
  setCompareDriverNames(pruned);

  window.dispatchEvent(new CustomEvent("driver-compare-updated", { detail: uniqueIds }));
  return uniqueIds;
};

export const toggleCompareDriverId = (driverId, driverName) => {
  const currentIds = getCompareDriverIds();
  const idStr = String(driverId);
  const isPresent = currentIds.includes(idStr);
  const nextIds = isPresent ? currentIds.filter((id) => id !== idStr) : [...currentIds, idStr];

  // update names map
  const nameMap = getCompareDriverNames();
  if (isPresent) {
    // remove
    if (nameMap[idStr]) {
      delete nameMap[idStr];
    }
  } else if (driverName) {
    nameMap[idStr] = driverName;
  }

  setCompareDriverNames(nameMap);
  return setCompareDriverIds(nextIds);
};

export const isDriverCompared = (driverId) => {
  return getCompareDriverIds().includes(String(driverId));
};
