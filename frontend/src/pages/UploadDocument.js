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

const getStatusMeta = (status) => {
    const normalized = String(status || "not_submitted").toLowerCase();

    if (normalized === "approved" || normalized === "verified") {
        return { label: "Verified", color: "#166534", background: "#dcfce7" };
    }

    if (normalized === "pending") {
        return { label: "Pending Review", color: "#92400e", background: "#fef3c7" };
    }

    if (normalized === "rejected") {
        return { label: "Rejected", color: "#991b1b", background: "#fee2e2" };
    }

    return { label: "Not Submitted", color: "#1e3a8a", background: "#dbeafe" };
};

const ProfileVerification = () => {
    const [licenseFile, setLicenseFile] = useState(null);
    const [nidFile, setNidFile] = useState(null);
    const [hasSubmittedDocument, setHasSubmittedDocument] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState("not_submitted");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    const user = useMemo(() => {
        return JSON.parse(localStorage.getItem("user") || "null");
    }, []);

    useEffect(() => {
        const loadStatus = async () => {
            if (!user?.id) {
                setIsLoadingStatus(false);
                return;
            }

            try {
                const response = await api.get("/drivers/search");
                const driver = Array.isArray(response.data)
                    ? response.data.find((item) => String(item.userId) === String(user.id))
                    : null;

                const nextStatus = driver?.documents?.status || "not_submitted";
                const hasDocumentOnFile = Boolean(driver?.documents?.licenseUrl || driver?.documents?.nidUrl);
                setVerificationStatus(nextStatus);
                setHasSubmittedDocument(hasDocumentOnFile);
                localStorage.setItem("driverVerificationStatus", nextStatus);
                window.dispatchEvent(new CustomEvent("driver-verification-updated", { detail: { status: nextStatus } }));
            } catch (err) {
                setMessage(err.response?.data?.message || "Could not load verification status.");
                setMessageType("error");
            } finally {
                setIsLoadingStatus(false);
            }
        };

        loadStatus();
    }, [user?.id]);

    const statusMeta = getStatusMeta(verificationStatus);

    const handleUploadAndRequest = async (event) => {
        event.preventDefault();

        if (!user?.id) {
            setMessage("User not found. Please login first.");
            setMessageType("error");
            return;
        }

        if (!licenseFile && !nidFile) {
            setMessage("Upload at least one document (License or NID) before requesting verification.");
            setMessageType("error");
            return;
        }

        try {
            setIsSubmitting(true);
            setMessage("");
            const formData = new FormData();
            formData.append("userId", user.id);
            if (licenseFile) formData.append("license", licenseFile);
            if (nidFile) formData.append("nid", nidFile);

            const response = await api.post("/drivers/upload-docs", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const nextStatus = response.data?.documents?.status || "pending";
            const hasDocumentOnFile = Boolean(response.data?.documents?.licenseUrl || response.data?.documents?.nidUrl);
            setVerificationStatus(nextStatus);
            setHasSubmittedDocument(hasDocumentOnFile);
            localStorage.setItem("driverVerificationStatus", nextStatus);
            window.dispatchEvent(new CustomEvent("driver-verification-updated", { detail: { status: nextStatus } }));
            setMessage("Documents uploaded and verification request sent successfully.");
            setMessageType("success");
        } catch (err) {
            setMessage(err.response?.data?.message || "Upload failed. Please try again.");
            setMessageType("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestWithoutReupload = async () => {
        if (!user?.id) {
            setMessage("User not found. Please login first.");
            setMessageType("error");
            return;
        }

        if (!hasSubmittedDocument) {
            setMessage("Submit at least one document before requesting verification.");
            setMessageType("error");
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append("userId", user.id);

            const response = await api.post("/drivers/upload-docs", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const nextStatus = response.data?.documents?.status || "pending";
            const hasDocumentOnFile = Boolean(response.data?.documents?.licenseUrl || response.data?.documents?.nidUrl);
            setVerificationStatus(nextStatus);
            setHasSubmittedDocument(hasDocumentOnFile);
            localStorage.setItem("driverVerificationStatus", nextStatus);
            window.dispatchEvent(new CustomEvent("driver-verification-updated", { detail: { status: nextStatus } }));
            setMessage("Verification request has been submitted.");
            setMessageType("success");
        } catch (err) {
            setMessage(err.response?.data?.message || "Could not submit verification request.");
            setMessageType("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={pageWrapStyle}>
            <div style={cardStyle}>
                <div style={headerRowStyle}>
                    <div>
                        <h2 style={titleStyle}>Profile Verification</h2>
                        <p style={subtitleStyle}>Upload your License or NID images</p>
                    </div>
                    <div style={{ ...statusBadgeStyle, color: statusMeta.color, backgroundColor: statusMeta.background }}>
                        {isLoadingStatus ? "Loading..." : statusMeta.label}
                    </div>
                </div>

                {message && (
                    <div style={{ ...messageStyle, ...(messageType === "error" ? errorMessageStyle : successMessageStyle) }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleUploadAndRequest} style={formStyle}>
                    <div style={uploadGridStyle}>
                        <label style={uploadBoxStyle} htmlFor="license">
                            <span style={uploadTitleStyle}>Driving License</span>
                            <span style={uploadHintStyle}>Upload clear front-side image</span>
                            <input
                                id="license"
                                type="file"
                                accept="image/*"
                                onChange={(event) => setLicenseFile(event.target.files?.[0] || null)}
                                style={fileInputStyle}
                            />
                            <span style={fileNameStyle}>{licenseFile?.name || "No file selected"}</span>
                        </label>

                        <label style={uploadBoxStyle} htmlFor="nid">
                            <span style={uploadTitleStyle}>National ID (NID)</span>
                            <span style={uploadHintStyle}>Upload clear front-side image</span>
                            <input
                                id="nid"
                                type="file"
                                accept="image/*"
                                onChange={(event) => setNidFile(event.target.files?.[0] || null)}
                                style={fileInputStyle}
                            />
                            <span style={fileNameStyle}>{nidFile?.name || "No file selected"}</span>
                        </label>
                    </div>

                    <div style={actionRowStyle}>
                        <button type="submit" disabled={isSubmitting} style={primaryButtonStyle}>
                            {isSubmitting ? "Submitting..." : "Upload and Request Verification"}
                        </button>
                        <button type="button" disabled={isSubmitting || !hasSubmittedDocument} style={isSubmitting || !hasSubmittedDocument ? disabledSecondaryButtonStyle : secondaryButtonStyle} onClick={handleRequestWithoutReupload}>
                            Request Verification
                        </button>
                    </div>
                    {!hasSubmittedDocument && (
                        <p style={helperTextStyle}>Submit License or NID first, then you can request verification.</p>
                    )}
                </form>
            </div>
        </div>
    );
};

const pageWrapStyle = {
    minHeight: "calc(100vh - 90px)",
    background: "radial-gradient(circle at top right, rgba(15,15,15,0.9) 0%, rgba(20,20,20,0.95) 42%, #0D0D0D 100%)",
    padding: "26px 16px",
};

const cardStyle = {
    width: "min(920px, 100%)",
    margin: "0 auto",
    borderRadius: "20px",
    border: "1px solid rgba(242,240,236,0.12)",
    backgroundColor: "#141414",
    padding: "22px",
    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)",
};

const headerRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
};

const titleStyle = {
    margin: 0,
    color: "#0f172a",
    fontSize: "30px",
    lineHeight: 1.15,
};

const subtitleStyle = {
    margin: "8px 0 0",
    color: "#475569",
    maxWidth: "580px",
    lineHeight: 1.6,
};

const statusBadgeStyle = {
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
};

const messageStyle = {
    marginTop: "14px",
    borderRadius: "12px",
    padding: "10px 12px",
    fontWeight: 600,
    fontSize: "14px",
};

const successMessageStyle = {
    color: "#166534",
    backgroundColor: "#dcfce7",
};

const errorMessageStyle = {
    color: "#991b1b",
    backgroundColor: "#fee2e2",
};

const formStyle = {
    marginTop: "18px",
};

const uploadGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
};

const uploadBoxStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    border: "1px dashed rgba(242,240,236,0.24)",
    borderRadius: "14px",
    backgroundColor: "#0D0D0D",
    padding: "14px",
};

const uploadTitleStyle = {
    fontWeight: 800,
    color: "#F2F0EC",
};

const uploadHintStyle = {
    color: "rgba(242,240,236,0.78)",
    fontSize: "13px",
};

const fileInputStyle = {
    marginTop: "4px",
};

const fileNameStyle = {
    color: "rgba(242,240,236,0.88)",
    fontSize: "12px",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
};

const actionRowStyle = {
    marginTop: "18px",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
};

const primaryButtonStyle = {
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#E8321A",
    color: "#fff",
    padding: "11px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
};

const secondaryButtonStyle = {
    border: "1px solid rgba(242,240,236,0.16)",
    borderRadius: "12px",
    backgroundColor: "#141414",
    color: "#F2F0EC",
    padding: "11px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
};

const disabledSecondaryButtonStyle = {
    ...secondaryButtonStyle,
    opacity: 0.55,
    cursor: "not-allowed",
};

const helperTextStyle = {
    margin: "10px 0 0",
    color: "#64748b",
    fontSize: "13px",
};

export default ProfileVerification;