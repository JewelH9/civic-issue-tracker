import { useState, useEffect } from "react";
import api from "../api/axios";

export default function StaffDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transitionsMap, setTransitionsMap] = useState({}); // issueId -> [statuses]
  const [selectedStatus, setSelectedStatus] = useState({}); // issueId -> statusId
  const [notes, setNotes] = useState({}); // issueId -> note text
  const [historyMap, setHistoryMap] = useState({}); // issueId -> [history entries]
  const [openHistory, setOpenHistory] = useState({}); // issueId -> bool
  const [message, setMessage] = useState("");

  const loadIssues = async () => {
    setLoading(true);
    const res = await api.get("/issues/");
    setIssues(res.data);

    // For each issue, fetch its valid next statuses in parallel.
    // Fine at this scale (a handful of open issues); a production
    // system with thousands of issues would paginate and lazy-load
    // this per-row instead of all at once.
    const entries = await Promise.all(
      res.data.map(async (issue) => {
        const r = await api.get(`/issues/${issue.id}/allowed-transitions/`);
        return [issue.id, r.data];
      }),
    );
    setTransitionsMap(Object.fromEntries(entries));
    setLoading(false);
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const handleStatusChange = async (issueId) => {
    const newStatusId = selectedStatus[issueId];
    if (!newStatusId) {
      setMessage("Please select a status first.");
      return;
    }
    try {
      await api.post(`/issues/${issueId}/change-status/`, {
        new_status_id: newStatusId,
        note: notes[issueId] || "",
      });
      setMessage("Status updated successfully.");
      setNotes({ ...notes, [issueId]: "" });
      loadIssues(); // refresh everything, including new allowed transitions
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update status.");
    }
    setTimeout(() => setMessage(""), 4000);
  };

  const handleDelete = async (issueId) => {
    if (
      !window.confirm(
        "Permanently delete this resolved issue? This cannot be undone.",
      )
    ) {
      return;
    }
    try {
      await api.delete(`/issues/${issueId}/`);
      setMessage("Issue deleted.");
      loadIssues();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to delete issue.");
    }
    setTimeout(() => setMessage(""), 4000);
  };

  const toggleHistory = async (issueId) => {
    const isOpen = openHistory[issueId];
    setOpenHistory({ ...openHistory, [issueId]: !isOpen });

    // Only fetch history the first time it's opened, not every toggle
    if (!isOpen && !historyMap[issueId]) {
      const res = await api.get(`/issues/${issueId}/history/`);
      setHistoryMap({ ...historyMap, [issueId]: res.data });
    }
  };

  if (loading)
    return (
      <div className="page-container">
        <p>Loading issues...</p>
      </div>
    );

  return (
    <div className="page-container staff-dashboard">
      <h2 className="page-title">Staff Dashboard</h2>
      <p className="page-subtitle">
        Update issue statuses and review their audit trail.
      </p>

      {message && <div className="success-banner">{message}</div>}

      {issues.length === 0 ? (
        <p>No issues to manage.</p>
      ) : (
        <div className="issue-list">
          {issues.map((issue) => {
            const options = transitionsMap[issue.id] || [];
            return (
              <div key={issue.id} className="staff-issue-card">
                <div className="issue-top-row">
                  <h3>{issue.title}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: issue.status.color }}
                  >
                    {issue.status.name}
                  </span>
                </div>
                <p className="issue-category">{issue.category.name}</p>
                <p className="issue-description">{issue.description}</p>
                <p className="issue-meta">
                  📍 {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                  {" · "}Reported by {issue.reported_by.username}
                </p>

                {options.length === 0 ? (
                  <p className="terminal-note">
                    ✅ This issue has reached a final status.
                  </p>
                ) : (
                  <div className="staff-actions">
                    <select
                      value={selectedStatus[issue.id] || ""}
                      onChange={(e) =>
                        setSelectedStatus({
                          ...selectedStatus,
                          [issue.id]: e.target.value,
                        })
                      }
                    >
                      <option value="">Move to...</option>
                      {options.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Optional note"
                      value={notes[issue.id] || ""}
                      onChange={(e) =>
                        setNotes({ ...notes, [issue.id]: e.target.value })
                      }
                    />
                    <button onClick={() => handleStatusChange(issue.id)}>
                      Update
                    </button>
                  </div>
                )}
                {issue.status.is_terminal && (
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(issue.id)}
                  >
                    🗑️ Delete Report
                  </button>
                )}

                <button
                  className="history-toggle-btn"
                  onClick={() => toggleHistory(issue.id)}
                >
                  {openHistory[issue.id] ? "Hide History" : "View History"}
                </button>

                {openHistory[issue.id] && (
                  <div className="history-timeline">
                    {(historyMap[issue.id] || []).length === 0 ? (
                      <p className="issue-meta">No status changes yet.</p>
                    ) : (
                      historyMap[issue.id].map((h) => (
                        <div key={h.id} className="history-entry">
                          <strong>
                            {h.old_status?.name || "None"} → {h.new_status.name}
                          </strong>
                          <span className="issue-meta">
                            {" "}
                            by {h.changed_by?.username || "system"} on{" "}
                            {new Date(h.changed_at).toLocaleString()}
                          </span>
                          {h.note && <p className="history-note">"{h.note}"</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
