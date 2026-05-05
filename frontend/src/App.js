import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import api from "./services/api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverProfile from "./pages/DriverProfile";
import Marketplace from "./pages/Marketplace";
import ProfileVerification from "./pages/ProfileVerification";
import EmploymentHistory from "./pages/EmploymentHistory";
import Availability from "./pages/Availability";
import Location from "./pages/Location";
import SalaryConfig from "./pages/SalaryConfig";
import InterviewPanel from "./pages/InterviewPanel";
import Analytics from "./pages/Analytics";
import Training from "./pages/Training";
import HireManagement from "./pages/HireManagement";
import Shortlist from "./pages/Shortlist";
import OfferSubmit from "./pages/OfferSubmit";
import InterviewSchedule from "./pages/InterviewSchedule";
import ShortTermRequest from "./pages/ShortTermRequest";
import ContractDashboard from "./pages/ContractDashboard";
import Chat from "./pages/Chat";
import AdminVerification from "./pages/AdminVerification";
import DriverComparison from "./pages/DriverComparison";
import OwnerProfile from "./pages/OwnerProfile";
import SupportChatWidget from "./components/chat/SupportChatWidget";
import DriverPublicProfile from "./pages/DriverPublicProfile";

const navStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  padding: "10px 15px",
  backgroundColor: "#f0f0f0",
  borderBottom: "1px solid #ddd",
  alignItems: "center",
};

const linkStyle = {
  textDecoration: "none",
  color: "#007bff",
  padding: "5px 10px",
  borderRadius: "4px",
  fontSize: "14px",
  cursor: "pointer",
  transition: "background-color 0.2s",
};

const logoutButtonStyle = {
  padding: "5px 10px",
  backgroundColor: "#dc3545",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
};

const roleLinks = {
  driver: [
    { to: "/profile", label: "Profile" },
    { to: "/upload-docs", label: "Profile Verification" },
    { to: "/employment", label: "Employment" },
    { to: "/availability", label: "Availability" },
    { to: "/location", label: "Location" },
    { to: "/salary", label: "Salary" },
    { to: "/interviews", label: "Interviews" },
    { to: "/analytics", label: "Analytics" },
    { to: "/training", label: "Training" },
  ],
  owner: [
    { to: "/owner-profile", label: "Owner Profile" },
    { to: "/marketplace", label: "Marketplace" },
    { to: "/shortlist", label: "Shortlist" },
    { to: "/comparison", label: "Compare Drivers" },
    { to: "/offers", label: "Offers" },
    { to: "/schedule-interview", label: "Schedule Interview" },
    { to: "/short-term", label: "Short-Term Request" },
    { to: "/hiring", label: "Hire Management" },
    { to: "/contracts", label: "Contracts" },
  ],
  admin: [{ to: "/admin", label: "Admin Panel" }],
};

const navSectionStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "8px",
  padding: "6px 10px",
  marginRight: "8px",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  border: "1px solid #d8d8d8",
};

const sectionLabelStyle = {
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#555",
  marginRight: "4px",
};

const getLandingPath = (role) => {
  if (role === "owner") return "/owner-search";
  if (role === "admin") return "/admin";
  return "/profile";
};

const getAuthRedirectPath = (user) => {
  if (!user) return "/login";
  return getLandingPath(user.role);
};

