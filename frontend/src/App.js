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
import Layout from "./components/Layout";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
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
import PaymentSuccess from "./pages/PaymentSuccess";
import LandingPage from "./components/LandingPage";

const getLandingPath = (role) => {
  if (role === "owner") return "/owner-search";
  if (role === "admin") return "/admin";
  return "/profile";
};

const getAuthRedirectPath = (user) => {
  if (!user) return "/login";
  return getLandingPath(user.role);
};

const SOCKET_URL = "http://localhost:5000";

function App() {
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user")) || null;
  });
  const socketRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  const [toasts, setToasts] = useState([]);

  const role = user?.role;
  const isDriver = role === "driver";
  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const authRedirectPath = getAuthRedirectPath(user);

  const shouldShowNotification = useCallback(
    (notif) => {
      if (!notif) return false;

      const recipientUserId = notif?.data?.recipientUserId;
      const recipientRole = notif?.data?.recipientRole;

      if (recipientUserId && String(recipientUserId) !== String(user?.id)) {
        return false;
      }

      if (recipientRole && String(recipientRole) !== String(role)) {
        return false;
      }

      return true;
    },
    [role, user?.id]
  );

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
        localStorage.setItem("driverVerificationStatus", nextStatus);
        localStorage.setItem("driverWorkType", nextWorkType);
      } catch (err) {
        // keep using localStorage values on error
      }
    };

    loadVerificationStatus();
  }, [user?.id, user?.role]);

  useEffect(() => {
    const handleVerificationEvent = (event) => {
      const nextStatus = event?.detail?.status || "not_submitted";
      localStorage.setItem("driverVerificationStatus", nextStatus);
    };

    const handleDriverProfileEvent = (event) => {
      const nextWorkType = event?.detail?.workType || "";
      localStorage.setItem("driverWorkType", nextWorkType);
    };

    window.addEventListener("driver-verification-updated", handleVerificationEvent);
    window.addEventListener("driver-profile-updated", handleDriverProfileEvent);
    // app-level notifications (from socket or login)
    const handleAppNotif = (event) => {
      const notif = event?.detail;
      if (!notif) return;
      if (!shouldShowNotification(notif)) return;
      setToasts((t) => [...t, { id: String(notif._id || Date.now()), ...notif }]);
    };
    window.addEventListener("app:notification", handleAppNotif);
    return () => {
      window.removeEventListener("driver-verification-updated", handleVerificationEvent);
      window.removeEventListener("driver-profile-updated", handleDriverProfileEvent);
      window.removeEventListener("app:notification", handleAppNotif);
    };
  }, [user?.id, role, shouldShowNotification]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!user?.id || !token) {
      socketRef.current?.disconnect?.();
      socketRef.current = null;
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    const forwardNotification = (notif) => {
      if (!shouldShowNotification(notif)) {
        return;
      }

      window.dispatchEvent(new CustomEvent("app:notification", { detail: notif }));
    };

    socket.on("interview:updated", forwardNotification);
    socket.on("offer:created", forwardNotification);
    socket.on("offer:accepted", forwardNotification);
    socket.on("offer:rejected", forwardNotification);
    socket.on("contract:created", forwardNotification);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, role, shouldShowNotification]);

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

  return (
    <Router>
      <Routes>
        {/* Public Routes - Always Accessible */}
        <Route path="/" element={user ? <Navigate to={authRedirectPath} replace /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to={authRedirectPath} replace /> : <Login setUser={setUser} />} />
        <Route path="/register" element={user ? <Navigate to={authRedirectPath} replace /> : <Register />} />

        {/* Protected Routes - Require Authentication */}
        {user && (
          <>
            <Route element={<Layout user={user} onLogout={handleLogout} />}>
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
              <Route path="/marketplace" element={isOwner ? <Marketplace currentRole={role} currentUser={user} /> : <Navigate to={authRedirectPath} replace />} />
              <Route path="/owner-profile" element={<OwnerProfile currentRole={role} currentUser={user} />} />
              <Route path="/owner-profile/:ownerId" element={<OwnerProfile currentRole={role} currentUser={user} />} />
              <Route path="/driver/:driverId" element={<DriverPublicProfile />} />
              <Route path="/owner-search" element={<Navigate to="/marketplace" replace />} />
              <Route path="/shortlist" element={isOwner ? <Shortlist /> : <Navigate to={authRedirectPath} replace />} />
              <Route path="/comparison" element={isOwner ? <DriverComparison /> : <Navigate to={authRedirectPath} replace />} />
              <Route path="/offers" element={isOwner ? <OfferSubmit /> : <Navigate to={authRedirectPath} replace />} />
              <Route path="/schedule-interview" element={isOwner ? <InterviewSchedule /> : <Navigate to={authRedirectPath} replace />} />
              <Route path="/short-term" element={isOwner ? <ShortTermRequest /> : <Navigate to={authRedirectPath} replace />} />
              <Route path="/hiring" element={isOwner ? <HireManagement /> : <Navigate to={authRedirectPath} replace />} />
              <Route path="/hire-management" element={isOwner ? <HireManagement /> : <Navigate to={authRedirectPath} replace />} />
              <Route path="/contracts" element={isOwner ? <ContractDashboard /> : <Navigate to={authRedirectPath} replace />} />
              <Route path="/contract-dashboard" element={isOwner ? <ContractDashboard /> : <Navigate to={authRedirectPath} replace />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/admin" element={isAdmin ? <AdminVerification /> : <Navigate to={authRedirectPath} replace />} />
            </Route>
          </>
        )}

        {/* Catch-all: Always redirect to landing page for unauthenticated, or user's dashboard for authenticated */}
        <Route path="*" element={user ? <Navigate to={authRedirectPath} replace /> : <Navigate to="/" replace />} />
      </Routes>

      {/* Support Chat - Only show when authenticated */}
      {user && <SupportChatWidget user={user} />}

      {/* TOASTS — keep outside Layout so they float above everything */}
      <div style={{ position: "fixed", right: 20, top: 20, zIndex: 2000, display: "flex", flexDirection: "column", gap: 10 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ background: "#1A1A1A", border: "1px solid rgba(242,240,236,0.1)", padding: 16, borderRadius: 12, boxShadow: "0 6px 24px rgba(0,0,0,0.4)", minWidth: 280, color: "#F2F0EC" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px" }}>
              {t.type === "verification" ? "Profile Verification" : "Notification"}
            </div>
            <div style={{ marginTop: 6, fontSize: "13px", color: "rgba(242,240,236,0.7)" }}>{t.message}</div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => dismissToast(t)} style={{ border: "none", background: "#E8321A", color: "#fff", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "12px" }}>
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </Router>
  );
}

export default App;
