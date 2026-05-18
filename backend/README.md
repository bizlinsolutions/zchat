# Backend (Node/Express)

Run locally:

```bash
cd backend
npm install
npm start
```

API endpoints:

- `GET /api/messages` — list messages
- `POST /api/messages` — send message, body `{ text, sender? }`

Realtime: Socket.IO server on the same port (emits `message` events).

Example: http://localhost:4000/api/hello

Database (PostgreSQL)

The backend supports PostgreSQL. By default it connects to the `DATABASE_URL` env var or `postgresql://postgres:postgres@localhost:5432/bizchat`.

Quick start with Docker Compose:

```bash
docker compose up -d
```

This starts a Postgres instance on port 5432. Then run the backend as usual and it will auto-create the `messages` table.

WhatsApp integration

Set these environment variables for WhatsApp Cloud API integration:

- `WHATSAPP_PHONE_NUMBER_ID` — your phone number ID from the Meta App Dashboard
- `WHATSAPP_TOKEN` — system user permanent access token (keep secret)
- `WHATSAPP_VERIFY_TOKEN` — a token you set to verify webhook subscription
- `WHATSAPP_API_VERSION` — optional, defaults to `v15.0`

Endpoints:

- `GET /webhook` — verification endpoint used when subscribing to webhooks (uses `WHATSAPP_VERIFY_TOKEN`).
- `POST /webhook` — receives webhook events (incoming messages and statuses).
- `POST /api/send` — send a text message via WhatsApp Cloud API. Body: `{ "to": "<whatsapp_number>", "text": "Hello" }`.
 - `POST /api/send` — send a text message via WhatsApp Cloud API. Body: `{ "to": "<whatsapp_number>", "text": "Hello" }`.
 - `POST /api/sendMedia` — send media by URL. Body: `{ "to": "<whatsapp_number>", "mediaUrl": "https://...", "mediaType": "image|audio|video|document" }`.
 - `POST /api/sendTemplate` — send a template message. Body: `{ "to": "<whatsapp_number>", "templateName": "template_name", "language": "en_US", "components": [...] }`.

The backend persists incoming messages to the `messages` table and emits realtime `message` events via Socket.IO.

Security
- Webhook requests are verified using `X-Hub-Signature-256` when `WHATSAPP_APP_SECRET` is set.

