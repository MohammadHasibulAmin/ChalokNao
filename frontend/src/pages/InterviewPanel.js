import React, { useMemo, useState, useEffect } from "react";
import api from "../services/api";
import OpenStreetMapLink from "../components/maps/OpenStreetMapLink";
import DirectChatModal from "../components/chat/DirectChatModal";

const InterviewPanel = () => {
  const [interviews, setInterviews] = useState([]);
  const [message, setMessage] = useState("");
  const [activeChatInterview, setActiveChatInterview] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // fetch driver document to obtain driver._id (interviews are stored against driver._id)
        const driverRes = await api.get(`/drivers/user/${userId}`);
        const driverDoc = driverRes.data;
        if (!driverDoc || !driverDoc._id) {
          if (mounted) setInterviews([]);
          return;
        }
        const res = await api.get(`/interviews/driver/${driverDoc._id}`);
        if (mounted) setInterviews(res.data);
      } catch (err) {
        console.error("Error fetching interviews:", err.response?.data?.message || err.message);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const pendingCount = useMemo(() => {
    return interviews.filter((interview) => String(interview.status || "").toLowerCase() === "pending").length;
  }, [interviews]);

  const handleRespond = async (interviewId, status) => {
    try {
      await api.put(`/interviews/driver/interview/${interviewId}`, {
        status: status,
      });
      setMessage(`Interview ${status}!`);
      try {
        // refetch driver document then reload interviews by driver._id
        const driverRes = await api.get(`/drivers/user/${userId}`);
        const driverDoc = driverRes.data;
        if (driverDoc && driverDoc._id) {
          const res = await api.get(`/interviews/driver/${driverDoc._id}`);
          setInterviews(res.data);
        } else {
          setInterviews([]);
        }
      } catch (err) {
        console.error("Error fetching interviews:", err);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Error responding to interview");
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Interview Requests</h2>
        {pendingCount > 0 && (
          <span style={newBadgeStyle}>{pendingCount} New</span>
        )}
      </div>
      {message && <p style={{ color: "green" }}>{message}</p>}

      {interviews.length === 0 ? (
        <p>No interview requests yet.</p>
      ) : (
        interviews.map((interview) => (
          <div key={interview._id} style={{ ...listItemStyle, borderColor: String(interview.status || "").toLowerCase() === "pending" ? "#f59e0b" : "#ddd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <h4 style={{ margin: 0 }}>Interview request from {interview.ownerName || interview.ownerId}</h4>
              {String(interview.status || "").toLowerCase() === "pending" && <span style={newBadgeStyle}>NEW</span>}
            </div>
            <p>
              <strong>Type:</strong> {interview.type}
            </p>
            <p>
              <strong>Date:</strong> {new Date(interview.date).toLocaleString()}
            </p>
            <p>
              <strong>Location:</strong> {interview.location || "Online"}
            </p>
            {interview.location && (
              <OpenStreetMapLink
                label="Open meeting location"
                query={interview.location}
                lat={interview.locationCoordinates?.lat}
                lng={interview.locationCoordinates?.lng}
                style={{ fontSize: "13px" }}
              />
            )}
            <p>
              <strong>Status:</strong> <span style={{ color: getStatusColor(interview.status) }}>{interview.status}</span>
            </p>
            {interview.status === "pending" && (
              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() => handleRespond(interview._id, "accepted")}
                  style={{ ...buttonStyle, backgroundColor: "#28a745" }}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRespond(interview._id, "rejected")}
                  style={{ ...buttonStyle, backgroundColor: "#dc3545", marginLeft: "10px" }}
                >
                  Reject
                </button>
              </div>
            )}
            {String(interview.status || "").toLowerCase() === "accepted" && String(interview.type || "").toLowerCase() === "chat" && (
              <button
                type="button"
                onClick={() => setActiveChatInterview(interview)}
                style={{ ...buttonStyle, backgroundColor: "#0f766e", marginTop: "10px" }}
              >
                Open Chat
              </button>
            )}
          </div>
        ))
      )}

      <DirectChatModal
        open={Boolean(activeChatInterview)}
        onClose={() => setActiveChatInterview(null)}
        currentUser={user}
        counterpartId={activeChatInterview?.ownerUserId || activeChatInterview?.ownerId}
        counterpartName={activeChatInterview?.ownerName || "Owner"}
        title={`Chat with ${activeChatInterview?.ownerName || "Owner"}`}
      />
    </div>
  );
};

const getStatusColor = (status) => {
  if (status === "pending") return "#FFA500";
  if (status === "accepted") return "#28a745";
  if (status === "rejected") return "#dc3545";
  return "#000";
};

const containerStyle = {
  maxWidth: "700px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const listItemStyle = { padding: "15px", border: "1px solid #ddd", borderRadius: "5px", marginBottom: "15px", backgroundColor: "#fff" };
const buttonStyle = { padding: "8px 15px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };
const newBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: "999px",
  backgroundColor: "#fee2e2",
  color: "#b91c1c",
  fontSize: "12px",
  fontWeight: 700,
  border: "1px solid #fecaca",
};

export default InterviewPanel;
