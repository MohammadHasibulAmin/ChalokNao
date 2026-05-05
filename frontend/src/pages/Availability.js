import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const getDayCount = (start, end) => {
  if (!start || !end) {
    return 0;
  }

  const startDateObj = new Date(start);
  const endDateObj = new Date(end);
  if (Number.isNaN(startDateObj.getTime()) || Number.isNaN(endDateObj.getTime())) {
    return 0;
  }

  const diffMs = endDateObj - startDateObj;
  if (diffMs < 0) {
    return 0;
  }

  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
};

const Availability = () => {
  const [availability, setAvailability] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [isTemporaryDriver, setIsTemporaryDriver] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;
  const selectedDayCount = getDayCount(startDate, endDate);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await api.get(`/drivers/availability?userId=${userId}`);
      setAvailability(res.data);
    } catch (err) {
      console.error("Error fetching availability:", err);
    }
  }, [userId]);

  const checkEligibilityAndLoad = useCallback(async () => {
    if (!userId) {
      setIsTemporaryDriver(false);
      setIsCheckingEligibility(false);
      return;
    }

    try {
      const response = await api.get("/drivers/search");
      const currentDriver = Array.isArray(response.data)
        ? response.data.find((driver) => String(driver.userId) === String(userId))
        : null;
      const isTemporary = String(currentDriver?.workType || "").toLowerCase() === "temporary";

      setIsTemporaryDriver(isTemporary);

      if (isTemporary) {
        fetchAvailability();
      }
    } catch (err) {
      console.error("Error checking availability eligibility:", err);
    } finally {
      setIsCheckingEligibility(false);
    }
  }, [userId, fetchAvailability]);

  useEffect(() => {
    checkEligibilityAndLoad();
  }, [checkEligibilityAndLoad]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isTemporaryDriver) {
      setMessage("Availability is only applicable for temporary employment type.");
      return;
    }

    if (!selectedDayCount) {
      setMessage("End date must be the same as or after the start date.");
      return;
    }

    try {
      await api.post("/drivers/availability", {
        userId,
        startDate,
        endDate,
      });
      setMessage("Availability added!");
      setStartDate("");
      setEndDate("");
      fetchAvailability();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error");
    }
  };

  return (
    <div style={containerStyle}>
      {isCheckingEligibility ? (
        <p>Checking availability eligibility...</p>
      ) : !isTemporaryDriver ? (
        <div>
          <h2>Availability Not Applicable</h2>
          <p>
            Availability is only for temporary drivers. Your profile is currently set to long-term/full-time.
            Please switch employment type to temporary in Profile if you want to use this section.
          </p>
        </div>
      ) : (
        <>
      <h2>Availability Calendar</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form onSubmit={handleSubmit} style={formStyle}>
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            style={inputStyle}
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            style={inputStyle}
          />
        </label>
        <button type="submit" style={buttonStyle}>
          Add Availability
        </button>
        {startDate && endDate && (
          <p style={dayCountStyle}>
            Day Count: <strong>{selectedDayCount}</strong> day{selectedDayCount === 1 ? "" : "s"}
          </p>
        )}
      </form>

      <div style={{ marginTop: "20px" }}>
        <h3>Current Availability</h3>
        {availability.length === 0 ? (
          <p>No availability set yet.</p>
        ) : (
          availability.map((slot) => (
            <div key={slot._id} style={listItemStyle}>
              <p>
                <strong>From:</strong> {new Date(slot.startDate).toLocaleDateString()}
              </p>
              <p>
                <strong>To:</strong> {new Date(slot.endDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Day Count:</strong> {getDayCount(slot.startDate, slot.endDate)} day{getDayCount(slot.startDate, slot.endDate) === 1 ? "" : "s"}
              </p>
            </div>
          ))
        )}
      </div>
        </>
      )}
    </div>
  );
};

const containerStyle = {
  maxWidth: "600px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const formStyle = { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" };
const inputStyle = { padding: "10px", borderRadius: "5px", border: "1px solid #ccc" };
const buttonStyle = { padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };
const dayCountStyle = { margin: 0, color: "#1f2937", fontSize: "14px" };
const listItemStyle = { padding: "15px", border: "1px solid #ddd", borderRadius: "5px", marginBottom: "10px", backgroundColor: "#fff" };

export default Availability;
