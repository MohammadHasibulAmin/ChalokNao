import React from "react";

const Logout = ({ setUser }) => {
    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        // Optionally redirect to login page
        window.location.href = "/login";
    };

    return (
        <button onClick={handleLogout} style={{
            background: "#ff4d4f",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
        }}>
            Logout
        </button>
    );
};

export default Logout;