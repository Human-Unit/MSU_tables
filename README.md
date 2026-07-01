# University Academic Records System

A Wails desktop application for managing university academic records.

## Stack

- Go 1.25+
- Wails v2 desktop shell
- PostgreSQL + GORM
- React + TypeScript
- TailwindCSS-style UI components

## Implemented

- Database bootstrap and migrations
- Schema-aligned models for faculties, vocations, groups, students, teachers, schedules, attendance, performance, and execution
- Generic CRUD flow for the simple modules
- Dedicated student and teacher CRUD flows
- React dashboard shell, sidebar navigation, searchable tables, pagination, and modal forms
- Weekly timetable view (recurring by weekday, Mon–Sat) with cascading filters: faculty → vocation → course → group
- RU/EN language switcher (persisted to localStorage)

## Schedule model note

The schedule is a **recurring weekly timetable**: each entry has a `weekday`
(1=Monday … 6=Saturday) and a `pair`, instead of a concrete calendar date. The
legacy `day` column is dropped automatically on startup (see
`internal/database/migrate.go`). Add/edit lessons via the **Schedule** module in
the sidebar; view the grid via **Weekly Schedule**. A small demo dataset is
seeded on first run so the grid is populated immediately.

## Run

1. Copy `.env.example` to `.env` if you want to tweak local settings. The app reads `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_SSLMODE` for Postgres connection settings.
2. Start PostgreSQL with Docker:

   ```bash
   docker compose up -d db
   ```

3. If you want to build the frontend separately from the root, you can now run:

   ```bash
   npm install
   npm run build
   ```

4. Run the Wails app from the project root:

   ```bash
   wails dev
   ```

   This will automatically install frontend dependencies, build the frontend, compile the Go backend, and launch the desktop app.

   If you are already inside `frontend/`, run:

   ```powershell
   ..\dev.ps1
   ```

### Troubleshooting

- If you see a SASL auth/login failed error, the container volume has stale credentials. Fully reset the DB before retrying:
   - `docker compose down -v`
   - `docker compose up -d db`
- Verify `.env` DB credentials match `docker-compose.yml`. Defaults: `postgres` / `postgres` on `127.0.0.1:5433`.
- Local Docker uses trust auth, so `DB_PASSWORD` can be left blank.

## Docker Setup

Docker is used for PostgreSQL only.

- App runtime: local Wails desktop app
- Database: `docker compose up -d db`
- Connection string: built from the `DB_*` values in `.env`
- If you previously started Postgres with a different password, this repo now uses a fresh volume (`university_records_data_v2`) so the local database reinitializes cleanly.
