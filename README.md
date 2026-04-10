<p align="center">
  <h1 align="center">CampusConnect</h1>
  <p align="center"><em>Your campus. Your crew.</em></p>
  <p align="center">A trusted marketplace connecting students with skilled local service providers.</p>
</p>

---

## What is CampusConnect?

CampusConnect is a web application that bridges the gap between students on campus and nearby skilled artisans (plumbers, electricians, painters, carpenters, and more). Students can discover, book, chat with, and pay service providers — all in one place. Artisans gain a professional digital presence and a reliable pipeline of clients.

## Features

- **Discovery** — Browse and search artisans by service category, proximity, and rating
- **Profiles** — Verified artisan profiles with photos, bio, pricing, and reviews
- **Booking** — Request, track, and manage service bookings end-to-end
- **Real-Time Chat** — Communicate directly with artisans before and during bookings
- **Payments** — Secure in-app payments via Paystack
- **Reviews & Ratings** — Leave verified reviews after completed services
- **GPS-Based Location** — Accurate, automatic location detection for both users and artisans

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS + Custom Properties |
| Backend | Node.js + Express.js |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.io |
| Payments | Paystack |
| Storage | Cloudinary |
| Auth | JWT (access + refresh) + HttpOnly Cookies + bcrypt |

## Project Structure

```
campusconnect/
├── client/          # React frontend application
├── server/          # Node.js/Express API
├── docs/            # Project documentation
│   ├── MASTER_PLAN.md
│   ├── DESIGN_SYSTEM.md
│   ├── CONTRIBUTING.md
│   └── DB_SCHEMA.md
└── README.md
```

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

### Installation

```bash
# Clone repository
git clone https://github.com/Kaycee9/CampusConnect.git
cd campusconnect

# Setup server
cd server
npm install
cp .env.example .env
# Edit .env with your credentials

# Setup database
npx prisma migrate dev
npx prisma db seed

# Setup client
cd ../client
npm install
cp .env.example .env
```

### Running Locally

```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

## Authentication

CampusConnect supports **two parallel auth transports** — both work on every protected endpoint:

| Mode | How | Best for |
|---|---|---|
| **Cookie** | `accessToken` + `refreshToken` HttpOnly cookies set automatically on login | Browser SPA (default) |
| **Bearer** | `Authorization: Bearer <access_token>` header | API clients, mobile, Postman |

The middleware checks the `Authorization` header first; if absent it falls back to the `accessToken` cookie. The `refreshToken` cookie is path-scoped to `/api/v1/auth/refresh` only — it is never sent on any other request.

---

## Documentation

| Document | Description |
|---|---|
| [Master Plan](docs/MASTER_PLAN.md) | Full product vision, architecture, roadmap, and SRS |
| [Design System](docs/DESIGN_SYSTEM.md) | Color tokens, typography, spacing, component specs |
| [Contributing](docs/CONTRIBUTING.md) | Git workflow, commit conventions, PR process |

## Team

Built with care by the CampusConnect team — April 2026.

## License

MIT
