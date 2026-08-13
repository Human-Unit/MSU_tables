# University Academic Records System

Desktop application for managing university academic records, built with Wails, Go, PostgreSQL, React, and TypeScript.

## Features

- Dashboard with academic record totals.
- CRUD modules for faculties, vocations, groups, auditoriums, students, teachers, subjects, disciplines, attendance, exams, zachet, and teacher workload execution.
- Dedicated journal views for attendance, academic performance, execution sheets, and weekly schedules.
- Recurring weekly timetable model based on weekday and pair number.
- Cascading academic filters for faculty, vocation, course, and group.
- RU/EN interface language switcher persisted in local storage.
- PostgreSQL schema bootstrap, migrations, seed data, and soft-delete support for active records.

## Tech Stack

- Go 1.25+
- Wails v2
- PostgreSQL
- GORM
- React 18
- TypeScript
- Vite
- Tailwind CSS-style components

## Prerequisites

- Go
- Node.js and npm
- Wails CLI
- Docker Desktop, for the local PostgreSQL database

Install the Wails CLI if it is not already available:

```powershell
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

## Configuration

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Default local database settings:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=
DB_NAME=university_records
DB_SSLMODE=disable
DB_TIMEZONE=Asia/Tashkent
SESSION_DURATION_HOURS=24
SEED_ADMIN_USER=admin
SEED_ADMIN_PASSWORD=admin123
LOG_LEVEL=info
```

## Run Locally

Start PostgreSQL:

```powershell
docker compose up -d db
```

Run the desktop app from the project root:

```powershell
wails dev
```

Wails installs frontend dependencies, starts the Vite dev server, compiles the Go backend, and launches the desktop shell.

You can also start through the helper script:

```powershell
.\dev.ps1
```

## Frontend Commands

Run the frontend dev server directly:

```powershell
npm run dev
```

Build the frontend:

```powershell
npm run build
```

Preview the production frontend build:

```powershell
npm run preview
```

The root `package.json` delegates these commands to the `frontend` workspace.

## Build Desktop App

Create a production desktop build:

```powershell
wails build
```

The Windows build output is written under `build/bin` by Wails.

## Database

Docker is used only for PostgreSQL:

```powershell
docker compose up -d db
```

The application runs migrations on startup through `internal/database/migrate.go`.

The schedule table uses a recurring weekly model: each lesson has `weekday` and `pair` fields instead of a concrete date. Attendance records are tied to a student, discipline, day, and pair, with statuses such as present, absent, late, and excused.

## Troubleshooting

If PostgreSQL authentication fails after changing credentials, reset the local database volume:

```powershell
docker compose down -v
docker compose up -d db
```

Then confirm `.env` matches `docker-compose.yml`. The local Docker setup uses trust authentication, so `DB_PASSWORD` can be empty.

If Wails cannot find frontend dependencies, install them manually:

```powershell
npm --prefix frontend install
```

If the Wails CLI is missing from the shell path, restart the terminal after installing it or add the Go binary directory to `PATH`.
