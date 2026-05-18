# bizlin-chat (zchat plugin)

This repository provides the bizlin-chat platform — a WhatsApp team inbox with backend and frontend, plus a CLI to run the platform.

Features
- Backend: Express API, Socket.IO, message persistence (SQLite/Postgres), WhatsApp Cloud API integration, setup endpoints for admin and WhatsApp account.
- Frontend: Next.js app with message list, send text/media/template, setup wizard for initial admin and WhatsApp account.
- CLI: `bizlin-chat` command to run the platform, with background daemon support and log files.
- CI: GitHub Actions workflow for npm publishing with provenance.

Quick start (local, foreground)

1. Install dependencies:

```bash
cd backend
npm install
cd ../frontend
npm install
```

2. Run via CLI (foreground):

```bash
node ./bin/bizlin-chat.js --port 1994 --db sqlite --dbname bizlin_chat
```

This starts the backend on `--port` (default 1994) and the frontend (Next dev) on `port+1`.

Daemon mode (background)

- Start background: `bizlin-chat start --port 1994 --db sqlite --dbname bizlin_chat`
- Stop: `bizlin-chat stop`
- Restart: `bizlin-chat restart --port 1994`
- View logs (last ~200 lines): `bizlin-chat logs`

Logs are written to `logs/backend.log` and `logs/frontend.log` in the repository root when running in daemon mode.

Setup wizard

When you first open the frontend, if no admin exists, the app shows a setup wizard:
- Create admin (username/password)
- Configure WhatsApp Cloud API (phone_id, token, api_version)
- The frontend provides a "Test" button to validate WhatsApp credentials before saving.

Database

- Default: SQLite file `data/<dbname>.sqlite` (default dbname `bizlin_chat`).
- To use Postgres: `--db postgres --dbname my_db` and ensure `DATABASE_URL` is set or the default postgres URL is reachable.

API endpoints
- `GET /api/setup/status` — check if admin exists
- `POST /api/setup/create-admin` — create admin
- `POST /api/setup/test-whatsapp` — test WhatsApp credentials
- `POST /api/setup/whatsapp` — save WhatsApp account
- `GET /api/messages`, `POST /api/messages` — messages
- `POST /api/send`, `POST /api/sendMedia`, `POST /api/sendTemplate` — send via WhatsApp (uses saved account)

Notes
- Credentials are stored in the database; passwords are hashed.
- The CLI writes PID to `.bizlin-chat.pid` for background control.
