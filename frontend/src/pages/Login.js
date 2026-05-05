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
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const Login = ({ setUser }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/auth/login", { email, password });
            const loggedInUser = res.data.user;
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(loggedInUser));
            setUser(loggedInUser);

            // dispatch any notifications included in login response
            const notifications = loggedInUser.notifications || [];
            if (Array.isArray(notifications) && notifications.length) {
                notifications.forEach((n) => window.dispatchEvent(new CustomEvent("app:notification", { detail: n })));
            }

            if (loggedInUser.role === "owner") {
                navigate("/owner-search", { replace: true });
            } else if (loggedInUser.role === "admin") {
                navigate("/admin", { replace: true });
            } else {
                navigate("/profile", { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid rgba(242,240,236,0.18)", borderRadius: "10px" }}>
            <h2 style={{ textAlign: "center" }}>Login</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", margin: "10px 0" }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", margin: "10px 0" }}
                />
                <button type="submit" style={{ width: "100%", padding: "10px", marginTop: "10px" }}>Login</button>
            </form>
            <p style={{ marginTop: "10px", textAlign: "center" }}>
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </div>
    );
};

export default Login;