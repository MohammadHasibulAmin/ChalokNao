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
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import SupportChatWidget from "../components/chat/SupportChatWidget";

const getPhotoUrl = (photo) => {
  if (!photo) {
    return "";
  }

  if (/^https?:\/\//i.test(photo)) {
    return photo;
  }

  if (photo.startsWith("/")) {
    return `http://localhost:5000${photo}`;
  }

  return `http://localhost:5000/uploads/${photo}`;
};

const getExperienceBadge = (driver) => {
  const ratingAvg = Number(driver?.ratingAvg || 0);
  const completedContracts = Number(driver?.completedContracts || driver?.totalContracts || 0);
  const experienceYears = Number(driver?.experienceYears || 0);

  if (ratingAvg >= 4.9 && completedContracts >= 20 && experienceYears >= 8) {
    return "Elite Veteran";
  }

  if (ratingAvg >= 4.7 && completedContracts >= 10 && experienceYears >= 5) {
    return "Trusted Pro";
  }

  if (ratingAvg >= 4.4 && completedContracts >= 5 && experienceYears >= 3) {
    return "Steady Professional";
  }

  if (ratingAvg >= 4.0 && experienceYears >= 2) {
    return "Reliable Driver";
  }

  return "Rising Driver";
};

const formatDateInputValue = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

