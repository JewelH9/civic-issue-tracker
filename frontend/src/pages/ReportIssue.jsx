import { useState } from "react";
import { Link } from "react-router-dom";
import ReportForm from "../components/ReportForm";

export default function ReportIssue() {
  const [success, setSuccess] = useState(false);

  const handleCreated = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <div className="page-container">
      <h2 className="page-title">Report a Civic Issue</h2>
      <p className="page-subtitle">
        Fill in the details below. Your report is sent directly to the concerned
        department.
      </p>

      {success && (
        <div className="success-banner">
          ✅ Issue reported successfully! Track its progress under{" "}
          <Link to="/history">History / Reports</Link>.
        </div>
      )}

      <ReportForm onCreated={handleCreated} />
    </div>
  );
}