function App() {
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user")) || null;
  });
  const [verificationStatus, setVerificationStatus] = useState(() => {
    return localStorage.getItem("driverVerificationStatus") || "not_submitted";
  });
  const [driverWorkType, setDriverWorkType] = useState(() => {
    return localStorage.getItem("driverWorkType") || "";
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  const role = user?.role;
  const isDriver = role === "driver";
  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const authRedirectPath = getAuthRedirectPath(user);

  useEffect(() => {
    const loadVerificationStatus = async () => {
      if (!user?.id || user?.role !== "driver") {
        return;
      }

      try {
        const response = await api.get("/drivers/search");
        const profile = Array.isArray(response.data)
          ? response.data.find((item) => String(item.userId) === String(user.id))
          : null;
        const nextStatus = profile?.documents?.status || "not_submitted";
        const nextWorkType = profile?.workType || "";
        setVerificationStatus(nextStatus);
        setDriverWorkType(nextWorkType);
        localStorage.setItem("driverVerificationStatus", nextStatus);
        localStorage.setItem("driverWorkType", nextWorkType);
      } catch (err) {
        setVerificationStatus(localStorage.getItem("driverVerificationStatus") || "not_submitted");
        setDriverWorkType(localStorage.getItem("driverWorkType") || "");
      }
    };

    loadVerificationStatus();
  }, [user?.id, user?.role]);

  useEffect(() => {
    const handleVerificationEvent = (event) => {
      const nextStatus = event?.detail?.status || "not_submitted";
      setVerificationStatus(nextStatus);
      localStorage.setItem("driverVerificationStatus", nextStatus);
    };

    const handleDriverProfileEvent = (event) => {
      const nextWorkType = event?.detail?.workType || "";
      setDriverWorkType(nextWorkType);
      localStorage.setItem("driverWorkType", nextWorkType);
    };

    window.addEventListener("driver-verification-updated", handleVerificationEvent);
    window.addEventListener("driver-profile-updated", handleDriverProfileEvent);
    // app-level notifications (from socket or login)
    const handleAppNotif = (e) => {
      const notif = e?.detail;
      if (!notif) return;
      setToasts((t) => [...t, { id: String(notif._id || Date.now()), ...notif }]);
    };
    window.addEventListener("app:notification", handleAppNotif);
    return () => {
      window.removeEventListener("driver-verification-updated", handleVerificationEvent);
      window.removeEventListener("driver-profile-updated", handleDriverProfileEvent);
      window.removeEventListener("app:notification", handleAppNotif);
    };
  }, []);

  const [toasts, setToasts] = useState([]);

  const dismissToast = async (toast) => {
    setToasts((t) => t.filter((x) => String(x.id) !== String(toast.id)));

    try {
      const token = localStorage.getItem("token");
      if (token && toast?._id) {
        await api.put(`/auth/notifications/${toast._id}/read`);
      }
    } catch (err) {
      // keep dismissing locally even if marking read fails
      console.warn("Failed to mark notification as read", err?.response?.data?.message || err.message);
    }
  };

  const driverNavLinks = useMemo(() => {
    return roleLinks.driver
      .filter((item) => {
        if (item.to !== "/availability") {
          return true;
        }

        return String(driverWorkType || "").toLowerCase() === "temporary";
      })
      .map((item) => {
      if (item.to === "/upload-docs") {
        const isVerified = String(verificationStatus).toLowerCase() === "approved" || String(verificationStatus).toLowerCase() === "verified";
        return {
          ...item,
          label: isVerified ? "Profile Verification ✓" : "Profile Verification",
        };
      }

      return item;
    });
  }, [verificationStatus, driverWorkType]);

  return (
    <Router>
      <div>
        {user && (
          <nav style={navStyle}>
            {isDriver && (
              <div style={navSectionStyle}>
                <span style={sectionLabelStyle}>Driver Module</span>
                {driverNavLinks.map((item) => (
                  <Link key={item.to} to={item.to} style={linkStyle}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            {isOwner && (
              <div style={navSectionStyle}>
                <span style={sectionLabelStyle}>Owner Module</span>
                {roleLinks.owner.map((item) => (
                  <Link key={item.to} to={item.to} style={linkStyle}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            {isAdmin && (
              <div style={navSectionStyle}>
                <span style={sectionLabelStyle}>Admin Panel</span>
                {roleLinks.admin.map((item) => (
                  <Link key={item.to} to={item.to} style={linkStyle}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
          </nav>
        )}

        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />

          <Route path="/profile" element={isDriver ? <DriverProfile /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/employment" element={isDriver ? <EmploymentHistory /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/availability" element={isDriver ? <Availability /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/location" element={isDriver ? <Location /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/salary" element={isDriver ? <SalaryConfig /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/upload-docs" element={isDriver ? <ProfileVerification /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/interviews" element={isDriver ? <InterviewPanel /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/analytics" element={isDriver ? <Analytics /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/training" element={isDriver ? <Training /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/chat" element={isDriver ? <Chat /> : <Navigate to={authRedirectPath} replace />} />
          <Route
            path="/marketplace"
            element={isOwner ? <Marketplace currentRole={role} currentUser={user} /> : <Navigate to={authRedirectPath} replace />}
          />
          <Route path="/owner-profile" element={user ? <OwnerProfile currentRole={role} currentUser={user} /> : <Navigate to="/login" replace />} />
          <Route path="/owner-profile/:ownerId" element={user ? <OwnerProfile currentRole={role} currentUser={user} /> : <Navigate to="/login" replace />} />
          <Route path="/driver/:driverId" element={user ? <DriverPublicProfile /> : <Navigate to="/login" replace />} />

          <Route path="/owner-search" element={user ? <Navigate to="/marketplace" replace /> : <Navigate to="/login" replace />} />
          <Route path="/shortlist" element={isOwner ? <Shortlist /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/comparison" element={isOwner ? <DriverComparison /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/offers" element={isOwner ? <OfferSubmit /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/schedule-interview" element={isOwner ? <InterviewSchedule /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/short-term" element={isOwner ? <ShortTermRequest /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/hiring" element={isOwner ? <HireManagement /> : <Navigate to={authRedirectPath} replace />} />
          <Route path="/contracts" element={isOwner ? <ContractDashboard /> : <Navigate to={authRedirectPath} replace />} />

          <Route path="/admin" element={isAdmin ? <AdminVerification /> : <Navigate to={authRedirectPath} replace />} />
        </Routes>

        {user && <SupportChatWidget user={user} />}
        {/* simple toast area */}
        <div style={{ position: 'fixed', right: 20, top: 20, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {toasts.map((t) => (
            <div key={t.id} style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 6px 20px rgba(2,6,23,0.12)', minWidth: 260 }}>
              <div style={{ fontWeight: 700 }}>{t.type === 'verification' ? 'Profile Verification' : 'Notification'}</div>
              <div style={{ marginTop: 6 }}>{t.message}</div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => dismissToast(t)} style={{ border: 'none', background: '#0a7f5a', color: '#fff', padding: '6px 10px', borderRadius: 6 }}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Router>
  );
}

export default App;
