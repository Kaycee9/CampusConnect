# CampusConnect — AI Continuation Handoff
> **Last Updated:** April 11, 2026 (Stage 4 update)  
> **Purpose:** Enable any AI system to seamlessly continue development from the current state.

---

## 1. Project Overview

**CampusConnect** is a campus-based service marketplace connecting students who need skilled services (plumbing, electrical, painting, etc.) with nearby verified artisans. Think "Uber for campus repairs."

- **Tech Stack:** React 18 (Vite) frontend + Express 5 (Node 22) backend + PostgreSQL (Prisma ORM)
- **Design:** Purple & Black premium aesthetic (`#7C3AED` primary, Zinc neutrals)
- **Auth:** Dual-mode JWT (Bearer header for API/mobile + HttpOnly cookies for web SPA)
- **Repo:** Monorepo — `client/` (React) and `server/` (Express) at the root

---

## 2. What Has Been Completed

### Stage 0: Project Setup ✅
- Full monorepo initialized with all dependencies
- Prisma schema with 10 models and 4 enums
- Express app factory with CORS, Helmet, cookie-parser, rate limiting
- Axios API client with 401 silent refresh interceptor
- Socket.io wired (handlers pending Stage 5)

### Stage 1: Design System & UI Foundations ✅
- CSS design tokens in `client/src/styles/tokens.css` (colors, typography, spacing, shadows)
- UI component library: `Button`, `Input`, `Badge`, `Card`, `Modal`, `Avatar`, `Toast`, `Spinner`, `StarRating`
- Responsive layout system: `Navbar`, `Sidebar`, `BottomNav`, `DashboardLayout`
- Landing page with hero, features grid, CTA sections
- Auth pages: multi-step Register (Student/Artisan), Login

### Stage 2: Authentication & User Management ✅
- **Backend:** `auth.controller.js` — register, login, refresh (token rotation), logout, getMe
- **Backend:** forgot-password and reset-password flows
- **Backend:** `jwt.js` — dual-token generation (15m access / 7d refresh), HttpOnly cookie management
- **Backend:** `auth.routes.js` — Zod validation schemas for register/login
- **Backend:** Prisma transactions for atomic User + Profile creation
- **Backend:** `user.controller.js` — profile update with Cloudinary avatar streaming and GPS persistence
- **Backend:** `user.routes.js` — PUT /profile with multer + Zod validation
- **Frontend:** `AuthContext.jsx` — global user state, login/register/logout methods
- **Frontend:** `ProtectedRoute.jsx` — route guard with role-based access
- **Frontend:** Login/Register forms wired to real API endpoints
- **Frontend:** Profile page (`/profile`) — edit personal info, upload avatar, update GPS (students + artisans)

### Code Audit ✅ (8 bugs fixed)
- Prisma schema field names aligned with controller code (`passwordHash`, not `password`)
- Profile models receive required `firstName`/`lastName` on creation
- CommonJS import patterns fixed for Prisma and Cloudinary SDKs
- User controller correctly updates Profile models (not User model) for name fields
- Navbar avatar reads from correct profile sub-object path
- Stale props and debug comments cleaned up
- Logout now clears auth cookies explicitly and invalidates refresh tokens server-side
- Student browse access is enforced at the route layer; artisans are redirected away from `/browse`

### Stage 4: Booking System ✅
- **Backend:** `booking.controller.js` + `booking.routes.js` now support booking request, list, detail, accept/reject/start/complete/cancel, and `PATCH /:id/price` counter-offers
- **Backend:** in-app notifications + transactional emails on booking status changes and price offers
- **Backend:** negotiation history timeline derived from booking negotiation notifications and returned on booking detail API
- **Frontend:** booking request flow from artisan profile CTA to `/bookings/new`
- **Frontend:** role-aware booking dashboards for students and artisans (`/bookings`)
- **Frontend:** booking detail page with status actions, counter-offers, and negotiation history timeline (`/bookings/:id`)
- **UI/UX:** booking copy polish and typography alignment with the purple tokenized design system

### Stage 5: Real-Time Messaging ✅
- **Backend:** `message.controller.js` + `message.routes.js` provide conversations, thread loading, send message, and mark-as-read flows
- **Backend:** Socket.io authenticates with the access token and broadcasts new messages to participant rooms
- **Backend:** new messages create notification records so unread surfaces can be extended later
- **Frontend:** messaging inbox and thread UI at `/messages` and `/messages/:id`
- **Frontend:** unread counts are surfaced in the inbox list
- **Frontend:** booking detail now links directly into a participant conversation

