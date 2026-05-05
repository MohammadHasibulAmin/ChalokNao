import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    totalInterviews: 0,
    totalHires: 0,
    ratingAvg: 0,
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get(`/drivers/analytics?userId=${userId}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div style={containerStyle}>
      <h2>Performance Analytics</h2>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h3>{analytics.totalInterviews}</h3>
          <p>Total Interviews</p>
        </div>
        <div style={cardStyle}>
          <h3>{analytics.totalHires}</h3>
          <p>Confirmed Hires</p>
        </div>
        <div style={cardStyle}>
          <h3>{analytics.ratingAvg.toFixed(1)}</h3>
          <p>Average Rating</p>
        </div>
      </div>

      <div style={insightStyle}>
        <h3>Insights</h3>
        {analytics.totalHires >= 10 && <p>✓ You're a Trusted Pro!</p>}
        {analytics.ratingAvg >= 4.8 && <p>✓ You're Top Rated!</p>}
        <p>Keep up the good work to earn more badges!</p>
      </div>
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

const gridStyle = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "30px" };
const cardStyle = {
  padding: "20px",
  backgroundColor: "#fff",
  border: "1px solid #ddd",
  borderRadius: "8px",
  textAlign: "center",
  h3: { fontSize: "28px", margin: "0", color: "#007bff" },
  p: { margin: "5px 0 0 0", color: "#666" },
};

const insightStyle = { padding: "20px", backgroundColor: "#e7f3ff", borderRadius: "8px", border: "1px solid #b3d9ff" };

export default Analytics;
