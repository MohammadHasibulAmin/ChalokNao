import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.id) {
      setUserId(user.id);
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
            <h2 style={{ margin: 0, fontSize: "30px", color: "#0f172a" }}>{displayName}</h2>
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
                      <strong style={{ color: "#0f172a" }}>{category.name}:</strong> {category.target}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p style={{ margin: "10px 0 0", color: "#475569", lineHeight: 1.6 }}>
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
            <h3 style={{ marginTop: 0, marginBottom: "8px", color: "#0f172a" }}>Upload Profile Photo</h3>
            <p style={{ marginTop: 0, marginBottom: "14px", color: "#64748b", lineHeight: 1.5 }}>
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
            <h3 style={{ marginTop: 0, marginBottom: "8px", color: "#0f172a" }}>Employer Reviews</h3>
            <p style={{ marginTop: 0, marginBottom: "14px", color: "#64748b", lineHeight: 1.5 }}>
              Average {averageReviewRating.toFixed(1)} from {employerReviews.length} review{employerReviews.length === 1 ? "" : "s"}.
            </p>

            <div style={reviewsListStyle}>
              {employerReviews.length ? (
                employerReviews.map((review) => (
                  <div key={review.id} style={reviewCardStyle}>
                    <div style={reviewTopRowStyle}>
                      <strong style={{ color: "#0f172a", fontSize: "14px" }}>{review.employerName}</strong>
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
  border: "1px solid #e2e8f0",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  boxShadow: "0 14px 40px rgba(15, 23, 42, 0.08)",
};

const heroStyle = {
  display: "flex",
  gap: "20px",
  alignItems: "center",
  padding: "20px",
  borderRadius: "18px",
  background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
  border: "1px solid #e2e8f0",
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
  background: "linear-gradient(135deg, #0f766e 0%, #2563eb 100%)",
  color: "#fff",
  fontSize: "34px",
  fontWeight: 800,
  letterSpacing: "0.04em",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.14)",
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
  backgroundColor: "#0f766e",
  color: "#fff",
  border: "2px solid #fff",
  fontWeight: 800,
  fontSize: "20px",
  lineHeight: 1,
  boxShadow: "0 6px 14px rgba(15, 118, 110, 0.35)",
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
  backgroundColor: "#0f766e",
  color: "#fff",
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
  border: "1px solid #94a3b8",
  backgroundColor: "#fff",
  color: "#334155",
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
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "12px",
  boxShadow: "0 16px 35px rgba(15, 23, 42, 0.2)",
};

const badgeInfoTitleStyle = {
  fontSize: "13px",
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: "8px",
};

const badgeInfoRowStyle = {
  fontSize: "12px",
  color: "#475569",
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
  backgroundColor: "#e2e8f0",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 700,
};

const reviewPillButtonStyle = {
  ...statPillStyle,
  border: "none",
  cursor: "pointer",
  backgroundColor: "#dbeafe",
  color: "#1e3a8a",
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "20px",
};

const panelStyle = {
  padding: "20px",
  borderRadius: "18px",
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: "16px",
  fontSize: "20px",
  color: "#0f172a",
};

const loadingTextStyle = {
  marginBottom: "12px",
  fontSize: "13px",
  color: "#475569",
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
  padding: "12px 14px",
  marginBottom: "14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  backgroundColor: "#fff",
};

const readOnlyInputStyle = {
  ...inputStyle,
  backgroundColor: "#f8fafc",
  color: "#475569",
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
  backgroundColor: "#0f766e",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: 700,
};

const previewBoxStyle = {
  minHeight: "220px",
  borderRadius: "16px",
  border: "1px dashed #cbd5e1",
  backgroundColor: "#f8fafc",
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
  color: "#64748b",
  lineHeight: 1.6,
};

const buttonDisabledStyle = {
  opacity: 0.75,
  cursor: "not-allowed",
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  zIndex: 1000,
};

const modalStyle = {
  width: "100%",
  maxWidth: "460px",
  backgroundColor: "#fff",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  padding: "18px",
  boxShadow: "0 24px 50px rgba(15, 23, 42, 0.25)",
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
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "10px 12px",
  backgroundColor: "#f8fafc",
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
  backgroundColor: "#dcfce7",
  color: "#166534",
  fontSize: "12px",
  fontWeight: 700,
};

const reviewMetaStyle = {
  marginTop: "4px",
  fontSize: "12px",
  color: "#64748b",
};

const reviewTextStyle = {
  marginTop: "8px",
  color: "#334155",
  fontSize: "13px",
  lineHeight: 1.5,
};

const reviewEmptyStyle = {
  border: "1px dashed #cbd5e1",
  borderRadius: "12px",
  padding: "16px",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.5,
  textAlign: "center",
  backgroundColor: "#f8fafc",
};

const secondaryButtonStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#fff",
  color: "#334155",
  fontWeight: 700,
  cursor: "pointer",
};

const dismissOverlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "transparent",
  zIndex: 1,
};

export default DriverProfile;