---

## 3. Current State — What Works Right Now

| Feature | Status | URL |
|---------|--------|-----|
| Landing page | ✅ Working | `http://localhost:5173/` |
| Registration (Student + Artisan) | ✅ Working | `http://localhost:5173/register` |
| Login | ✅ Working | `http://localhost:5173/login` |
| Forgot password | ✅ Working | `http://localhost:5173/forgot-password` |
| Dashboard (placeholder) | ✅ Working | `http://localhost:5173/dashboard` |
| Browse artisans | ✅ Working | `http://localhost:5173/browse` |
| Artisan public profile | ✅ Working | `http://localhost:5173/artisan/:id` |
| Booking request form | ✅ Working | `http://localhost:5173/bookings/new?artisanId=:id` |
| Bookings dashboard | ✅ Working | `http://localhost:5173/bookings` |
| Booking detail + negotiation history | ✅ Working | `http://localhost:5173/bookings/:id` |
| Profile edit + avatar upload | ✅ Working | `http://localhost:5173/profile` |
| API health check | ✅ Working | `http://localhost:5000/api/v1/health` |

**To run locally:**
```bash
# Terminal 1 — Backend
cd server
cp .env.example .env  # Fill in DATABASE_URL, JWT secrets, Cloudinary keys
npx prisma generate
npx prisma db push    # or: npx prisma migrate dev
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

---

## 4. Stage 3: Discovery & Artisan Listings

This stage is complete and now serves as a foundation for Stage 4 booking flows.

### 4.1 Completed Backend Work

#### `server/src/controllers/artisan.controller.js`
- **`listArtisans`** — Paginated query of `ArtisanProfile` with filters:
  - `category` (enum filter)
  - `minRating` (WHERE averageRating >= value)
  - `maxPrice` (WHERE startingPrice <= value)
  - `search` (text search on firstName, lastName, bio)
  - `isAvailable` (boolean filter, default true)
  - `sortBy` (rating, price, distance)
  - Pagination: `page` + `limit` (default 12 per page)
- **`getArtisan`** — Single artisan by ID, including reviews with student names
- Include computed fields: `averageRating`, `totalReviews`, `totalJobs`

#### `server/src/routes/artisan.routes.js`
- `GET /api/v1/artisans` — public, calls `listArtisans`
- `GET /api/v1/artisans/:id` — public, calls `getArtisan`
- Add Zod validation for query parameters

### 4.2 Completed Frontend Work

#### `client/src/pages/dashboard/Browse.jsx`
- Grid layout displaying `ArtisanCard` components
- Filter controls: category pills/dropdown, price range, rating minimum
- Search input with debounced querying
- Pagination or infinite scroll
- Empty state when no artisans match
- Wired to the `/browse` route in `App.jsx`
- Student-only access enforced at the route level; artisans are redirected away

#### `client/src/components/artisan/ArtisanCard.jsx`
- Display: avatar, name, category badge, rating stars, starting price, availability dot
- Click navigates to `/artisan/:id`

#### `client/src/pages/artisan/ArtisanPublicProfile.jsx`
- Full read-only view of an artisan
- Sections: Header with avatar + stats, Bio, Services, Reviews list, "Book Now" CTA button
- Added route: `/artisan/:id` (public, no auth required)

#### Additional Stage 3 behavior now shipped
- GPS capture on signup and profile update
- Distance sorting uses browser geolocation plus artisan profile coordinates
- No map view is implemented, by explicit scope decision

### 4.3 Stage 3 Design Guidelines
- Use the existing design tokens from `tokens.css`
- Primary purple `#7C3AED` for CTAs and accents
- Zinc neutrals for text hierarchy (950 for headings, 700 for body, 400 for muted)
- Light background `#FAFAFA` with white `#FFFFFF` cards
- Consistent `var(--radius-lg)` for card borders, `var(--shadow-sm)` for subtle elevation
- Responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile

---

## 5. Critical Architecture Knowledge

