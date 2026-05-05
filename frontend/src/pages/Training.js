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
import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const Training = () => {
  const [modules, setModules] = useState([]);
  const [summary, setSummary] = useState({
    totalModules: 0,
    completedModules: 0,
    completionRate: 0,
    avgScore: 0,
    certificates: 0,
    badges: [],
  });
  const [draftScores, setDraftScores] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [updatingModuleId, setUpdatingModuleId] = useState("");
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const hydrateProgress = useCallback(async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.get(`/training/progress/${userId}`);
      const nextModules = Array.isArray(res.data?.modules) ? res.data.modules : [];
      setModules(nextModules);
      setSummary(res.data?.summary || {
        totalModules: 0,
        completedModules: 0,
        completionRate: 0,
        avgScore: 0,
        certificates: 0,
        badges: [],
      });

      setDraftScores(
        nextModules.reduce((acc, item) => {
          acc[String(item._id)] = Number(item?.progress?.score || 80);
          return acc;
        }, {})
      );
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to load training progress");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    hydrateProgress();
  }, [hydrateProgress]);

  const progressTone = useMemo(() => {
    if (summary.completionRate >= 100) return "#0b7a53";
    if (summary.completionRate >= 60) return "#0f766e";
    if (summary.completionRate >= 30) return "#0f5f8f";
    return "#6b7280";
  }, [summary.completionRate]);

  const updateModule = async ({ trainingId, completed, score }) => {
    setUpdatingModuleId(String(trainingId));
    setMessage("");
    try {
      await api.post("/training/progress", {
        driverId: userId,
        trainingId,
        completed,
        score,
      });
      await hydrateProgress();
      setMessage(completed ? "Module marked completed and scored." : "Training module started.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error updating progress");
    } finally {
      setUpdatingModuleId("");
    }
  };

  const handleScoreChange = (trainingId, value) => {
    setDraftScores((prev) => ({
      ...prev,
      [String(trainingId)]: Number(value || 0),
    }));
  };

  return (
    <div style={containerStyle}>
      <div style={heroStyle}>
        <div>
          <p style={heroEyebrowStyle}>Driver Learning Hub</p>
          <h2 style={heroTitleStyle}>Skill Progress & Certification Tracker</h2>
          <p style={heroTextStyle}>
            Complete micro-trainings to improve safety, customer service, and maintenance skills. Earn badges and certificates to get prioritized by owners and admins.
          </p>
        </div>

        <div style={overallCardStyle}>
          <p style={metricLabelStyle}>Overall Progress</p>
          <div style={ringWrapStyle}>
            <div style={{ ...ringStyle, borderColor: progressTone }}>
              <span style={ringValueStyle}>{summary.completionRate}%</span>
            </div>
          </div>
          <div style={metricGridStyle}>
            <div>
              <strong>{summary.completedModules}</strong>
              <p style={miniLabelStyle}>Completed</p>
            </div>
            <div>
              <strong>{summary.avgScore}</strong>
              <p style={miniLabelStyle}>Avg Score</p>
            </div>
            <div>
              <strong>{summary.certificates}</strong>
              <p style={miniLabelStyle}>Certificates</p>
            </div>
          </div>
        </div>
      </div>

      {message && <p style={{ color: "#0b7a53", fontWeight: 600 }}>{message}</p>}

      {Array.isArray(summary.badges) && summary.badges.length > 0 && (
        <div style={badgeBarStyle}>
          {summary.badges.map((badge) => (
            <span key={badge} style={badgePillStyle}>{badge}</span>
          ))}
        </div>
      )}

      {isLoading ? (
        <p>Loading training modules...</p>
      ) : modules.length === 0 ? (
        <p>No training modules available.</p>
      ) : (
        modules.map((module) => {
          const moduleId = String(module._id);
          const completed = Boolean(module?.progress?.completed);
          const moduleScore = Number(module?.progress?.score || 0);
          const isBusy = updatingModuleId === moduleId;
          const certificateIssued = Boolean(module?.progress?.certificateIssued);
          const barWidth = completed ? 100 : Math.max(8, Math.min(92, Math.round(moduleScore * 0.7)));
          const scoreValue = Number(draftScores[moduleId] ?? 80);

          return (
            <article key={moduleId} style={listItemStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <h4 style={{ margin: 0 }}>{module.title}</h4>
                  <p style={descStyle}>{module.content}</p>
                </div>
                <span style={{ ...statusPillStyle, backgroundColor: completed ? "#144E2A" : "#111", color: completed ? "#a7f3d0" : "rgba(242,240,236,0.92)" }}>
                  {completed ? "Completed" : "In progress"}
                </span>
              </div>

              <div style={progressBarStyle}>
                <div style={{ ...progressFillStyle, width: `${barWidth}%`, backgroundColor: completed ? "#0b7a53" : "#0f5f8f" }} />
              </div>

              <div style={moduleMetaStyle}>
                <span>Score: <strong>{moduleScore}</strong></span>
                <span>{certificateIssued ? "Certificate issued" : "Certificate unlocks at score 70+"}</span>
              </div>

              <div style={actionRowStyle}>
                <button
                  onClick={() => updateModule({ trainingId: moduleId, completed: false, score: 0 })}
                  style={{ ...buttonStyle, backgroundColor: "#0f5f8f" }}
                  disabled={isBusy}
                >
                  Start Module
                </button>

                <label style={scoreLabelStyle}>
                  Completion Score
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scoreValue}
                    onChange={(event) => handleScoreChange(moduleId, event.target.value)}
                    style={rangeStyle}
                  />
                  <span style={scoreNumberStyle}>{scoreValue}</span>
                </label>

                <button
                  onClick={() => updateModule({ trainingId: moduleId, completed: true, score: scoreValue })}
                  style={buttonStyle}
                  disabled={isBusy}
                >
                  Mark Complete
                </button>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
};

const containerStyle = {
  maxWidth: "980px",
  margin: "20px auto",
  padding: "22px",
  border: "1px solid rgba(242,240,236,0.12)",
  borderRadius: "20px",
  backgroundColor: "#111",
};

const heroStyle = {
  borderRadius: "18px",
  padding: "20px",
  marginBottom: "16px",
  background: "linear-gradient(145deg, #0D0D0D, #141414)",
  color: "#fff",
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "2fr 1fr",
};

const heroEyebrowStyle = { margin: 0, textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.08em", opacity: 0.8 };
const heroTitleStyle = { margin: "8px 0 6px", fontSize: "28px" };
const heroTextStyle = { margin: 0, lineHeight: 1.55, opacity: 0.95, fontSize: "14px" };

const overallCardStyle = {
  backgroundColor: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "14px",
  padding: "14px",
};

const metricLabelStyle = { margin: 0, fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.88 };
const ringWrapStyle = { display: "flex", justifyContent: "center", margin: "10px 0" };
const ringStyle = {
  width: "84px",
  height: "84px",
  borderRadius: "50%",
  border: "6px solid #fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const ringValueStyle = { fontSize: "22px", fontWeight: 800 };
const metricGridStyle = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", textAlign: "center" };
const miniLabelStyle = { margin: "4px 0 0", fontSize: "11px", opacity: 0.9 };

const badgeBarStyle = { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" };
const badgePillStyle = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#166534",
  backgroundColor: "#dcfce7",
  border: "1px solid #86efac",
};

const listItemStyle = {
  padding: "16px",
  border: "1px solid rgba(242,240,236,0.12)",
  borderRadius: "14px",
  marginBottom: "12px",
  backgroundColor: "#141414",
  boxShadow: "0 8px 18px rgba(0, 0, 0, 0.35)",
};

const cardHeaderStyle = { display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start" };
const descStyle = { margin: "6px 0 0", color: "rgba(242,240,236,0.78)", lineHeight: 1.5, fontSize: "14px" };
const statusPillStyle = { borderRadius: "999px", padding: "4px 10px", fontSize: "12px", fontWeight: 700 };
const moduleMetaStyle = { marginTop: "8px", display: "flex", gap: "10px", flexWrap: "wrap", color: "rgba(242,240,236,0.78)", fontSize: "13px" };

const progressBarStyle = { width: "100%", height: "12px", backgroundColor: "#111", borderRadius: "999px", marginTop: "12px", overflow: "hidden" };
const progressFillStyle = { height: "100%", borderRadius: "999px", transition: "width 220ms ease" };

const actionRowStyle = {
  marginTop: "12px",
  display: "grid",
  gap: "10px",
  alignItems: "center",
  gridTemplateColumns: "minmax(110px, auto) 1fr minmax(130px, auto)",
};

const scoreLabelStyle = { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155" };
const rangeStyle = { flex: 1 };
const scoreNumberStyle = { width: "34px", textAlign: "right", fontWeight: 700 };

const buttonStyle = {
  padding: "10px 12px",
  backgroundColor: "#0b7a53",
  color: "#fff",
  border: "none",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: 700,
};

export default Training;
