import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// Endpoints that should NEVER get an Authorization header attached,
// since they're meant to be called by logged-out users.
const PUBLIC_ENDPOINTS = ["/register/", "/token/", "/token/refresh/"];

api.interceptors.request.use((config) => {
  const isPublic = PUBLIC_ENDPOINTS.some((path) => config.url.includes(path));
  if (!isPublic) {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
