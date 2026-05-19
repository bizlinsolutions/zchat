# Bizlin Chat - WhatsApp Cloud API Team Inbox

Open-source WhatsApp Cloud API Team Inbox with Express.js, Next.js, and TypeScript.

## Global Install

```bash
npm install -g bizlin-chat
```

## Usage

```bash
bizlin-chat start                   # Start application (ports 4000-4001)
bizlin-chat stop                    # Stop application
bizlin-chat restart                 # Restart application
bizlin-chat logs                    # View logs

# Options
bizlin-chat start --port 5000       # Custom port
bizlin-chat start --db postgres     # Use PostgreSQL
```

Access at: http://localhost:4001

## Environment Setup

Create `.env` file (optional):

```env
PORT=4000
DB_CLIENT=sqlite
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

## License

MIT