### 5.1 Prisma Schema — Key Facts
- **File:** `server/prisma/schema.prisma`
- **Prisma Version:** 5.x (downgraded from 7.x due to breaking changes with `url` in datasource)
- The `User` model does NOT have `firstName`/`lastName` — those live on `StudentProfile` and `ArtisanProfile`
- The `User` model has `passwordHash` (not `password`)
- `RefreshToken` model tracks active sessions for server-side invalidation
- The `ArtisanProfile` has computed aggregates: `averageRating`, `totalReviews`, `totalJobs`

### 5.2 Express 5 Gotchas
- **Wildcard routes:** Express 5 uses `path-to-regexp` v8 which does NOT support `*` or `(.*)`. Use `router.use(handler)` for catch-all patterns.
- **CommonJS imports:** Node 22 ESM mode with `"type": "module"` does NOT support named imports from CJS packages. Use:
  ```js
  import pkg from 'some-cjs-package';
  const { NamedExport } = pkg;
  ```
  This was needed for: `@prisma/client`, `cloudinary`

### 5.3 Authentication Flow
```
Register/Login → Backend creates User + Profile (transaction)
                → Generates accessToken (15m) + refreshToken (7d)
                → Sets HttpOnly cookies + returns accessToken in body
                → Frontend stores accessToken in localStorage
                → Axios interceptor attaches Bearer header on every request
                → On 401 TOKEN_EXPIRED → interceptor calls /auth/refresh
                → New tokens rotated (old refresh deleted, new created)
```

### 5.4 Frontend State Architecture
- **AuthContext** (`contexts/AuthContext.jsx`) — holds `user` object globally
  - `user.role` → `'STUDENT'` or `'ARTISAN'`
  - `user.studentProfile` or `user.artisanProfile` → contains `firstName`, `lastName`, `avatarUrl`, etc.
  - Does NOT expose `setUser` — to update after profile changes, call `window.location.reload()` or re-fetch `/auth/me`
- **ProtectedRoute** wraps all `/dashboard/*` routes; redirects to `/login` if unauthenticated
- **Navbar**, **Sidebar**, **BottomNav** all consume `useAuth()` directly (no props drilling)

### 5.5 Route & Access Notes
- `/browse` is student-only and redirects artisans away from the page
- `/artisan/:id` is publicly readable, but the signed-in shell is preserved for authenticated users
- Logout clears both auth cookies and invalidates the refresh token server-side
- GPS coordinates are stored on both student and artisan profile records

### 5.6 File Upload Pipeline
```
Frontend (FormData) → multer (memory buffer, 2MB limit, JPEG/PNG/WebP only)
                    → Cloudinary upload_stream (server/src/controllers/user.controller.js)
                    → Returns secure_url → saved to profile.avatarUrl
```

---

## 6. Project File Map

