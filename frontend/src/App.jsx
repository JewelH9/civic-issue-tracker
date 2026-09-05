import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ReportIssue from "./pages/ReportIssue";
import HistoryReports from "./pages/HistoryReports";
import Profile from "./pages/Profile";
import StaffRoute from "./components/StaffRoute";
import StaffDashboard from "./pages/StaffDashboard";
import AdminRoute from "./components/AdminRoute";
import AdminPanel from "./pages/AdminPanel";
import MapView from "./pages/MapView";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="tricolor-strip" />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportIssue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <StaffRoute>
                <StaffDashboard />
              </StaffRoute>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route path="/map" element={<MapView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
