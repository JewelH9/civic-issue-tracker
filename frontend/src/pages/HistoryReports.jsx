import { useState, useEffect } from "react";
import api from "../api/axios";
import IssueCard from "../components/IssueCard";

export default function HistoryReports() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/issues/")
      .then((res) => setIssues(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <h2 className="page-title">Reported Issues</h2>
      <p className="page-subtitle">
        Track the status of civic issues reported by citizens.
      </p>

      {loading ? (
        <p>Loading issues...</p>
      ) : issues.length === 0 ? (
        <p>No issues reported yet.</p>
      ) : (
        <div className="issue-list">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
