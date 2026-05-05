import React, { useState, useEffect } from "react";
import api from "../services/api";
import OpenStreetMapLink from "../components/maps/OpenStreetMapLink";

const InterviewPanel = () => {
  const [interviews, setInterviews] = useState([]);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/interviews/driver/${userId}`);
        if (mounted) setInterviews(res.data);
      } catch (err) {
        console.error("Error fetching interviews:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleRespond = async (interviewId, status) => {
    try {
      await api.put(`/interviews/driver/interview/${interviewId}`, {
        status: status,
      });
      setMessage(`Interview ${status}!`);
      try {
        const res = await api.get(`/interviews/driver/${userId}`);
        setInterviews(res.data);
      } catch (err) {
        console.error("Error fetching interviews:", err);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Error responding to interview");
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Interview Requests</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      {interviews.length === 0 ? (
        <p>No interview requests yet.</p>
      ) : (
        interviews.map((interview) => (
          <div key={interview._id} style={listItemStyle}>
            <h4>Interview from Owner {interview.ownerId}</h4>
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
          </div>
        ))
      )}
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

export default InterviewPanel;
