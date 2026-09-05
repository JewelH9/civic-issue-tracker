import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = user && (user.role === "staff" || user.role === "admin");
  const isAdmin = user && user.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="emblem">🏛️</span> Civic Issue Tracker
      </Link>

      <div className="navbar-links">
        <Link to="/map">Map</Link>
        {user ? (
          <>
            <Link to="/report">Report Issue</Link>
            <Link to="/history">History / Reports</Link>
            {isStaff && <Link to="/staff">Staff Dashboard</Link>}
            {isAdmin && <Link to="/admin-panel">Admin Panel</Link>}
            <Link to="/profile">My Profile</Link>
            <span className="navbar-user">👤 {user.username}</span>
            <button className="navbar-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="navbar-register-btn">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
