import { useState, useEffect } from "react";
import api from "../api/axios";

export default function Profile() {
  const [form, setForm] = useState({
    phone: "",
    aadhaar_number: "",
    date_of_birth: "",
    address: "",
  });
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/profile/me/").then((res) => {
      const { username, email, ...rest } = res.data;
      setUsername(username);
      setEmail(email);
      setForm({
        phone: rest.phone || "",
        aadhaar_number: rest.aadhaar_number || "",
        date_of_birth: rest.date_of_birth || "",
        address: rest.address || "",
      });
      setLoading(false);
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.put("/profile/me/", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError("Could not save profile. Please check your inputs.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="page-container">
        <p>Loading profile...</p>
      </div>
    );

  return (
    <div className="page-container">
      <h2 className="page-title">My Profile</h2>
      <p className="page-subtitle">
        This information is used only for government verification purposes and
        is
        <strong> never shown publicly</strong> or attached to your reported
        issues.
      </p>

      <div className="privacy-note">
        🔒 Your Aadhaar and personal details are visible only to you and
        authorized government staff — never to the public or other citizens.
      </div>

      {saved && (
        <div className="success-banner">✅ Profile updated successfully.</div>
      )}
      {error && <p className="error">{error}</p>}

      <form className="report-form" onSubmit={handleSubmit}>
        <label className="field-label">Username</label>
        <input value={username} disabled />

        <label className="field-label">Email</label>
        <input value={email} disabled />

        <label className="field-label">Phone Number</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="+91 XXXXXXXXXX"
        />

        <label className="field-label">Aadhaar Number</label>
        <input
          name="aadhaar_number"
          value={form.aadhaar_number}
          onChange={handleChange}
          placeholder="12-digit Aadhaar number"
          maxLength={12}
        />

        <label className="field-label">Date of Birth</label>
        <input
          type="date"
          name="date_of_birth"
          value={form.date_of_birth || ""}
          onChange={handleChange}
        />

        <label className="field-label">Address</label>
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          rows={3}
          placeholder="Your residential address"
        />

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
