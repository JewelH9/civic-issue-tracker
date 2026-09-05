import { useState, useEffect } from "react";
import api from "../api/axios";

const ROLES = ["citizen", "staff", "admin"];

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadUsers = () => {
    setLoading(true);
    api
      .get("/admin/users/")
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateUser = async (id, payload) => {
    try {
      await api.patch(`/admin/users/${id}/`, payload);
      setMessage("User updated.");
      loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update user.");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const deleteUser = async (id, username, issueCount) => {
    const warning =
      issueCount > 0
        ? `Delete "${username}"? This will PERMANENTLY delete their account AND all ${issueCount} issue(s) they reported, including resolved ones. This cannot be undone.`
        : `Delete "${username}"? This will permanently delete their account. This cannot be undone.`;

    if (!window.confirm(warning)) return;

    try {
      const res = await api.delete(`/admin/users/${id}/`);
      setMessage(res.data.message);
      loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to delete user.");
    }
    setTimeout(() => setMessage(""), 5000);
  };

  if (loading)
    return (
      <div className="page-container">
        <p>Loading users...</p>
      </div>
    );

  return (
    <div className="page-container admin-panel">
      <h2 className="page-title">Admin Panel</h2>
      <p className="page-subtitle">Manage user roles and account status.</p>

      <div className="privacy-note">
        ⚠️ Deleting a user is permanent and also deletes every issue they've
        reported. Prefer "Suspend / Ban" unless permanent removal is truly
        necessary.
      </div>

      {message && <div className="success-banner">{message}</div>}

      <div className="user-table">
        {users.map((u) => (
          <div
            key={u.id}
            className={`user-row ${!u.is_active ? "user-row-banned" : ""}`}
          >
            <div className="user-info">
              <strong>{u.username}</strong>
              <span className="issue-meta">{u.email || "no email"}</span>
              {!u.is_active && <span className="banned-badge">BANNED</span>}
            </div>

            <select
              value={u.role || "citizen"}
              onChange={(e) => updateUser(u.id, { role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <button
              className={u.is_active ? "ban-btn" : "unban-btn"}
              onClick={() => updateUser(u.id, { is_active: !u.is_active })}
            >
              {u.is_active ? "Suspend / Ban" : "Reactivate"}
            </button>

            <button
              className="delete-user-btn"
              onClick={() => deleteUser(u.id, u.username, u.issue_count || 0)}
            >
              🗑️ Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
