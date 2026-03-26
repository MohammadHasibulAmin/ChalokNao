import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverProfile from "./pages/DriverProfile";

function App() {
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user")) || null;
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <Router>
      <div>
        {/* Show logout button if logged in */}
        {user && (
          <div>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}

        <Routes>
          {/* Redirect to profile if logged in */}
          <Route
            path="/"
            element={user ? <Navigate to="/profile" /> : <Navigate to="/login" />}
          />

          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={user ? <DriverProfile /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;