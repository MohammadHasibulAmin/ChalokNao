import React, { useEffect, useState } from "react";
import api from "../services/api";
import SupportChatWidget from "../components/chat/SupportChatWidget";

const AdminVerification = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [pending, setPending] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [suspendedUsers, setSuspendedUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: "", description: "", type: "misconduct" });
  const [toasts, setToasts] = useState([]);
  const user = JSON.parse(localStorage.getItem("user")) || null;

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const statsRes = await api.get("/admin/dashboard/stats");
      setStats(statsRes.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await api.get("/drivers/search");
      const all = Array.isArray(res.data) ? res.data : [];
      const pend = all.filter((d) => d?.documents?.status === "pending");
      setPending(pend);
      setAllDrivers(all);
    } catch (err) {
      setMessage("Error loading drivers");
    }
  };

  const fetchSuspendedUsers = async () => {
    try {
      const res = await api.get("/admin/users/suspended");
      setSuspendedUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch suspended users error:", err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get("/admin/reports");
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch reports error:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/admin/transactions");
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch transactions error:", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchDrivers();
    fetchSuspendedUsers();
    fetchReports();
    fetchTransactions();
  }, []);

  useEffect(() => {
    const handleAppNotif = (e) => {
      const notif = e?.detail;
      if (!notif) return;
      setToasts((t) => [...t, { id: String(notif._id || Date.now()), ...notif }]);
    };
    window.addEventListener("app:notification", handleAppNotif);
    return () => {
      window.removeEventListener("app:notification", handleAppNotif);
    };
  }, []);

  const dismissToast = (toastId) => {
    setToasts((t) => t.filter((x) => String(x.id) !== String(toastId)));
  };

  const handleVerifyDriver = async (driverId, status) => {
    try {
      await api.put(`/admin/verify-doc/${driverId}`, { status });
      setMessage(`Driver ${status}`);
      fetchDrivers();
      setSelected(null);
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.message || "Action failed"));
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      await api.put(`/admin/suspend-user/${userId}`, {});
      setMessage("User suspended");
      fetchSuspendedUsers();
      fetchDrivers();
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.message || "Failed to suspend"));
    }
  };

  const handleResumeUser = async (userId) => {
    try {
      await api.put(`/admin/resume-user/${userId}`, {});
      setMessage("User resumed");
      fetchSuspendedUsers();
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.message || "Failed to resume"));
    }
  };

  const handleCreateReport = async (reportedUserId) => {
    try {
      if (!reportForm.reason) {
        setMessage("Please select a reason");
        return;
      }
      await api.post("/admin/reports", {
        reportedById: user.id,
        reportedUserId,
        reason: reportForm.reason,
        description: reportForm.description,
        type: reportForm.type,
      });
      setMessage("Report created");
      setReportForm({ reason: "", description: "", type: "misconduct" });
      fetchReports();
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.message || "Failed to create report"));
    }
  };

  const handleResolveReport = async (reportId, resolution) => {
    try {
      if (!resolution) {
        setMessage("Please enter a resolution");
        return;
      }
      await api.put(`/admin/reports/${reportId}`, { resolution });
      setMessage("Report resolved");
      fetchReports();
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.message || "Failed to resolve"));
    }
  };

  return (
    <div style={pageStyle}>
      {/* Notification Toasts */}
      <div style={toastContainerStyle}>
        {toasts.map((toast) => (
          <div key={toast.id} style={toastStyle}>
            <div style={{ flex: 1 }}>
              <strong style={{ color: "#fff" }}>
                {toast.type === "message" ? "📨 New Message" : toast.message || "Notification"}
              </strong>
              {toast.message && toast.type !== "message" && (
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#f3f4f6" }}>
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Chat Widget */}
      {user && <SupportChatWidget user={user} />}

      <header style={headerStyle}>
        <h1 style={{ margin: 0, color: "#1f2937" }}>Admin Control Panel</h1>
        <p style={{ margin: "8px 0 0 0", color: "#6b7280", fontSize: 14 }}>
          Manage drivers, users, reports, and transactions
        </p>
      </header>

      {message && (
        <div style={messageStyle}>
          {message}
          <button onClick={() => setMessage("")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>
            ×
          </button>
        </div>
      )}

      <nav style={tabNavStyle}>
        {["dashboard", "verification", "suspension", "reports", "transactions"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...tabButtonStyle,
              borderBottom: activeTab === tab ? "3px solid #0ea5e9" : "none",
              color: activeTab === tab ? "#0ea5e9" : "#6b7280",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <div style={contentStyle}>
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div>
            <h2 style={{ color: "#1f2937", marginBottom: 20 }}>Dashboard Overview</h2>
            {loading || !stats ? (
              <p>Loading...</p>
            ) : (
              <div style={statsGridStyle}>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Total Drivers</div>
                  <div style={statValueStyle}>{stats.totalDrivers}</div>
                  <div style={statSubStyle}>{stats.verifiedDrivers} verified</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Pending Verifications</div>
                  <div style={statValueStyle}>{stats.pendingVerifications}</div>
                  <div style={statSubStyle}>Awaiting review</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Suspended Users</div>
                  <div style={statValueStyle}>{stats.suspendedUsers}</div>
                  <div style={statSubStyle}>Account locked</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Total Revenue</div>
                  <div style={statValueStyle}>৳{stats.totalRevenue.toLocaleString()}</div>
                  <div style={statSubStyle}>{stats.completedTransactions} transactions</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Open Reports</div>
                  <div style={statValueStyle}>{stats.openReports}</div>
                  <div style={statSubStyle}>Needs investigation</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DRIVER VERIFICATION TAB */}
        {activeTab === "verification" && (
          <div>
            <h2 style={{ color: "#1f2937", marginBottom: 20 }}>Driver Verification</h2>
            <div style={sectionStyle}>
              <h3 style={{ marginTop: 0, color: "#374151" }}>Pending Verifications ({pending.length})</h3>
              {pending.length === 0 ? (
                <p style={{ color: "#9ca3af" }}>No pending requests</p>
              ) : (
                <div style={gridStyle}>
                  {pending.map((d) => (
                    <div key={d._id} style={cardStyle} onClick={() => setSelected(d)}>
                      <img
                        src={d.photo ? `${api.defaults.baseURL.replace("/api", "")}/uploads/${d.photo}` : "/default-avatar.png"}
                        alt="avatar"
                        style={avatarSmallStyle}
                      />
                      <div>
                        <div style={cardTitleStyle}>{d.name || d.userName}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>
                          {d.experienceYears} years exp • Rating: {d.ratingAvg || "N/A"}
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto", color: "#0ea5e9" }}>→</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selected && (
              <div style={detailsCardStyle}>
                <div style={detailsHeaderStyle}>
                  <div>
                    <img
                      src={selected.photo ? `${api.defaults.baseURL.replace("/api", "")}/uploads/${selected.photo}` : "/default-avatar.png"}
                      alt="profile"
                      style={avatarLargeStyle}
                    />
                  </div>
                  <div style={{ flex: 1, marginLeft: 20 }}>
                    <h3 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>{selected.name || selected.userName}</h3>
                    <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
                      {selected.location?.city || "—"} • {selected.experienceYears} years experience
                    </p>
                    <div style={{ marginTop: 12, display: "flex", gap: 16 }}>
                      <div>
                        <span style={{ color: "#6b7280", fontSize: 12 }}>License:</span> {selected.licenseNumber || "—"}
                      </div>
                      <div>
                        <span style={{ color: "#6b7280", fontSize: 12 }}>Salary:</span> ৳{selected.expectedSalary?.monthly || "—"}
                      </div>
                      <div>
                        <span style={{ color: "#6b7280", fontSize: 12 }}>Rating:</span> {selected.ratingAvg || "—"}⭐
                      </div>
                    </div>
                  </div>
                </div>

                {selected.documents && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
                    <h4 style={{ marginBottom: 12, color: "#1f2937" }}>Uploaded Documents</h4>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      {selected.documents.licenseUrl && (
                        <div>
                          <p style={{ margin: "0 0 8px 0", color: "#6b7280", fontSize: 12 }}>License</p>
                          <img
                            src={`${api.defaults.baseURL.replace("/api", "")}/uploads/${selected.documents.licenseUrl}`}
                            alt="license"
                            style={{ maxWidth: 300, borderRadius: 8, border: "1px solid #e5e7eb" }}
                          />
                        </div>
                      )}
                      {selected.documents.nidUrl && (
                        <div>
                          <p style={{ margin: "0 0 8px 0", color: "#6b7280", fontSize: 12 }}>NID</p>
                          <img
                            src={`${api.defaults.baseURL.replace("/api", "")}/uploads/${selected.documents.nidUrl}`}
                            alt="nid"
                            style={{ maxWidth: 300, borderRadius: 8, border: "1px solid #e5e7eb" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                  <button onClick={() => handleVerifyDriver(selected._id, "approved")} style={buttonPrimaryStyle}>
                    ✓ Approve
                  </button>
                  <button onClick={() => handleVerifyDriver(selected._id, "rejected")} style={buttonDangerStyle}>
                    ✕ Reject
                  </button>
                  <button onClick={() => setSelected(null)} style={buttonSecondaryStyle}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUSPENSION TAB */}
        {activeTab === "suspension" && (
          <div>
            <h2 style={{ color: "#1f2937", marginBottom: 20 }}>User Account Management</h2>

            <div style={sectionStyle}>
              <h3 style={{ marginTop: 0, color: "#374151" }}>All Drivers</h3>
              <div style={gridStyle}>
                {allDrivers.map((d) => {
                  const isSuspended = suspendedUsers.some((u) => String(u._id) === String(d.userId));
                  return (
                    <div key={d._id} style={{ ...cardStyle, opacity: isSuspended ? 0.6 : 1 }}>
                      <img
                        src={d.photo ? `${api.defaults.baseURL.replace("/api", "")}/uploads/${d.photo}` : "/default-avatar.png"}
                        alt="avatar"
                        style={avatarSmallStyle}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={cardTitleStyle}>{d.name || d.userName}</div>
                        <div style={{ fontSize: 12, color: isSuspended ? "#dc2626" : "#9ca3af" }}>
                          {isSuspended ? "🔒 Suspended" : "✓ Active"}
                        </div>
                      </div>
                      <button
                        onClick={() => (isSuspended ? handleResumeUser(d.userId) : handleSuspendUser(d.userId))}
                        style={isSuspended ? buttonSuccessStyle : buttonWarningStyle}
                      >
                        {isSuspended ? "Resume" : "Suspend"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {suspendedUsers.length > 0 && (
              <div style={sectionStyle}>
                <h3 style={{ marginTop: 0, color: "#374151" }}>Suspended Users ({suspendedUsers.length})</h3>
                <div style={tableStyle}>
                  {suspendedUsers.map((u) => (
                    <div key={u._id} style={tableRowStyle}>
                      <div>{u.name || u.email}</div>
                      <div style={{ color: "#dc2626" }}>Suspended</div>
                      <button onClick={() => handleResumeUser(u._id)} style={buttonSmallStyle}>
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <div>
            <h2 style={{ color: "#1f2937", marginBottom: 20 }}>Report Monitoring</h2>

            <div style={sectionStyle}>
              <h3 style={{ marginTop: 0, color: "#374151" }}>Create Report</h3>
              <div style={formStyle}>
                <input
                  type="text"
                  placeholder="Reported User ID"
                  value={reportForm.reportedUserId || ""}
                  onChange={(e) => setReportForm({ ...reportForm, reportedUserId: e.target.value })}
                  style={inputStyle}
                />

                <select
                  value={reportForm.reason}
                  onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select Reason</option>
                  <option value="harassment">Harassment</option>
                  <option value="fraud">Fraud</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="misconduct">Misconduct</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={reportForm.type}
                  onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                  style={inputStyle}
                >
                  <option value="misconduct">Misconduct</option>
                  <option value="fraud">Fraud</option>
                  <option value="violation">Violation</option>
                </select>

                <textarea
                  placeholder="Description"
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  style={{ ...inputStyle, minHeight: 100 }}
                />

                <button
                  onClick={() => {
                    if (!reportForm.reportedUserId) {
                      setMessage("Please enter a User ID");
                      return;
                    }
                    handleCreateReport(reportForm.reportedUserId);
                  }}
                  style={buttonPrimaryStyle}
                >
                  Create Report
                </button>
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={{ marginTop: 0, color: "#374151" }}>Reports ({reports.length})</h3>
              {reports.length === 0 ? (
                <p style={{ color: "#9ca3af" }}>No reports</p>
              ) : (
                <div>
                  {reports.map((r) => (
                    <div key={r._id} style={reportCardStyle}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <h4 style={{ margin: 0, color: "#1f2937" }}>{r.reason || "Unknown"}</h4>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              fontSize: 12,
                              backgroundColor: r.status === "open" ? "#fee2e2" : "#dcfce7",
                              color: r.status === "open" ? "#dc2626" : "#166534",
                            }}
                          >
                            {r.status}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0", color: "#6b7280", fontSize: 14 }}>{r.description}</p>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                          Type: {r.type} • Reported: {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                        {r.status === "resolved" && r.resolution && (
                          <div style={{ marginTop: 8, padding: 8, backgroundColor: "#f3f4f6", borderRadius: 4, color: "#374151", fontSize: 12 }}>
                            <strong>Resolution:</strong> {r.resolution}
                          </div>
                        )}
                      </div>
                      {r.status === "open" && (
                        <button
                          onClick={() => {
                            const resolution = prompt("Resolution:");
                            if (resolution) handleResolveReport(r._id, resolution);
                          }}
                          style={buttonSmallStyle}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === "transactions" && (
          <div>
            <h2 style={{ color: "#1f2937", marginBottom: 20 }}>Commission & Transactions</h2>

            <div style={sectionStyle}>
              <h3 style={{ marginTop: 0, color: "#374151" }}>Transaction Summary</h3>
              <div style={statsGridStyle}>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Total Transactions</div>
                  <div style={statValueStyle}>{transactions.length}</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Completed</div>
                  <div style={statValueStyle}>{transactions.filter((t) => t.status === "completed").length}</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Pending</div>
                  <div style={statValueStyle}>{transactions.filter((t) => t.status === "pending_payment").length}</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Total Commission</div>
                  <div style={statValueStyle}>৳{transactions.reduce((sum, t) => sum + (t.commission || 0), 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={{ marginTop: 0, color: "#374151" }}>Transaction Details</h3>
              {transactions.length === 0 ? (
                <p style={{ color: "#9ca3af" }}>No transactions</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={tableFullStyle}>
                    <thead>
                      <tr style={tableHeadStyle}>
                        <th>Hire ID</th>
                        <th>Amount</th>
                        <th>Commission</th>
                        <th>Owner Gets</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t._id} style={tableBodyRowStyle}>
                          <td style={{ fontFamily: "monospace", fontSize: 12 }}>{String(t.hireId).slice(0, 8)}</td>
                          <td>৳{t.amount?.toLocaleString()}</td>
                          <td style={{ color: "#dc2626" }}>৳{t.commission?.toLocaleString()}</td>
                          <td style={{ color: "#16a34a" }}>৳{t.ownerAmount?.toLocaleString()}</td>
                          <td>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: 12,
                                backgroundColor: t.status === "completed" ? "#dcfce7" : "#fef3c7",
                                color: t.status === "completed" ? "#166534" : "#92400e",
                              }}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: "#6b7280" }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// STYLES
const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#f9fafb",
  padding: "20px",
};

const toastContainerStyle = {
  position: "fixed",
  top: 20,
  right: 20,
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  maxWidth: 400,
};

const toastStyle = {
  padding: "14px 16px",
  backgroundColor: "#0ea5e9",
  color: "#fff",
  borderRadius: 8,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  animation: "slideIn 0.3s ease",
};

const headerStyle = {
  marginBottom: 30,
  paddingBottom: 20,
  borderBottom: "1px solid #e5e7eb",
};

const messageStyle = {
  marginBottom: 20,
  padding: "12px 16px",
  backgroundColor: "#10b981",
  color: "#fff",
  borderRadius: 8,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const tabNavStyle = {
  display: "flex",
  gap: 0,
  marginBottom: 30,
  borderBottom: "1px solid #e5e7eb",
};

const tabButtonStyle = {
  padding: "12px 20px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  transition: "all 0.3s",
};

const contentStyle = {
  maxWidth: 1200,
  margin: "0 auto",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginBottom: 30,
};

const statCardStyle = {
  padding: 16,
  backgroundColor: "#fff",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const statLabelStyle = {
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 8,
  fontWeight: 500,
};

const statValueStyle = {
  fontSize: 28,
  fontWeight: 700,
  color: "#1f2937",
  marginBottom: 4,
};

const statSubStyle = {
  fontSize: 12,
  color: "#9ca3af",
};

const sectionStyle = {
  marginBottom: 30,
  padding: 20,
  backgroundColor: "#fff",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: 16,
};

const cardStyle = {
  padding: 16,
  backgroundColor: "#f9fafb",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  gap: 12,
  cursor: "pointer",
  transition: "all 0.2s",
};

const avatarSmallStyle = {
  width: 48,
  height: 48,
  borderRadius: 8,
  objectFit: "cover",
};

const cardTitleStyle = {
  fontWeight: 600,
  color: "#1f2937",
  fontSize: 14,
};

const detailsCardStyle = {
  marginTop: 20,
  padding: 20,
  backgroundColor: "#fff",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const detailsHeaderStyle = {
  display: "flex",
  gap: 20,
};

const avatarLargeStyle = {
  width: 100,
  height: 100,
  borderRadius: 8,
  objectFit: "cover",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  fontFamily: "inherit",
};

const reportCardStyle = {
  padding: 16,
  backgroundColor: "#f9fafb",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  marginBottom: 12,
  display: "flex",
  gap: 16,
};

const tableStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const tableRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 12,
  backgroundColor: "#f9fafb",
  borderRadius: 6,
  border: "1px solid #e5e7eb",
};

const tableFullStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 12,
};

const tableHeadStyle = {
  backgroundColor: "#f3f4f6",
  fontWeight: 600,
  color: "#374151",
  fontSize: 13,
};

const tableBodyRowStyle = {
  borderBottom: "1px solid #e5e7eb",
  padding: 12,
};

const buttonPrimaryStyle = {
  padding: "10px 16px",
  backgroundColor: "#0ea5e9",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
  transition: "background-color 0.2s",
};

const buttonDangerStyle = {
  padding: "10px 16px",
  backgroundColor: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
};

const buttonSecondaryStyle = {
  padding: "10px 16px",
  backgroundColor: "#d1d5db",
  color: "#374151",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
};

const buttonWarningStyle = {
  padding: "6px 12px",
  backgroundColor: "#f59e0b",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};

const buttonSuccessStyle = {
  padding: "6px 12px",
  backgroundColor: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};

const buttonSmallStyle = {
  padding: "6px 12px",
  backgroundColor: "#0ea5e9",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};

export default AdminVerification;
