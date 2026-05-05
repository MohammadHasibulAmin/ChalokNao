import React, { useEffect, useState } from "react";
import api from "../services/api";

const AdminVerification = () => {
  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get("/drivers/search");
      const all = Array.isArray(res.data) ? res.data : [];
      const pend = all.filter((d) => d?.documents?.status === "pending");
      setPending(pend);
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not load pending verifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (driverId, status) => {
    try {
      await api.put(`/admin/verify-doc/${driverId}`, { status });
      setMessage(`Driver ${status}`);
      // refresh list
      await fetchPending();
      setSelected(null);
    } catch (err) {
      setMessage(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Admin Verification Dashboard</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <div style={sectionStyle}>
        <h3>Pending Verifications</h3>
        {loading ? (
          <p>Loading...</p>
        ) : pending.length === 0 ? (
          <p>No pending verification requests.</p>
        ) : (
          <div style={listGridStyle}>
            {pending.map((d) => (
              <div key={d._id} style={listItemStyle} onClick={() => setSelected(d)}>
                <img
                  src={d.photo ? `${api.defaults.baseURL.replace('/api','')}/uploads/${d.photo}` : '/public/default-avatar.png'}
                  alt="avatar"
                  style={avatarSmallStyle}
                />
                <div style={{ marginLeft: 12 }}>
                  <div style={nameStyle}>{d.name || d.userName || `Driver ${d.userId}`}</div>
                  <div style={subStyle}>Requested verification</div>
                </div>
                <div style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: 13 }}>View</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div style={sectionStyle}>
          <div style={profileCardStyle}>
            <div style={profileLeftStyle}>
              <img
                src={selected.photo ? `${api.defaults.baseURL.replace('/api','')}/uploads/${selected.photo}` : '/public/default-avatar.png'}
                alt="profile"
                style={avatarLargeStyle}
              />
              <div style={{ marginLeft: 16 }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{selected.name || selected.userName}</div>
                <div style={{ color: '#6b7280', marginTop: 6 }}>{selected.locationCity || selected.location?.city || '—'}</div>
                <div style={{ marginTop: 8 }}>
                  <strong>Status:</strong> {selected.status || 'Available'}
                </div>
              </div>
            </div>

            <div style={profileRightStyle}>
              <div style={infoRow}><strong>Experience:</strong> {selected.experienceYears ?? '—'} years</div>
              <div style={infoRow}><strong>License No:</strong> {selected.licenseNumber || '—'}</div>
              <div style={infoRow}><strong>Expected Salary:</strong> {selected.expectedSalary?.monthly ? `BDT ${selected.expectedSalary.monthly}/mo` : '—'}</div>
              <div style={infoRow}><strong>Rating:</strong> {selected.ratingAvg ?? '—'}</div>
              {Array.isArray(selected.employmentHistory) && selected.employmentHistory.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <strong>Employment:</strong>
                  <ul>
                    {selected.employmentHistory.map((e) => (
                      <li key={e._id}>{e.employerName} — {e.duration}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Uploaded Documents</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {selected.documents?.licenseUrl && (
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>License</div>
                      <img src={`${api.defaults.baseURL.replace('/api','')}/uploads/${selected.documents.licenseUrl}`} alt="license" style={{ maxWidth: 320, borderRadius: 8 }} />
                    </div>
                  )}

                  {selected.documents?.nidUrl && (
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>NID</div>
                      <img src={`${api.defaults.baseURL.replace('/api','')}/uploads/${selected.documents.nidUrl}`} alt="nid" style={{ maxWidth: 320, borderRadius: 8 }} />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
                <button onClick={() => handleAction(selected._id, "approved")} style={buttonStyle}>
                  Approve
                </button>
                <button onClick={() => handleAction(selected._id, "rejected")} style={{ ...buttonStyle, backgroundColor: "#dc3545" }}>
                  Reject
                </button>
                <button onClick={() => setSelected(null)} style={{ ...buttonStyle, backgroundColor: "#6b7280" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// styles
const listGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
};

const listItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 12,
  borderRadius: 10,
  background: '#fff',
  boxShadow: '0 4px 12px rgba(2,6,23,0.06)',
  cursor: 'pointer',
};

const avatarSmallStyle = {
  width: 48,
  height: 48,
  borderRadius: 10,
  objectFit: 'cover',
};

const nameStyle = { fontWeight: 800 };
const subStyle = { fontSize: 13, color: '#6b7280' };

const profileCardStyle = {
  display: 'flex',
  gap: 18,
  padding: 18,
  borderRadius: 12,
  background: '#fff',
  boxShadow: '0 12px 30px rgba(2,6,23,0.06)',
  alignItems: 'flex-start',
};

const profileLeftStyle = { display: 'flex', alignItems: 'center' };
const profileRightStyle = { flex: 1 };
const avatarLargeStyle = { width: 120, height: 120, borderRadius: 12, objectFit: 'cover' };
const infoRow = { marginTop: 8, color: '#374151' };

const containerStyle = {
  maxWidth: "700px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const sectionStyle = { marginBottom: "30px", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#fff" };
const buttonStyle = { padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };

export default AdminVerification;
