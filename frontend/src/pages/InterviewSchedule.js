import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import DirectChatModal from "../components/chat/DirectChatModal";

const InterviewSchedule = () => {
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [activeChatInterview, setActiveChatInterview] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  useEffect(() => {
    const fetchScheduledInterviews = async () => {
      if (!userId) return;
      setLoadingInterviews(true);
      try {
        const res = await api.get(`/interviews/owner/${userId}`);
        // Filter out completed and rejected interviews
        const active = Array.isArray(res.data) 
          ? res.data.filter(iv => {
              const status = String(iv.status || "").toLowerCase();
              return status !== "completed" && status !== "rejected";
            })
          : [];
        setScheduledInterviews(active);
      } catch (err) {
        console.error("Error fetching interviews:", err.response?.data?.message || err.message);
        setScheduledInterviews([]);
      } finally {
        setLoadingInterviews(false);
      }
    };
    fetchScheduledInterviews();
  }, [userId]);

  const acceptedChatInterviews = useMemo(() => {
    return scheduledInterviews.filter(
      (interview) => String(interview.type || "").toLowerCase() === "chat" && String(interview.status || "").toLowerCase() === "accepted"
    );
  }, [scheduledInterviews]);

  const handleDoneInterview = async (interview) => {
    try {
      // Mark interview as completed
      await api.put(`/interviews/owner/interview/${interview._id}`, {
        status: "completed",
      });

      // Auto-create hire and navigate to HireManagement
      const hireData = {
        driverId: interview.driverId,
        driverUserId: interview.driverUserId || interview.driverId,
        driverName: interview.driverName,
        interviewId: interview._id,
        salary: 0,
        duration: "Not specified",
      };
      await api.post(`/hire/request`, hireData);

      // Remove completed interview from display and navigate
      setScheduledInterviews(prev => prev.filter(iv => iv._id !== interview._id));
      window.location.href = "/hire-management";
    } catch (err) {
      console.error("Error marking interview as done:", err.response?.data?.message || err.message);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Scheduled Interviews</h2>
        {acceptedChatInterviews.length > 0 && <span style={readyBadgeStyle}>{acceptedChatInterviews.length} Chat Ready</span>}
      </div>
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
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>
                    Driver: {interview.driverName || interview.driverId || "Unknown"}
                  </h4>
                  {String(interview.status || "").toLowerCase() === "accepted" && String(interview.type || "").toLowerCase() === "chat" && (
                    <span style={chatBadgeStyle}>Chat Ready</span>
                  )}
                </div>
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
                {String(interview.type || "").toLowerCase() === "chat" && String(interview.status || "").toLowerCase() === "accepted" && (
                  <button
                    type="button"
                    onClick={() => setActiveChatInterview(interview)}
                    style={{ ...chatButtonStyle, marginTop: 10 }}
                  >
                    Open Chat
                  </button>
                )}
                {String(interview.status || "").toLowerCase() === "accepted" && (
                  <button
                    type="button"
                    onClick={() => handleDoneInterview(interview)}
                    style={{ ...doneButtonStyle, marginTop: 10, marginLeft: 10 }}
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DirectChatModal
        open={Boolean(activeChatInterview)}
        onClose={() => setActiveChatInterview(null)}
        currentUser={user}
        counterpartId={activeChatInterview?.driverUserId || activeChatInterview?.driverId}
        counterpartName={activeChatInterview?.driverName || "Driver"}
        title={`Chat with ${activeChatInterview?.driverName || "Driver"}`}
      />
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

const chatBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: "999px",
  backgroundColor: "#ede9fe",
  color: "#6b21a8",
  fontSize: "12px",
  fontWeight: 700,
  border: "1px solid #ddd6fe",
};

const chatButtonStyle = {
  padding: "8px 14px",
  border: "none",
  borderRadius: "6px",
  backgroundColor: "#0f766e",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
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

const readyBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: "999px",
  backgroundColor: "#ede9fe",
  color: "#6b21a8",
  fontSize: "12px",
  fontWeight: 700,
  border: "1px solid #ddd6fe",
};

const doneButtonStyle = {
  padding: "8px 14px",
  border: "none",
  borderRadius: "6px",
  backgroundColor: "#6366f1",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

export default InterviewSchedule;
