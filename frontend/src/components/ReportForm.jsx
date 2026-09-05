import { useState, useEffect } from "react";
import api from "../api/axios";

export default function ReportForm({ onCreated }) {
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load categories once when the form mounts, so the dropdown has options
  useEffect(() => {
    api.get("/categories/").then((res) => setCategories(res.data));
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
      },
      () => setError("Could not get your location — enter it manually"),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!categoryId || !latitude || !longitude) {
      setError("Category and location are required");
      return;
    }

    // Photo uploads need FormData, not a plain JS object —
    // this is what actually produces multipart/form-data under the hood
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category_id", categoryId);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);
    if (photo) {
      formData.append("photo", photo);
    }

    setSubmitting(true);
    try {
      await api.post("/issues/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Reset the form after a successful submit
      setTitle("");
      setDescription("");
      setCategoryId("");
      setLatitude("");
      setLongitude("");
      setPhoto(null);
      onCreated(); // tell the Dashboard to refresh the issue list
    } catch (err) {
      setError("Failed to submit issue. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      <h3>Report an Issue</h3>

      <input
        placeholder="Title (e.g. Pothole on Main St)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        placeholder="Describe the issue"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        required
      />

      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        required
      >
        <option value="">Select category</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <div className="location-row">
        <input
          placeholder="Latitude"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          required
        />
        <input
          placeholder="Longitude"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          required
        />
        <button type="button" onClick={useMyLocation} className="location-btn">
          📍 Use my location
        </button>
      </div>

      <label className="field-label">Photo Evidence</label>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => setPhoto(e.target.files[0])}
      />
      <p className="camera-hint">
        📷 On mobile, this opens your camera directly. On desktop, it opens your
        file browser.
      </p>

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Issue"}
      </button>
    </form>
  );
}
