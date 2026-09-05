# Civic Issue Tracker

A full-stack platform for citizens to report civic issues (potholes, broken streetlights, garbage, etc.) directly to local government, with role-based workflows for staff to triage and resolve them. Built as a complete backend + frontend engineering exercise, modeled on real-world civic tech and government reporting systems.

## Live Demo

> _Add your deployed link here once hosted (e.g. Render + Vercel)._

## Screenshots

> _Add screenshots here: Home page, Report form, Staff Dashboard, Map view, Admin Panel._

---

## Why This Project

Most "issue tracker" tutorials model status as a flat field with hardcoded choices. This project instead models the resolution workflow as a **data-driven state graph** (`Status.next_allowed_statuses`), meaning:

- An admin can reconfigure the workflow itself (e.g. add a "Rejected" state, or insert a new intermediate step) without a code deploy.
- Every transition is validated server-side against the graph — the API physically cannot let an issue skip from "Reported" straight to "Resolved" unless that edge exists in the data.
- Every transition is logged to an immutable `StatusHistory` table, giving a full audit trail per issue (who changed what, when, and why) — not just an overwritten field.

This tradeoff (data-driven workflow vs. hardcoded enum) is a genuine, debatable backend design decision, not a toy detail — see [Design Decisions](#key-design-decisions) below.

---

## Tech Stack

**Backend:** Python, Django, Django REST Framework, SimpleJWT (JWT auth), django-filter, SQLite (dev)
**Frontend:** React (Vite), React Router, Axios, Leaflet / react-leaflet
**Auth:** JWT (access + refresh tokens), role-based permissions (citizen / staff / admin)

---

## Features

### Citizens

- Register / login (JWT-based)
- Report an issue with title, description, category, live camera photo capture, and geolocation (browser GPS or manual entry)
- Track all reported issues and their status history
- Private profile with government-verification fields (Aadhaar, DOB, address) — never exposed in any public API response
- Public map view of all reported issues, color-coded by status

### Staff

- Dashboard listing all issues with **only the currently valid next statuses** offered per issue (server-computed from the workflow graph)
- Add a note on every status change (persisted to the audit trail)
- View full status-change history per issue
- Delete issues — but only once they've reached a terminal status (e.g. Resolved), enforced server-side

### Admin

- Full user management from the frontend (no need to touch Django admin day-to-day): change any user's role, suspend/ban (instantly invalidates their JWT via `is_active`), reactivate, or permanently delete an account
- All the above enforced with a self-protection guard (an admin can't demote/ban/delete their own account through the panel)

---

## Key Design Decisions

**1. Status as a data-driven graph, not an enum.**
`Status` is its own model with a `next_allowed_statuses` self-referential M2M field, encoding the workflow as data. Tradeoff: more complex than `choices=[...]`, but lets the workflow be reconfigured by admins and makes every transition auditable and enforceable at the API layer, not just in frontend logic.

**2. Geospatial "nearby" search without PostGIS.**
`/api/issues/nearby/` uses a two-phase filter: a cheap DB-level bounding-box pre-filter (`latitude__range`/`longitude__range`, index-friendly) followed by precise Haversine distance calculation in Python only on the surviving candidates. This avoids the setup overhead of PostGIS for a project at this scale, while documenting the exact point (city/country-scale data volume) where a real production system would need to migrate to spatial indexing.

**3. Read/write serializer asymmetry.**
`IssueSerializer` returns full nested `category`/`status` objects on read, but only accepts a `category_id` on write — avoiding extra round-trip API calls on the frontend while keeping writes simple and validated.

**4. Ban vs. Delete.**
Suspending a user sets `is_active=False` — Django's own auth system and SimpleJWT both check this on every request, so a banned user's existing token stops working immediately, not just on their next login attempt. Deleting a user is a separate, explicitly destructive action (cascades to their reported issues) and is guarded with confirmation + a warning about data loss.

**5. Role-based permissions at the action level, not the endpoint level.**
`IssueViewSet` uses one permission class for standard CRUD but overrides it per-action (`change_status`, `destroy`) via DRF's `get_permissions()` — a single ViewSet can have different access rules for different verbs on the same resource.

---

## Project Structure

civic-issue-tracker/
├── backend/
│ ├── config/ # Django project settings, root URLs
│ └── issues/ # Main app: models, views, serializers, permissions
└── frontend/
└── src/
├── api/ # Axios instance with JWT interceptor
├── context/ # AuthContext (login/register/logout, role)
├── components/ # Navbar, route guards, reusable UI
└── pages/ # Home, Login, Register, ReportIssue, HistoryReports,

# Profile, StaffDashboard, AdminPanel, MapView

---

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt   # see note below
```

> If you don't have a `requirements.txt` yet, generate one with:
>
> ```bash
> pip freeze > requirements.txt
> ```

Create a `.env` file in `backend/`:
SECRET_KEY=your-django-secret-key
DEBUG=True

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### First-time data setup

1. Go to `http://127.0.0.1:8000/admin/`, log in with your superuser
2. Create a few `Category` entries (e.g. Pothole, Streetlight, Garbage)
3. Create `Status` entries in order (e.g. Reported → Acknowledged → In Progress → Resolved), and link each one's `next_allowed_statuses` to define the workflow
4. Register a normal user through the frontend — this becomes your first citizen account
5. In `/admin/`, set your own user's role to `admin` on their `Profile` to unlock the Admin Panel and Staff Dashboard from the frontend

---

## API Overview

| Endpoint                                   | Method        | Access                           |
| ------------------------------------------ | ------------- | -------------------------------- |
| `/api/register/`                           | POST          | Public                           |
| `/api/token/`                              | POST          | Public                           |
| `/api/issues/`                             | GET, POST     | Public read, authenticated write |
| `/api/issues/{id}/change-status/`          | POST          | Staff/Admin                      |
| `/api/issues/{id}/history/`                | GET           | Public                           |
| `/api/issues/{id}/allowed-transitions/`    | GET           | Staff/Admin                      |
| `/api/issues/nearby/?lat=&lng=&radius_km=` | GET           | Public                           |
| `/api/profile/me/`                         | GET, PUT      | Owner only                       |
| `/api/admin/users/`                        | GET           | Admin only                       |
| `/api/admin/users/{id}/`                   | PATCH, DELETE | Admin only                       |

---

## Security Notes

- Passwords hashed via Django's `create_user` (never stored in plain text)
- Aadhaar/DOB/address fields never appear in any public-facing serializer — only `ProfileSerializer`, accessible solely to the profile's own owner
- JWT access tokens expire in 30 minutes; refresh tokens rotate on use
- All destructive actions (delete issue, delete user, ban) are enforced server-side, not just hidden in the UI

---

## Author

Built by **Jewel Hossain**.