```
CampusConnect/
├── client/
│   ├── src/
│   │   ├── App.jsx                          # Router + route mapping
│   │   ├── main.jsx                         # React entry (BrowserRouter + QueryClient)
│   │   ├── styles/
│   │   │   ├── tokens.css                   # Design tokens (colors, typography, spacing)
│   │   │   └── global.css                   # Reset, utilities, animations
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx              # Global auth state (user, login, register, logout)
│   │   ├── lib/
│   │   │   └── api.js                       # Axios instance with interceptor
│   │   ├── components/
│   │   │   ├── ui/                          # Button, Input, Badge, Card, Modal, Avatar, Toast, Spinner, StarRating
│   │   │   └── layout/                      # Navbar, Sidebar, BottomNav, DashboardLayout, ProtectedRoute
│   │   └── pages/
│   │       ├── Landing.jsx + Landing.css     # Public landing page
│   │       ├── auth/
│   │       │   ├── Login.jsx                # Login form (wired to AuthContext)
│   │       │   ├── Register.jsx             # Multi-step register (wired to AuthContext)
│   │       │   ├── ForgotPassword.jsx      # Password reset request screen
│   │       │   └── Auth.css                 # Shared auth page styles
│   │       ├── artisan/
│   │       │   └── ArtisanPublicProfile.jsx # Public artisan detail page
│   │       ├── dashboard/
│   │       │   └── Profile.jsx + Profile.css # Profile edit page (both roles)
│   │       ├── student/
│   │       │   └── Browse.jsx + Browse.css   # Student-only browse page
│   │       └── bookings/
│   │           ├── BookingRequest.jsx        # Student booking request form
│   │           ├── Bookings.jsx              # Student/artisan bookings dashboard
│   │           ├── BookingDetail.jsx         # Booking detail + status + negotiation timeline
│   │           └── Bookings.css              # Shared booking page styles
│   └── package.json
│
├── server/
│   ├── server.js                            # HTTP server + Socket.io bootstrap
│   ├── src/
│   │   ├── app.js                           # Express factory (middleware + routes)
│   │   ├── config/
│   │   │   ├── env.js                       # Centralized env vars
│   │   │   ├── database.js                  # Prisma client singleton
│   │   │   └── cloudinary.js                # Cloudinary v2 SDK init
│   │   ├── lib/
│   │   │   └── jwt.js                       # Token generation + cookie helpers
│   │   ├── middleware/
│   │   │   ├── auth.js                      # authenticate + authorize middleware
│   │   │   ├── validate.js                  # Zod validation factory
│   │   │   └── upload.js                    # Multer memory storage config
│   │   ├── controllers/
│   │   │   ├── auth.controller.js           # register, login, refresh, logout, getMe
│   │   │   └── user.controller.js           # updateProfile (with Cloudinary upload)
│   │   └── routes/
│   │       ├── auth.routes.js               # POST register/login/refresh/logout, GET /me
│   │       ├── user.routes.js               # PUT /profile (auth + multer + zod)
│   │       ├── artisan.routes.js            # GET list/profile (Stage 3 complete)
│   │       ├── booking.routes.js            # Booking lifecycle + negotiation endpoints
│   │       ├── message.routes.js            # Conversation, chat, read-state, finalize endpoints
│   │       ├── payment.routes.js            # STUB — Stage 6
│   │       └── review.routes.js             # STUB — Stage 7
│   ├── prisma/
│   │   └── schema.prisma                    # 10 models, 4 enums
│   └── package.json
│
└── docs/
    ├── MASTER_PLAN.md                       # Comprehensive product + technical plan
    ├── AI_HANDOFF.md                        # This document
    └── CONTRIBUTING.md                      # Git workflow + code standards
```

---

## 7. Remaining Stages Overview

| Stage | Name | Key Deliverables | Est. |
|-------|------|-----------------|------|
| **3** | **Discovery & Artisan Listings** | Artisan API, Browse grid, Search/Filter, Public profile | Completed |
| **4** | **Booking System** | Booking CRUD/state machine, notification + email triggers, role-aware dashboards, detail + negotiation history | Completed |
| **5** | **Real-Time Messaging** | Socket.io chat, conversation list, unread badges | Completed |
| 6 | Payments | Paystack integration, webhook, earnings dashboard | 2–3 days |
| 7 | Reviews & Ratings | Post-completion reviews, artisan rating aggregation | 1–2 days |
| 8 | Polish & Deployment | Testing, a11y, performance, Vercel/Railway deploy | 3–5 days |

---

## 8. Environment Variables Required

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/campusconnect
JWT_ACCESS_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<different-random-64-char-string>
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

---

## 9. Design Preferences (User's Explicit Requests)

1. **Color scheme:** Vibrant purple (`#7C3AED`) as primary + deep black/zinc neutrals. NO blue.
2. **Background:** Light-themed (`#FAFAFA` page bg, `#FFFFFF` cards) — NOT dark mode.
3. **Typography:** High-contrast black text on light backgrounds. Use `var(--color-neutral-900)` / `var(--color-neutral-950)` for headings.
4. **Black accents:** Use `var(--color-neutral-900)` / `var(--color-neutral-950)` creatively for hero panels, CTA sections, and badges — brutalist-inspired contrasts.
5. **Premium feel:** No generic designs. Use smooth gradients, micro-animations, hover transitions. The user explicitly said: *"make a design that feels premium and state of the art."*
6. **Fonts:** Plus Jakarta Sans (headings) + Inter (body) from Google Fonts.

---

## 10. Key Commands Reference

```bash
# Client
cd client && npm run dev          # Dev server on :5173
cd client && npx vite build       # Production build check

# Server
cd server && npm run dev          # Dev server with --watch on :5000
cd server && npx prisma generate  # Regenerate Prisma client after schema changes
cd server && npx prisma db push   # Push schema to DB (dev)
cd server && npx prisma studio    # Visual DB browser
```

---

*This document is designed to be self-contained. An AI system reading this file + the MASTER_PLAN.md + the Prisma schema should have everything needed to continue building CampusConnect from Stage 5 onward.*
