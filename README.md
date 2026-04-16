# CampusConnect

CampusConnect is a campus service marketplace that connects students with nearby artisans.

Tagline: Your campus. Your crew.

## Product Summary

Students can discover artisans, view profiles, and create service bookings.
Artisans can receive booking requests, negotiate price, and move jobs through status stages.

Current implemented core:
- Authentication and profile management
- Artisan discovery and public profile pages
- Booking lifecycle with status transitions
- Price negotiation with history in booking detail
- Messaging inbox, threads, unread counts, and live updates
- In-app notifications and booking event emails

Not yet implemented in API (returns 501):
- Payments routes
- Reviews routes

## Tech Stack

- Frontend: React 18, Vite, Vanilla CSS
- Backend: Node.js, Express, Prisma
- Database: PostgreSQL
- Auth: JWT access and refresh tokens, cookie and bearer support
- Media: Cloudinary

## Quick Start

Requirements:
- Node.js 18+
- npm 9+
- PostgreSQL

Run locally:

1. In server folder: install dependencies, configure env, generate Prisma client, start API.
2. In client folder: install dependencies and start Vite dev server.

Ports:
- API: http://localhost:5000
- Web: http://localhost:5173

## API Documentation

Concise product and endpoint reference:

- [docs/API.md](docs/API.md)

## Other Docs

- [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md)
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- [docs/AI_HANDOFF.md](docs/AI_HANDOFF.md)
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

## License

MIT
