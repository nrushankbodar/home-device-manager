import React, { useEffect, useState } from "react";

import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        setPage("dashboard");
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  function handleAuth(authData) {
    localStorage.setItem("token", authData.access_token);
    localStorage.setItem("user", JSON.stringify(authData.user));
    setUser(authData.user);
    setPage("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("login");
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  if (page === "register") {
    return <Register onAuth={handleAuth} onSwitch={() => setPage("login")} />;
  }

  return <Login onAuth={handleAuth} onSwitch={() => setPage("register")} />;
}
