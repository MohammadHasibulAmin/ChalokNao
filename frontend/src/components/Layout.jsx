import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";

const Logo = () => (
  <div style={{ padding: "0 20px 24px", fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 800, borderBottom: "1px solid rgba(242,240,236,0.08)" }}>
    Chalok<span style={{ color: "#E8321A" }}>Nao</span>
  </div>
);

const SidebarLink = ({ to, label, badge }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 20px", fontSize: "13px", textDecoration: "none",
      color: isActive ? "#F2F0EC" : "rgba(242,240,236,0.80)",
      background: isActive ? "rgba(232,50,26,0.1)" : "transparent",
      borderLeft: isActive ? "3px solid #E8321A" : "3px solid transparent",
      transition: "all 0.15s",
    }}>
      {label}
      {badge && (
        <span style={{ background: "#E8321A", color: "#fff", fontSize: "10px", padding: "2px 7px", borderRadius: "10px", fontWeight: 600 }}>
          {badge}
        </span>
      )}
    </Link>
  );
};

const driverLinks = [
  { to: "/profile", label: "My Profile" },
  { to: "/upload-docs", label: "Documents" },
  { to: "/employment", label: "Employment" },
  { to: "/availability", label: "Availability" },
  { to: "/location", label: "Location" },
  { to: "/salary", label: "Salary Config" },
  { to: "/interviews", label: "Interviews" },
  { to: "/analytics", label: "Analytics" },
  { to: "/training", label: "Training" },
];

const ownerLinks = [
  { to: "/owner-profile", label: "My Profile" },
  { to: "/marketplace", label: "Find Drivers" },
  { to: "/shortlist", label: "Shortlist" },
  { to: "/comparison", label: "Compare Drivers" },
  { to: "/offers", label: "Send Offers" },
  { to: "/schedule-interview", label: "Interviews" },
  { to: "/short-term", label: "Short-Term Hire" },
  { to: "/hiring", label: "Hire Management" },
  { to: "/contracts", label: "Contracts" },
];

const adminLinks = [
  { to: "/admin", label: "Admin Panel" },
];

export default function Layout({ user, onLogout }) {
  const role = user?.role;

  const links = role === "driver" ? driverLinks
    : role === "owner" ? ownerLinks
    : adminLinks;

  const sectionLabel = role === "driver" ? "Driver Portal"
    : role === "owner" ? "Owner Portal"
    : "Admin";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh", background: "#0D0D0D", color: "#F2F0EC", fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* SIDEBAR */}
      <aside style={{ background: "#111", borderRight: "1px solid rgba(242,240,236,0.08)", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <Logo />
        <div style={{ padding: "16px 12px 8px", fontSize: "10px", color: "rgba(242,240,236,0.72)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
          {sectionLabel}
        </div>
        {links.map(link => (
          <SidebarLink key={link.to} to={link.to} label={link.label} />
        ))}
        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid rgba(242,240,236,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E8321A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "12px", color: "#fff", flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500 }}>{user?.name || "User"}</div>
              <div style={{ fontSize: "11px", color: "rgba(242,240,236,0.75)", textTransform: "capitalize" }}>{role}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: "100%", padding: "8px", background: "rgba(232,50,26,0.12)", border: "1px solid rgba(232,50,26,0.25)", borderRadius: "7px", color: "#F88070", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{ display: "flex", flexDirection: "column", overflowY: "auto" }}>
        {/* TOPBAR */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "1px solid rgba(242,240,236,0.08)", background: "rgba(13,13,13,0.88)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", fontWeight: 700 }}>
            ChalokNao
          </div>
          <div style={{ fontSize: "13px", color: "rgba(242,240,236,0.78)" }}>
            Welcome back, <span style={{ color: "#F2F0EC", fontWeight: 500 }}>{user?.name}</span>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ padding: "28px", flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}