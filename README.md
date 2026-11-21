# ALERTIFY — A Multi-Hazard Web-Based Disaster Preparedness Assistant

*Be Aware. Be Prepared. Stay Safe.* — coverage: **Batangas City only**.

## Run it

```bash
pip install -r requirements.txt
python app.py              # http://127.0.0.1:5000
```

On first start the database is created and seeded at `instance/alertify.db`, and an administrator account is created:

* Email: `admin@alertify.local` (or `ALERTIFY_ADMIN_EMAIL`)
* Password: random, written to `instance/ADMIN_CREDENTIALS.txt` (or set `ALERTIFY_ADMIN_PASSWORD` before first run).
  Change it after logging in, then delete that file.

More admins: `flask --app app create-admin`, or promote a user under **Admin → User Management**.

## Configuration (environment variables)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLAlchemy URL. Default SQLite. MySQL: `mysql+pymysql://…`, PostgreSQL: `postgresql+psycopg://…` |
| `SECRET_KEY` | Session signing key (auto-generated into `instance/secret_key` if unset) |
| `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_SENDER` | SMTP for password-reset emails. Without it, reset links are printed to the server console. |
| `FLASK_DEBUG=1` | Debug mode (development only) |

For production, run behind a WSGI server over HTTPS (e.g. `waitress-serve --port 8000 app:app`). Browsers only allow geolocation on HTTPS or `localhost`.

## Structure

| File | Role |
|---|---|
| `app.py` | Routes, auth, JSON API, admin portal, CSRF, seeding |
| `models.py` | 9 tables: users, admin_accounts, disaster_categories, disaster_reports, report_history, evacuation_centers, emergency_contacts, disaster_instructions, notifications (+ notification_reads) |
| `engine.py` | Per-disaster questions, condition flags, severity scoring, instruction selection, nearest-center search |
| `seed_data.py` | Initial data: 80 Batangas City evacuation centers from `EVACUATION-CENTER-2-1.pdf`, contacts, guidance, 105 barangays |
| `templates/`, `static/` | Jinja pages, CSS, JS (Leaflet maps, Chart.js), offline service worker |
| `static/vendor/leaflet-1.9.4/` | Local copy of the Leaflet map library, so the map code loads without internet (map tiles still need a connection) |
| `data/` | The dataset as CSV, JSON and GeoJSON (evacuation centers on a map), see [data/README.md](data/README.md) |
| `export_data.py` | Regenerates `data/` from `seed_data.py`: `python export_data.py` |
| `start_alertify.bat` | Windows: double-click to start the app and open the browser |

## Data and safety notes

* **Evacuation centers:** only entries under *LGU: Batangas City* were imported, with names, locations, capacities and X/Y coordinates as given in the source. All are seeded as **pending verification**, hazard suitability is blank, and operational status is "unknown" until an administrator updates them.
* **Contacts:** seeded as **pending verification**. Admins confirm each number, then mark it verified.
* **Instructions:** seeded from recognized public guidance (NDRRMC/OCD, PAGASA, PHIVOLCS, BFP, Philippine Red Cross). The assessment engine reads them from the database, so admin edits apply to new reports immediately. Each report also stores a snapshot of what it showed.
* **Notifications:** admin-authored only, each with a required source. ALERTIFY does not generate real-time alerts.
* ALERTIFY supplements, but does not replace, official government emergency instructions and professional responders.
