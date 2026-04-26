import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import GoogleMapsLink from "../components/maps/GoogleMapsLink";
import GooglePlacesInput from "../components/maps/GooglePlacesInput";

const getProfileStorageKey = (ownerId) => {
  return `chaloknao_owner_profile_${ownerId || "anonymous"}`;
};

const getFeedbackStorageKey = (ownerId) => {
  return `chaloknao_owner_feedback_${ownerId || "anonymous"}`;
};

const publicDirectoryKey = "chaloknao_public_owner_directory";

const defaultFeedback = [];

const cardStyle = {
  maxWidth: "980px",
  margin: "24px auto",
  padding: "24px",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const panelStyle = {
  padding: "16px",
  borderRadius: "14px",
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "6px",
  color: "#334155",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  marginBottom: "12px",
};

const buttonStyle = {
  padding: "12px 16px",
  border: "none",
  borderRadius: "10px",
  backgroundColor: "#0f766e",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const badgeStyle = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "999px",
  backgroundColor: "#e0f2fe",
  color: "#075985",
  fontSize: "12px",
  fontWeight: 700,
  marginRight: "8px",
  marginBottom: "8px",
};

const baseProfileFromUser = (currentUser, useCurrentUserDefaults) => ({
  name: useCurrentUserDefaults ? currentUser?.name || "" : "",
  email: useCurrentUserDefaults ? currentUser?.email || "" : "",
  company: "",
  location: "",
  phone: "",
  jobLocations: "",
  description: "",
});

const normalizeProfileForPublicView = (profile, currentUser, feedbackList) => {
  const jobLocations = Array.isArray(profile.jobLocations)
    ? profile.jobLocations
    : String(profile.jobLocations || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const ratingAvg = feedbackList.length
    ? feedbackList.reduce((sum, entry) => sum + Number(entry.rating || 0), 0) / feedbackList.length
    : 0;

  return {
    ownerId: currentUser?.id || currentUser?.email || "anonymous",
    name: profile.name || currentUser?.name || "Unnamed Owner",
    company: profile.company || "",
    location: profile.location || "",
    phone: profile.phone || "",
    email: profile.email || currentUser?.email || "",
    jobLocations,
    description: profile.description || "",
    ratingAvg,
    totalReviews: feedbackList.length,
    updatedAt: new Date().toISOString(),
  };
};

const publishOwnerProfile = (currentUser, profile, feedbackList) => {
  const savedDirectory = JSON.parse(localStorage.getItem(publicDirectoryKey) || "[]");
  const nextEntry = normalizeProfileForPublicView(profile, currentUser, feedbackList);
  const filteredDirectory = Array.isArray(savedDirectory)
    ? savedDirectory.filter((entry) => entry.ownerId !== nextEntry.ownerId)
    : [];

  localStorage.setItem(publicDirectoryKey, JSON.stringify([nextEntry, ...filteredDirectory]));
};

const OwnerProfile = ({ currentRole, currentUser }) => {
  const { ownerId: ownerIdFromRoute } = useParams();
  const currentOwnerId = currentUser?.id || currentUser?.email || "anonymous";
  const profileOwnerId = ownerIdFromRoute || currentOwnerId;
  const profileStorageKey = getProfileStorageKey(profileOwnerId);
  const feedbackStorageKey = getFeedbackStorageKey(profileOwnerId);
  const isOwnerUser = currentRole === "owner" && profileOwnerId === currentOwnerId;

  const [profile, setProfile] = useState(() => baseProfileFromUser(currentUser, isOwnerUser));
  const [feedbackList, setFeedbackList] = useState(defaultFeedback);
  const [driverName, setDriverName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    setProfile(baseProfileFromUser(currentUser, isOwnerUser));
    setFeedbackList(defaultFeedback);

    const savedProfile = JSON.parse(localStorage.getItem(profileStorageKey) || "null");
    if (savedProfile && typeof savedProfile === "object") {
      setProfile((currentProfile) => ({ ...currentProfile, ...savedProfile }));
    }

    const savedFeedback = JSON.parse(localStorage.getItem(feedbackStorageKey) || "null");
    if (Array.isArray(savedFeedback) && savedFeedback.length > 0) {
      setFeedbackList(savedFeedback);
    }
  }, [feedbackStorageKey, profileStorageKey, currentUser, isOwnerUser]);

  useEffect(() => {
    if (!isOwnerUser) {
      return;
    }

    localStorage.setItem(feedbackStorageKey, JSON.stringify(feedbackList));
    publishOwnerProfile(currentUser, profile, feedbackList);
  }, [feedbackList, feedbackStorageKey, profile, currentUser, isOwnerUser]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((currentProfile) => ({ ...currentProfile, [name]: value }));
    setProfileSaved(false);
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();

    const normalizedProfile = {
      ...profile,
      jobLocations: String(profile.jobLocations || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    setProfile(normalizedProfile);
    localStorage.setItem(profileStorageKey, JSON.stringify(normalizedProfile));
    publishOwnerProfile({ ...currentUser, id: profileOwnerId }, normalizedProfile, feedbackList);
    setProfileSaved(true);
  };

  const averageRating = useMemo(() => {
    if (!feedbackList.length) {
      return 0;
    }
    const total = feedbackList.reduce((sum, entry) => sum + Number(entry.rating || 0), 0);
    return total / feedbackList.length;
  }, [feedbackList]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!comment.trim()) {
      return;
    }

    const newFeedback = {
      id: String(Date.now()),
      driverName: driverName.trim() || "Anonymous Driver",
      rating: Number(rating),
      comment: comment.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const nextFeedbackList = [newFeedback, ...feedbackList];
    setFeedbackList(nextFeedbackList);
    localStorage.setItem(feedbackStorageKey, JSON.stringify(nextFeedbackList));
    const baseOwnerRef = {
      id: profileOwnerId,
      email: profile.email || currentUser?.email,
      name: profile.name || currentUser?.name,
    };
    publishOwnerProfile(baseOwnerRef, profile, nextFeedbackList);
    setDriverName("");
    setRating(5);
    setComment("");
  };

  const jobLocationsText = Array.isArray(profile.jobLocations)
    ? profile.jobLocations.join(", ")
    : profile.jobLocations;

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "#0f766e", fontWeight: 800, marginBottom: "8px" }}>
          Public Owner Profile
        </p>
        <h2 style={{ margin: 0, fontSize: "32px", color: "#0f172a" }}>
          {profile.name || "Owner profile not completed yet"}
        </h2>
        <p style={{ marginTop: "10px", color: "#475569", lineHeight: 1.6 }}>
          {profile.description || "This owner has not filled out the public profile description yet."}
        </p>
        <div style={{ marginTop: "16px" }}>
          <span style={badgeStyle}>Average Rating: {averageRating.toFixed(1)}</span>
          <span style={badgeStyle}>Total Reviews: {feedbackList.length}</span>
          <span style={badgeStyle}>Visible to All Authenticated Users</span>
        </div>
      </div>

      <div style={gridStyle}>
        <div style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>Owner Details</h3>
          {isOwnerUser ? (
            <form onSubmit={handleProfileSubmit}>
              <label style={labelStyle} htmlFor="name">Name</label>
              <input id="name" name="name" value={profile.name} onChange={handleProfileChange} style={inputStyle} />

              <label style={labelStyle} htmlFor="company">Company</label>
              <input id="company" name="company" value={profile.company} onChange={handleProfileChange} style={inputStyle} placeholder="Car owner or business name" />

              <label style={labelStyle} htmlFor="location">Location</label>
              <GooglePlacesInput
                id="location"
                name="location"
                value={profile.location}
                onChange={handleProfileChange}
                style={inputStyle}
                placeholder="City or area"
              />
              {!!profile.location && (
                <GoogleMapsLink label="Open owner location on OpenStreetMap" query={profile.location} style={{ fontSize: "13px" }} />
              )}

              <label style={labelStyle} htmlFor="phone">Phone</label>
              <input id="phone" name="phone" value={profile.phone} onChange={handleProfileChange} style={inputStyle} placeholder="Contact number" />

              <label style={labelStyle} htmlFor="email">Email</label>
              <input id="email" name="email" value={profile.email} onChange={handleProfileChange} style={inputStyle} />

              <label style={labelStyle} htmlFor="jobLocations">Job Locations</label>
              <input id="jobLocations" name="jobLocations" value={jobLocationsText} onChange={handleProfileChange} style={inputStyle} placeholder="Comma-separated locations" />

              <label style={labelStyle} htmlFor="description">Public Description</label>
              <textarea id="description" name="description" value={profile.description} onChange={handleProfileChange} rows={4} style={{ ...inputStyle, resize: "vertical" }} placeholder="Describe your hiring needs" />

              <button type="submit" style={buttonStyle}>Save Profile</button>
              {profileSaved && <p style={{ marginTop: "10px", color: "#047857" }}>Profile saved for this owner account.</p>}
            </form>
          ) : (
            <>
              <p><strong>Name:</strong> {profile.name || "Not provided yet"}</p>
              <p><strong>Company:</strong> {profile.company || "Not provided yet"}</p>
              <p><strong>Location:</strong> {profile.location || "Not provided yet"}</p>
              {!!profile.location && <GoogleMapsLink label="Open owner location on OpenStreetMap" query={profile.location} style={{ fontSize: "13px" }} />}
              <p><strong>Phone:</strong> {profile.phone || "Not provided yet"}</p>
              <p><strong>Email:</strong> {profile.email || "Not provided yet"}</p>
            </>
          )}
        </div>

        <div style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>Job Locations for Drivers</h3>
          <p style={{ color: "#475569" }}>Drivers can quickly see the places where this owner usually hires cars and drivers.</p>
          <ul style={{ paddingLeft: "18px", marginBottom: 0 }}>
            {(Array.isArray(profile.jobLocations) ? profile.jobLocations : jobLocationsText.split(",").map((item) => item.trim()).filter(Boolean)).map((location) => (
              <li key={location} style={{ marginBottom: "6px" }}>
                {location}
                <span style={{ marginLeft: "8px" }}>
                  <GoogleMapsLink label="map" query={location} style={{ fontSize: "12px" }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ ...panelStyle, marginTop: "18px" }}>
        <h3 style={{ marginTop: 0 }}>Driver Feedback & Ratings</h3>
        <div style={{ marginBottom: "20px" }}>
          {feedbackList.map((entry) => (
            <div key={entry.id} style={{ padding: "14px 0", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <strong>{entry.driverName}</strong>
                <span>Rating: {entry.rating}/5</span>
              </div>
              <p style={{ margin: "8px 0", color: "#334155" }}>{entry.comment}</p>
              <small style={{ color: "#64748b" }}>{entry.createdAt}</small>
            </div>
          ))}
        </div>

        {currentRole === "driver" ? (
          <form onSubmit={handleSubmit}>
            <label style={labelStyle} htmlFor="driverName">Driver Name</label>
            <input
              id="driverName"
              value={driverName}
              onChange={(event) => setDriverName(event.target.value)}
              placeholder="Your name"
              style={inputStyle}
            />

            <label style={labelStyle} htmlFor="rating">Rating</label>
            <select
              id="rating"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              style={inputStyle}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value} / 5</option>
              ))}
            </select>

            <label style={labelStyle} htmlFor="comment">Feedback</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="Share your experience with this owner"
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <button type="submit" style={buttonStyle}>Submit Feedback</button>
          </form>
        ) : (
          <p style={{ marginBottom: 0, color: "#475569" }}>
            Drivers can submit their feedback and ratings here. Owners and other users can view the public reviews above.
          </p>
        )}
      </div>
    </div>
  );
};

export default OwnerProfile;