const calculateAgeFromBirthdate = (birthdateValue) => {
  if (!birthdateValue) {
    return "";
  }

  const birthDate = new Date(birthdateValue);
  if (Number.isNaN(birthDate.getTime())) {
    return "";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? String(age) : "";
};

const BADGE_CATEGORIES = [
  {
    name: "Elite Veteran",
    target: "Rating 4.9+, 20+ commitments, 8+ years service",
  },
  {
    name: "Trusted Pro",
    target: "Rating 4.7+, 10+ commitments, 5+ years service",
  },
  {
    name: "Steady Professional",
    target: "Rating 4.4+, 5+ commitments, 3+ years service",
  },
  {
    name: "Reliable Driver",
    target: "Rating 4.0+, 2+ years service",
  },
  {
    name: "Rising Driver",
    target: "Starting tier before higher targets are completed",
  },
];

const DriverProfile = () => {
  const [formData, setFormData] = useState({
    name: "",
    birthdate: "",
    experienceYears: "",
    licenseNumber: "",
    workType: "full-time",
    expectedSalaryMonthly: "",
    expectedSalaryDaily: "",
    status: "Available",
  });
  const [file, setFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [driverRecord, setDriverRecord] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBadgeInfoOpen, setIsBadgeInfoOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData?.id) {
      setUserId(userData.id);
      setUser(userData);
    }
  }, []);





  useEffect(() => {
    if (!userId) {
      return;
    }

    let isActive = true;

    const loadDriverProfile = async () => {
      setIsFetching(true);

      try {
        const response = await api.get("/drivers/search");
        const currentProfile = Array.isArray(response.data)
          ? response.data.find((driver) => String(driver.userId) === String(userId))
          : null;

        if (!isActive || !currentProfile) {
          return;
        }

        setDriverRecord(currentProfile);
        setFormData({
          name: currentProfile.name || "",
          birthdate: formatDateInputValue(currentProfile.birthdate),
          experienceYears: currentProfile.experienceYears ?? "",
          licenseNumber: currentProfile.licenseNumber || "",
          workType: currentProfile.workType || "full-time",
          expectedSalaryMonthly: currentProfile.expectedSalary?.monthly ?? "",
          expectedSalaryDaily: currentProfile.expectedSalary?.daily ?? "",
          status: currentProfile.status || "Available",
        });
      } catch (err) {
        if (isActive) {
          setMessage(err.response?.data?.message || "Error loading profile");
          setMessageType("error");
        }
      } finally {
        if (isActive) {
          setIsFetching(false);
        }
      }
    };

    loadDriverProfile();

    return () => {
      isActive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (file) {
      const nextPreview = URL.createObjectURL(file);
      setPhotoPreview(nextPreview);

      return () => URL.revokeObjectURL(nextPreview);
    }

    if (driverRecord?.photo) {
      setPhotoPreview(getPhotoUrl(driverRecord.photo));
      return undefined;
    }

    setPhotoPreview("");
    return undefined;
  }, [file, driverRecord?.photo]);

  const handleChange = (event) => setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  const handleFileChange = (event) => setFile(event.target.files[0] || null);
  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);
  const toggleBadgeInfo = () => setIsBadgeInfoOpen((prev) => !prev);
  const closeBadgeInfo = () => setIsBadgeInfoOpen(false);
  const openReviewsModal = () => setIsReviewsOpen(true);
  const closeReviewsModal = () => setIsReviewsOpen(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userId) {
      setMessage("User not logged in");
      setMessageType("error");
      return;
    }

    try {
      setIsSaving(true);
      const data = new FormData();
      const calculatedAge = calculateAgeFromBirthdate(formData.birthdate);
      data.append("userId", userId);

      for (let key in formData) {
        data.append(key, formData[key]);
      }
      data.append("age", calculatedAge || "0");

      if (file) data.append("photo", file);

      const response = await api.post("/drivers/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDriverRecord(response.data);
      setFormData({
        name: response.data?.name || "",
        birthdate: formatDateInputValue(response.data?.birthdate),
        experienceYears: response.data?.experienceYears ?? "",
        licenseNumber: response.data?.licenseNumber || "",
        workType: response.data?.workType || "full-time",
        expectedSalaryMonthly: response.data?.expectedSalary?.monthly ?? "",
        expectedSalaryDaily: response.data?.expectedSalary?.daily ?? "",
        status: response.data?.status || "Available",
      });
      localStorage.setItem("driverWorkType", response.data?.workType || "full-time");
      window.dispatchEvent(new CustomEvent("driver-profile-updated", {
        detail: { workType: response.data?.workType || "full-time" },
      }));
      setMessage("Profile saved successfully!");
      setMessageType("success");
      setFile(null);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error saving profile");
      setMessageType("error");
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = formData.name || driverRecord?.name || "Driver profile";
  const calculatedAge = useMemo(() => calculateAgeFromBirthdate(formData.birthdate), [formData.birthdate]);
  const employerReviews = useMemo(() => {
    const rawReviews = Array.isArray(driverRecord?.reviews) ? driverRecord.reviews : [];

    return rawReviews
      .map((review, index) => ({
        id: review?._id || review?.id || `${index}`,
        employerName: review?.employerName || review?.ownerName || "Employer",
        rating: Number(review?.rating || 0),
        feedback: review?.feedback || review?.comment || "",
        contractType: review?.contractType || review?.type || "Contract",
        date: review?.createdAt || review?.date || null,
      }))
      .filter((review) => review.rating > 0 || review.feedback);
  }, [driverRecord?.reviews]);

  const averageReviewRating = useMemo(() => {
    if (!employerReviews.length) {
      return 0;
    }

    const total = employerReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return total / employerReviews.length;
  }, [employerReviews]);

  const experienceBadge = useMemo(() => {
    return driverRecord?.badges?.[0] || getExperienceBadge({ ...driverRecord, ...formData, age: calculatedAge });
  }, [driverRecord, formData, calculatedAge]);

  const avatarFallback = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "D";

  return (
    <div style={containerStyle}>


      {/* Chat Widget */}
      {user && <SupportChatWidget user={user} />}

      <div style={heroStyle}>
        <div style={avatarWrapStyle}>
          <button type="button" style={avatarButtonStyle} onClick={openUploadModal} aria-label="Upload profile photo">
            {photoPreview ? (
              <img src={photoPreview} alt={displayName} style={avatarStyle} />
            ) : (
              <div style={avatarPlaceholderStyle}>{avatarFallback}</div>
            )}
            <span style={plusBadgeStyle}>+</span>
          </button>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={titleRowStyle}>
            <h2 style={{ margin: 0, fontSize: "30px", color: "#F2F0EC" }}>{displayName}</h2>
            <span style={experienceBadgeStyle}>{experienceBadge}</span>
            <div style={badgeInfoWrapStyle}>
              <button
                type="button"
                style={badgeInfoButtonStyle}
                onClick={toggleBadgeInfo}
                aria-label="Badge information"
                aria-expanded={isBadgeInfoOpen}
              >
                i
              </button>
              {isBadgeInfoOpen && (
                <div style={badgeInfoPopupStyle}>
                  <div style={badgeInfoTitleStyle}>Experience Badge Targets</div>
                  {BADGE_CATEGORIES.map((category) => (
                    <div key={category.name} style={badgeInfoRowStyle}>
                      <strong style={{ color: "#F2F0EC" }}>{category.name}:</strong> {category.target}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p style={{ margin: "10px 0 0", color: "rgba(242,240,236,0.7)", lineHeight: 1.6 }}>
            Keep your profile photo and professional details updated so owners can review your experience at a glance.
          </p>
          {driverRecord && (
            <div style={statsRowStyle}>
              <span style={statPillStyle}>{Number(driverRecord.ratingAvg || 0).toFixed(1)} rating</span>
              <span style={statPillStyle}>{Number(driverRecord.experienceYears || 0)} yrs service</span>
              <span style={statPillStyle}>{Number(driverRecord.completedContracts || driverRecord.totalContracts || 0)} commitments</span>
              <button type="button" style={reviewPillButtonStyle} onClick={openReviewsModal}>
                Reviews ({employerReviews.length})
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={contentGridStyle}>
        <div style={panelStyle}>
          <h3 style={sectionTitleStyle}>Profile Details</h3>
          {isFetching && <div style={loadingTextStyle}>Loading latest profile data...</div>}
          {message && (
            <div style={{ ...messageStyle, color: messageType === "error" ? "#b91c1c" : "#166534", backgroundColor: messageType === "error" ? "#fef2f2" : "#f0fdf4" }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={labelStyle} htmlFor="name">Full Name</label>
            <input id="name" type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} style={inputStyle} required />

            <label style={labelStyle} htmlFor="birthdate">Birthdate</label>
            <input id="birthdate" type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} style={inputStyle} required />

            <label style={labelStyle} htmlFor="calculatedAge">Age</label>
            <input id="calculatedAge" type="text" value={calculatedAge} placeholder="Age auto-calculated from birthdate" style={readOnlyInputStyle} readOnly />

            <label style={labelStyle} htmlFor="experienceYears">Experience Years</label>
            <input id="experienceYears" type="number" name="experienceYears" placeholder="Experience Years" value={formData.experienceYears} onChange={handleChange} style={inputStyle} required />

            <label style={labelStyle} htmlFor="licenseNumber">License Number</label>
            <input id="licenseNumber" type="text" name="licenseNumber" placeholder="License Number" value={formData.licenseNumber} onChange={handleChange} style={inputStyle} required />

            <label style={labelStyle} htmlFor="workType">Work Type</label>
            <select id="workType" name="workType" value={formData.workType} onChange={handleChange} style={inputStyle}>
              <option value="full-time">Full-time</option>
              <option value="temporary">Temporary</option>
            </select>

            <label style={labelStyle} htmlFor="status">Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
              <option value="Available">Available</option>
              <option value="Employed">Employed</option>
            </select>

            <button type="submit" style={isSaving ? { ...buttonStyle, ...buttonDisabledStyle } : buttonStyle} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </div>

      {isUploadModalOpen && (
        <div style={modalOverlayStyle} onClick={closeUploadModal}>
          <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: "8px", color: "#F2F0EC" }}>Upload Profile Photo</h3>
            <p style={{ marginTop: 0, marginBottom: "14px", color: "rgba(242,240,236,0.7)", lineHeight: 1.5 }}>
              Choose a clear profile image. It will be saved when you click Save Profile.
            </p>

            <div style={previewBoxStyle}>
              {photoPreview ? (
                <img src={photoPreview} alt="Driver preview" style={previewImageStyle} />
              ) : (
                <div style={previewPlaceholderStyle}>No image selected yet.</div>
              )}
            </div>

            <input id="photoUploadModal" type="file" accept="image/*" onChange={handleFileChange} style={fileInputStyle} />

            <div style={modalActionsStyle}>
              <button type="button" style={secondaryButtonStyle} onClick={closeUploadModal}>Done</button>
            </div>
          </div>
        </div>
      )}

      {isReviewsOpen && (
        <div style={modalOverlayStyle} onClick={closeReviewsModal}>
          <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: "8px", color: "#F2F0EC" }}>Employer Reviews</h3>
            <p style={{ marginTop: 0, marginBottom: "14px", color: "rgba(242,240,236,0.7)", lineHeight: 1.5 }}>
              Average {averageReviewRating.toFixed(1)} from {employerReviews.length} review{employerReviews.length === 1 ? "" : "s"}.
            </p>

            <div style={reviewsListStyle}>
              {employerReviews.length ? (
                employerReviews.map((review) => (
                  <div key={review.id} style={reviewCardStyle}>
                    <div style={reviewTopRowStyle}>
                      <strong style={{ color: "#F2F0EC", fontSize: "14px" }}>{review.employerName}</strong>
                      <span style={reviewRatingStyle}>{Number(review.rating || 0).toFixed(1)} / 5</span>
                    </div>
                    <div style={reviewMetaStyle}>{review.contractType}{review.date ? ` • ${new Date(review.date).toLocaleDateString()}` : ""}</div>
                    <div style={reviewTextStyle}>{review.feedback || "No written feedback provided."}</div>
                  </div>
                ))
              ) : (
                <div style={reviewEmptyStyle}>
                  No employer reviews yet. Completed contracts with feedback will appear here.
                </div>
              )}
            </div>

            <div style={modalActionsStyle}>
              <button type="button" style={secondaryButtonStyle} onClick={closeReviewsModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {isBadgeInfoOpen && <div style={dismissOverlayStyle} onClick={closeBadgeInfo} />}
    </div>
  );
};



const containerStyle = {
  maxWidth: "1024px",
  margin: "32px auto",
  padding: "24px",
  borderRadius: "20px",
  border: "1px solid rgba(242,240,236,0.08)",
  background: "linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%)",
  boxShadow: "0 14px 40px rgba(0, 0, 0, 0.4)",
  color: "#F2F0EC",
};

const heroStyle = {
  display: "flex",
  gap: "20px",
  alignItems: "center",
  padding: "20px",
  borderRadius: "18px",
  background: "linear-gradient(135deg, #141414 0%, #0D0D0D 100%)",
  border: "1px solid rgba(242,240,236,0.08)",
  marginBottom: "20px",
};

const avatarWrapStyle = {
  flexShrink: 0,
};

const avatarButtonStyle = {
  position: "relative",
  display: "inline-flex",
  border: "none",
  padding: 0,
  background: "transparent",
  cursor: "pointer",
};

const avatarStyle = {
  width: "110px",
  height: "110px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "4px solid rgba(255,255,255,0.9)",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.14)",
};

const avatarPlaceholderStyle = {
  width: "110px",
  height: "110px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #E8321A 0%, #A02714 100%)",
  color: "#F2F0EC",
  fontSize: "34px",
  fontWeight: 800,
  letterSpacing: "0.04em",
  boxShadow: "0 10px 24px rgba(232, 50, 26, 0.25)",
};

const plusBadgeStyle = {
  position: "absolute",
  right: "0px",
  bottom: "0px",
  width: "30px",
  height: "30px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#E8321A",
  color: "#F2F0EC",
  border: "2px solid #1A1A1A",
  fontWeight: 800,
  fontSize: "20px",
  lineHeight: 1,
  boxShadow: "0 6px 14px rgba(232, 50, 26, 0.35)",
};

const titleRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "10px",
};

const experienceBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 12px",
  borderRadius: "999px",
  backgroundColor: "#E8321A",
  color: "#F2F0EC",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.02em",
  position: "relative",
  zIndex: 2,
};

const badgeInfoWrapStyle = {
  position: "relative",
  zIndex: 2,
};

const badgeInfoButtonStyle = {
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  border: "1px solid rgba(242,240,236,0.3)",
  backgroundColor: "#141414",
  color: "#F2F0EC",
  fontSize: "12px",
  fontWeight: 800,
  lineHeight: 1,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

const badgeInfoPopupStyle = {
  position: "absolute",
  top: "28px",
  right: 0,
  width: "min(420px, calc(100vw - 48px))",
  backgroundColor: "#1A1A1A",
  border: "1px solid rgba(242,240,236,0.08)",
  borderRadius: "12px",
  padding: "12px",
  boxShadow: "0 16px 35px rgba(0, 0, 0, 0.4)",
};

const badgeInfoTitleStyle = {
  fontSize: "13px",
  fontWeight: 800,
  color: "#F2F0EC",
  marginBottom: "8px",
};

const badgeInfoRowStyle = {
  fontSize: "12px",
  color: "rgba(242,240,236,0.7)",
  lineHeight: 1.5,
  marginBottom: "6px",
};

const statsRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "16px",
};

const statPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  backgroundColor: "rgba(232, 50, 26, 0.15)",
  color: "#E8321A",
  fontSize: "12px",
  fontWeight: 700,
};

const reviewPillButtonStyle = {
  ...statPillStyle,
  border: "none",
  cursor: "pointer",
  backgroundColor: "rgba(232, 50, 26, 0.15)",
  color: "#E8321A",
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "20px",
};

const panelStyle = {
  padding: "20px",
  borderRadius: "18px",
  backgroundColor: "#141414",
  border: "1px solid rgba(242,240,236,0.08)",
  color: "#F2F0EC",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: "16px",
  fontSize: "20px",
  color: "#F2F0EC",
};

const loadingTextStyle = {
  marginBottom: "12px",
  fontSize: "13px",
  color: "rgba(242,240,236,0.7)",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "6px",
  color: "rgba(242,240,236,0.9)",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  marginBottom: "14px",
  borderRadius: "12px",
  border: "1px solid rgba(242,240,236,0.12)",
  fontSize: "14px",
  backgroundColor: "#0D0D0D",
  color: "#F2F0EC",
};

const readOnlyInputStyle = {
  ...inputStyle,
  backgroundColor: "#0D0D0D",
  color: "rgba(242,240,236,0.7)",
};

const fileInputStyle = {
  width: "100%",
  padding: "10px 0 0",
  marginBottom: "0",
  fontSize: "14px",
};

const messageStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  marginBottom: "16px",
  fontSize: "14px",
  fontWeight: 600,
};

const buttonStyle = {
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "#E8321A",
  color: "#F2F0EC",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: 700,
  transition: "background-color 0.2s",
};

const previewBoxStyle = {
  minHeight: "220px",
  borderRadius: "16px",
  border: "1px dashed rgba(242,240,236,0.12)",
  backgroundColor: "#0D0D0D",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const previewImageStyle = {
  width: "100%",
  height: "100%",
  minHeight: "220px",
  objectFit: "cover",
};

const previewPlaceholderStyle = {
  padding: "24px",
  textAlign: "center",
  color: "rgba(242,240,236,0.6)",
  lineHeight: 1.6,
};

const buttonDisabledStyle = {
  opacity: 0.75,
  cursor: "not-allowed",
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  zIndex: 1000,
};

const modalStyle = {
  width: "100%",
  maxWidth: "460px",
  backgroundColor: "#1A1A1A",
  borderRadius: "16px",
  border: "1px solid rgba(242,240,236,0.08)",
  padding: "18px",
  boxShadow: "0 24px 50px rgba(0, 0, 0, 0.4)",
  color: "#F2F0EC",
};

const modalActionsStyle = {
  marginTop: "16px",
  display: "flex",
  justifyContent: "flex-end",
};

const reviewsListStyle = {
  maxHeight: "330px",
  overflowY: "auto",
  display: "grid",
  gap: "10px",
  paddingRight: "2px",
};

const reviewCardStyle = {
  border: "1px solid rgba(242,240,236,0.08)",
  borderRadius: "12px",
  padding: "10px 12px",
  backgroundColor: "#0D0D0D",
  color: "#F2F0EC",
};

const reviewTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
};

const reviewRatingStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 8px",
  borderRadius: "999px",
  backgroundColor: "rgba(232, 50, 26, 0.15)",
  color: "#E8321A",
  fontSize: "12px",
  fontWeight: 700,
};

const reviewMetaStyle = {
  marginTop: "4px",
  fontSize: "12px",
  color: "rgba(242,240,236,0.6)",
};

const reviewTextStyle = {
  marginTop: "8px",
  color: "rgba(242,240,236,0.7)",
  fontSize: "13px",
  lineHeight: 1.5,
};

const reviewEmptyStyle = {
  border: "1px dashed rgba(242,240,236,0.12)",
  borderRadius: "12px",
  padding: "16px",
  color: "rgba(242,240,236,0.6)",
  fontSize: "13px",
  lineHeight: 1.5,
  textAlign: "center",
  backgroundColor: "#0D0D0D",
};

const secondaryButtonStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid rgba(242,240,236,0.12)",
  backgroundColor: "#141414",
  color: "#F2F0EC",
  fontWeight: 700,
  cursor: "pointer",
  transition: "background-color 0.2s",
};

const dismissOverlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "transparent",
  zIndex: 1,
};

export default DriverProfile;