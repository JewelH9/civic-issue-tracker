import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUsername = localStorage.getItem("username");
    const savedRole = localStorage.getItem("role");
    return savedUsername ? { username: savedUsername, role: savedRole } : null;
  });

  const login = async (username, password) => {
    const response = await api.post("/token/", { username, password });
    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);
    localStorage.setItem("username", username);

    // Fetch role right after login so Navbar/routes know who they're dealing with
    const profileRes = await api.get("/profile/me/");
    const role = profileRes.data.role;
    localStorage.setItem("role", role);

    setUser({ username, role });
  };

  const register = async (username, email, password) => {
    await api.post("/register/", { username, email, password });
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
