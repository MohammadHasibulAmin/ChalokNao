import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("driver");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/auth/register", { name, email, password, role });
            setMessage("Registration successful! Please login.");
            setTimeout(() => navigate("/login"), 1500); // auto redirect to login
        } catch (err) {
            setMessage(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "10px" }}>
            <h2 style={{ textAlign: "center" }}>Register</h2>
            {message && <p style={{ color: message.includes("successful") ? "green" : "red" }}>{message}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", margin: "10px 0" }}
                />
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
                <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{ width: "100%", padding: "10px", margin: "10px 0" }}
                >
                    <option value="driver">Driver</option>
                    <option value="owner">Owner</option>
                </select>
                <button type="submit" style={{ width: "100%", padding: "10px", marginTop: "10px" }}>Register</button>
            </form>
            <p style={{ marginTop: "10px", textAlign: "center" }}>
                Already have an account? <Link to="/login">Login</Link>
            </p>
        </div>
    );
};

export default Register;