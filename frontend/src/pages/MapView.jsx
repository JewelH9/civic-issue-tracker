import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/axios";

const INDIA_CENTER = [20.5937, 78.9629];

export default function MapView() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/issues/")
      .then((res) => setIssues(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Center the map on the average location of all issues, or fall back
  // to India's center if there's no data yet. useMemo avoids recalculating
  // this on every render — only when the issues list actually changes.
  const center = useMemo(() => {
    if (issues.length === 0) return INDIA_CENTER;
    const avgLat =
      issues.reduce((sum, i) => sum + i.latitude, 0) / issues.length;
    const avgLng =
      issues.reduce((sum, i) => sum + i.longitude, 0) / issues.length;
    return [avgLat, avgLng];
  }, [issues]);

  const zoom = issues.length === 0 ? 5 : 13;

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div className="page-container map-page">
      <h2 className="page-title">Issue Map</h2>
      <p className="page-subtitle">
        All reported civic issues, color-coded by status. Click a pin for
        details.
      </p>

      <div className="map-legend">
        {/* Deduplicate statuses that actually appear in the current data,
            so the legend never shows a color no pin is using */}
        {[...new Map(issues.map((i) => [i.status.id, i.status])).values()].map(
          (s) => (
            <span key={s.id} className="legend-item">
              <span
                className="legend-dot"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </span>
          ),
        )}
      </div>

      <div className="map-wrapper">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {issues.map((issue) => (
            <CircleMarker
              key={issue.id}
              center={[issue.latitude, issue.longitude]}
              radius={9}
              pathOptions={{
                color: issue.status.color,
                fillColor: issue.status.color,
                fillOpacity: 0.8,
                weight: 2,
              }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{issue.title}</strong>
                  <p className="issue-category">{issue.category.name}</p>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: issue.status.color }}
                  >
                    {issue.status.name}
                  </span>
                  <p className="issue-description">{issue.description}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {issues.length === 0 && (
        <p className="issue-meta" style={{ marginTop: "12px" }}>
          No issues reported yet — the map will populate as reports come in.
        </p>
      )}
    </div>
  );
}
