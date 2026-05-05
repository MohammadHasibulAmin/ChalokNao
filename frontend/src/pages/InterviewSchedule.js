import React, { useEffect, useState } from "react";
import api from "../services/api";

const InterviewSchedule = () => {
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  useEffect(() => {
    const fetchScheduledInterviews = async () => {
      if (!userId) return;
      setLoadingInterviews(true);
      try {
        const res = await api.get(`/interviews/owner/${userId}`);
        setScheduledInterviews(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching interviews:", err.response?.data?.message || err.message);
        setScheduledInterviews([]);
      } finally {
        setLoadingInterviews(false);
      }
    };
    fetchScheduledInterviews();
  }, [userId]);

  return (
    <div style={containerStyle}>
      <h2>Scheduled Interviews</h2>
      <h3>Your Scheduled Interviews</h3>
      {loadingInterviews ? (
        <p style={{ color: "#6b7280" }}>Loading interviews...</p>
      ) : scheduledInterviews.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No interviews scheduled yet.</p>
      ) : (
        <div style={interviewsListStyle}>
          {scheduledInterviews.map((interview) => (
            <div key={interview._id} style={interviewCardStyle}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>
                  Driver: {interview.driverName || interview.driverId || "Unknown"}
                </h4>
                <p style={{ margin: "4px 0", color: "#6b7280", fontSize: 14 }}>
                  <strong>Date & Time:</strong> {new Date(interview.date).toLocaleString()}
                </p>
                <p style={{ margin: "4px 0", color: "#6b7280", fontSize: 14 }}>
                  <strong>Type:</strong>{" "}
                  <span style={interviewTypeBadgeStyle(interview.type)}>{interview.type}</span>
                </p>
                {interview.type === "offline" && interview.location && (
                  <p style={{ margin: "4px 0", color: "#6b7280", fontSize: 14 }}>
                    <strong>Location:</strong> {interview.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const containerStyle = {
  maxWidth: "800px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const interviewsListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "16px",
};

const interviewCardStyle = {
  padding: "16px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  backgroundColor: "#f9fafb",
  display: "flex",
  gap: "12px",
};

const interviewTypeBadgeStyle = (type) => {
  const typeColors = {
    online: { bg: "#dbeafe", text: "#0c4a6e" },
    offline: { bg: "#dcfce7", text: "#166534" },
    chat: { bg: "#f3e8ff", text: "#6b21a8" },
  };
  const colors = typeColors[type] || typeColors.online;
  return {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: colors.bg,
    color: colors.text,
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "capitalize",
  };
};

export default InterviewSchedule;
