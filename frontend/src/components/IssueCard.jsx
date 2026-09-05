export default function IssueCard({ issue }) {
  return (
    <div className="issue-card">
      {issue.photo && (
        <img src={issue.photo} alt={issue.title} className="issue-photo" />
      )}
      <div className="issue-body">
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
          {" · "}
          Reported by {issue.reported_by.username}
        </p>
      </div>
    </div>
  );
}
