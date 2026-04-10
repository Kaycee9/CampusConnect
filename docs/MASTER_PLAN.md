# CampusConnect — Master Plan
> **Version:** 1.0.0 | **Date:** April 2026 | **Status:** Active  
> *The single source of truth for product, design, engineering, and growth.*

---

## Table of Contents

1. [Product Vision & Mission](#1-product-vision--mission)
2. [Brand Identity](#2-brand-identity)
3. [Refined User Stories & Requirements](#3-refined-user-stories--requirements)
4. [Software Requirements Specification (SRS)](#4-software-requirements-specification-srs)
5. [Technical Architecture](#5-technical-architecture)
6. [Data Modeling & Database Schema](#6-data-modeling--database-schema)
7. [API Design](#7-api-design)
8. [UI/UX Design System](#8-uiux-design-system)
9. [Staged Implementation Roadmap](#9-staged-implementation-roadmap)
10. [Team Collaboration Guidelines](#10-team-collaboration-guidelines)

---

## 1. Product Vision & Mission

### Vision Statement
> **CampusConnect** is the trusted bridge between campus communities and local skilled service providers — making it effortless for students to find help and for artisans to build sustainable livelihoods.

### Mission Statement
> To simplify access to quality local services on campus by creating a transparent, trust-driven digital marketplace where students get verified help fast, and skilled artisans grow their businesses.

### Problem Statement
Students living on or near campuses regularly need skilled services — plumbing, electrical repairs, painting, carpentry, etc. — but face friction: no centralized directory, no verified provider profiles, no structured booking, and no safe payment channel. Artisans, on the other hand, struggle with inconsistent demand and limited visibility. CampusConnect solves both sides of this equation.

### Core Value Propositions
| For Students | For Artisans |
|---|---|
| Discover verified service providers nearby | Gain consistent, location-based visibility |
| Read real ratings and reviews | Build a credible professional profile |
| Book and pay safely in-app | Manage bookings with clear accept/reject flow |
| Communicate directly before committing | Receive structured payments |
| No need for word-of-mouth referrals | Grow reputation through reviews |

### Success Metrics (KPIs)
- **Activation Rate:** % of registered users who complete a first booking within 7 days
- **Match Rate:** % of search queries that result in a booking
- **Artisan Retention:** % artisans active after 30/60/90 days
- **Review Completion Rate:** % of completed bookings that receive a review
- **Average Rating Across Platform:** Target >= 4.2/5.0

---

## 2. Brand Identity

### Brand Personality
CampusConnect is:  
**Trustworthy · Approachable · Energetic · Local · Empowering**

The brand speaks like a smart, friendly campus mate — not a corporation. It removes the friction between "I need help" and "help is here."

### Brand Voice & Tone
| Context | Tone | Example |
|---|---|---|
| Onboarding | Warm, welcoming | "Let's get your profile set up. This takes 2 minutes." |
| Error states | Calm, reassuring | "Something went wrong, but we're on it. Try again." |
| Empty states | Encouraging | "No bookings yet — your first job is just a post away." |
| Confirmations | Confident, clear | "Booking confirmed! Kwame will arrive Friday at 10am." |
| CTAs | Action-forward | "Find a Plumber", "Hire Now", "Book Today" |

### Brand Name Rationale
**CampusConnect** — simple, geographic (campus), relational (connect), instantly communicates what the product does.

**Tagline:** *"Your campus. Your crew."*  
**Sub-tagline:** *"Trusted services, right where you are."*

### Color Palette

```
PRIMARY (Brand Blue — Trust + Technology)
  --color-primary-500: #2563EB   /* Vivid blue — CTAs, links, key actions */
  --color-primary-400: #3B82F6   /* Hover states */
  --color-primary-600: #1D4ED8   /* Active/pressed states */
  --color-primary-50:  #EFF6FF   /* Tinted backgrounds */

ACCENT (Amber — Energy + Opportunity)
  --color-accent-500:  #F59E0B   /* Stars, highlights, badges */
  --color-accent-400:  #FBBF24   /* Hover */
  --color-accent-50:   #FFFBEB   /* Tinted */

SUCCESS / AVAILABLE
  --color-success:     #10B981   /* Booking confirmed, online status */

ERROR / ALERT
  --color-error:       #EF4444   /* Validation errors, rejected bookings */

WARNING
  --color-warning:     #F97316   /* Pending states */

NEUTRALS (Background + Text)
  --color-neutral-900: #0F172A   /* Primary text */
  --color-neutral-700: #334155   /* Secondary text */
  --color-neutral-400: #94A3B8   /* Muted/placeholder */
  --color-neutral-100: #F1F5F9   /* Card backgrounds */
  --color-neutral-50:  #F8FAFC   /* Page backgrounds */
  --color-surface:     #FFFFFF   /* Cards, modals */
```

### Typography
```
FONT FAMILY
  Headings:  'Plus Jakarta Sans' (Google Fonts) — modern, geometric, authoritative
  Body:      'Inter' (Google Fonts) — highly legible, neutral, versatile

SCALE (rem)
  --text-xs:   0.75rem   /* 12px — labels, captions */
  --text-sm:   0.875rem  /* 14px — body small, table text */
  --text-base: 1rem      /* 16px — standard body */
  --text-lg:   1.125rem  /* 18px — lead text */
  --text-xl:   1.25rem   /* 20px — card titles */
  --text-2xl:  1.5rem    /* 24px — section headers */
  --text-3xl:  1.875rem  /* 30px — page titles */
  --text-4xl:  2.25rem   /* 36px — hero headlines */
  --text-5xl:  3rem      /* 48px — hero display */

WEIGHT
  Regular: 400, Medium: 500, Semibold: 600, Bold: 700, Extrabold: 800
```

### Logo Concept
The CampusConnect mark is a stylized interlocking "C·C" within a rounded square — suggesting connection, community, and campus. Primary in `#2563EB`. Works on both light and dark backgrounds.

### Iconography
- Library: **Lucide React** — clean, consistent, 24px grid
- Style: Outlined, 2px stroke, rounded ends
- Never mix icon styles

---

## 3. Refined User Stories & Requirements

### 3.1 Actor Definitions

| Actor | Definition |
|---|---|
| **Student** | A registered end-user who browses, books, and reviews artisan services |
| **Artisan** | A registered service provider who lists services, accepts bookings, and gets paid |
| **Admin** | Platform admin with elevated access (future scope) |
| **System** | Automated system processes (notifications, payment webhooks) |

### 3.2 Student (Consumer) User Stories

**Authentication & Onboarding**
- `S-01` As a student, I want to register with my name, email, and password so I can create a secure account.
- `S-02` As a student, I want to verify my email address to confirm account authenticity.
- `S-03` As a student, I want to log in and log out securely.
- `S-04` As a student, I want to reset my password if I forget it.

**Profile Management**
- `S-05` As a student, I want to view and update my profile (name, phone, profile photo, location).
- `S-06` As a student, I want to grant GPS location access for location-based discovery.

**Discovery & Search**
- `S-07` As a student, I want to browse a list of artisans sorted by proximity to my location.
- `S-08` As a student, I want to filter artisans by service category (e.g., plumber, electrician).
- `S-09` As a student, I want to search artisans by name or keyword.
- `S-10` As a student, I want to view an artisan's full profile including photo, bio, services, pricing, location, and reviews.
- `S-11` As a student, I want to see artisan availability/online status badges.

**Booking**
- `S-12` As a student, I want to send a booking request to an artisan with date, time, description, and address.
- `S-13` As a student, I want to see the real-time status of my bookings (pending, accepted, in-progress, completed, rejected, cancelled).
- `S-14` As a student, I want to cancel a pending booking.
- `S-15` As a student, I want to view my full bookings history.

**Communication**
- `S-16` As a student, I want to open a direct chat with an artisan to discuss details before booking.
- `S-17` As a student, I want to receive real-time message notifications.

**Payments**
- `S-18` As a student, I want to pay for a service through the app using a supported payment method.
- `S-19` As a student, I want to see a receipt/confirmation of my payment.

**Reviews & Ratings**
- `S-20` As a student, I want to leave a 1–5 star rating and a written review after a completed booking.
- `S-21` As a student, I want to view all reviews I have previously written.

---

### 3.3 Artisan (Provider) User Stories

**Authentication & Onboarding**
- `A-01` As an artisan, I want to register with my name, email, password, service category, location, bio, and pricing so I am discoverable.
- `A-02` As an artisan, I want to verify my email address.
- `A-03` As an artisan, I want to log in and log out securely.
- `A-04` As an artisan, I want to reset my password if I forget it.

**Profile Management**
- `A-05` As an artisan, I want to update my profile photo, bio, service category, location, pricing, and availability.
- `A-06` As an artisan, I want to toggle my availability status (available / busy).
- `A-07` As an artisan, I want my profile to display my average rating and total jobs completed.

**Booking Management**
- `A-08` As an artisan, I want to receive booking requests with all necessary details.
- `A-09` As an artisan, I want to accept or reject a booking request.
- `A-10` As an artisan, I want to mark a booking as in-progress when I begin work.
- `A-11` As an artisan, I want to mark a booking as completed when work is done.
- `A-12` As an artisan, I want to view my full bookings history and status.

**Communication**
- `A-13` As an artisan, I want to respond to student messages in real-time.
- `A-14` As an artisan, I want to receive notifications of new booking requests and messages.

**Payments**
- `A-15` As an artisan, I want to receive payment for completed services directly through the app.
- `A-16` As an artisan, I want to view my earnings history and payout status.

---

## 4. Software Requirements Specification (SRS)

### 4.1 Functional Requirements

#### FR-AUTH: Authentication & Authorization
| ID | Requirement |
|---|---|
| FR-AUTH-01 | System shall support JWT-based authentication with access and refresh token strategy |
| FR-AUTH-02 | System shall hash passwords using bcrypt before storage |
| FR-AUTH-03 | System shall send email verification on registration |
| FR-AUTH-04 | System shall support password reset via time-limited email token |
| FR-AUTH-05 | System shall enforce role-based access (student / artisan / admin) on all protected routes |
| FR-AUTH-06 | Refresh tokens shall be stored server-side and invalidated on logout |
| FR-AUTH-07 | System shall support dual-mode token transport: (a) HttpOnly `refreshToken` cookie + short-lived access token in response body, and (b) `Authorization: Bearer <token>` header — both accepted on all protected routes |
| FR-AUTH-08 | The `refreshToken` cookie shall be HttpOnly, Secure, SameSite=Strict, with path restricted to `/api/v1/auth/refresh` |
| FR-AUTH-09 | The auth middleware shall resolve the access token from the `Authorization` header first; falling back to a signed `accessToken` cookie if the header is absent |
| FR-AUTH-10 | Login response shall set the `refreshToken` as an HttpOnly cookie AND return the `accessToken` in the JSON body to support both browser and API clients |

#### FR-USER: User Management
| ID | Requirement |
|---|---|
| FR-USER-01 | System shall store separate profile types for students and artisans |
| FR-USER-02 | System shall accept GPS coordinates (lat/lng) for location and reverse-geocode to human-readable address |
| FR-USER-03 | System shall allow profile photo upload (max 5MB, JPEG/PNG/WEBP) |
| FR-USER-04 | System shall validate all user input server-side |

#### FR-DISCOVERY: Search & Discovery
| ID | Requirement |
|---|---|
| FR-DISC-01 | System shall return artisans ordered by distance from the requesting user's coordinates |
| FR-DISC-02 | System shall support filtering by service_category |
| FR-DISC-03 | System shall support full-text search across artisan name and bio |
| FR-DISC-04 | System shall support pagination (cursor-based) for artisan listings |

#### FR-BOOKING: Booking System
| ID | Requirement |
|---|---|
| FR-BOOK-01 | Bookings shall have states: PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED or REJECTED / CANCELLED |
| FR-BOOK-02 | Only artisans can ACCEPT, REJECT, or mark IN_PROGRESS / COMPLETED |
| FR-BOOK-03 | Only students can CANCEL a PENDING booking |
| FR-BOOK-04 | System shall send in-app and email notifications on booking state changes |
| FR-BOOK-05 | Bookings shall include: service address, scheduled date/time, service description, and agreed price |

#### FR-COMMS: Messaging
| ID | Requirement |
|---|---|
| FR-COMM-01 | System shall support real-time bi-directional messaging using WebSockets |
| FR-COMM-02 | Conversations shall be scoped to a student-artisan pair |
| FR-COMM-03 | Messages shall be persisted in the database |
| FR-COMM-04 | System shall support unread message counts per conversation |

#### FR-PAY: Payments
| ID | Requirement |
|---|---|
| FR-PAY-01 | System shall integrate Paystack as the primary payment gateway |
| FR-PAY-02 | Payments shall be initiated by students on booking confirmation |
| FR-PAY-03 | System shall verify payment via webhook before marking a booking as paid |
| FR-PAY-04 | Payment records shall be stored with reference, status, amount, and timestamps |
| FR-PAY-05 | Artisans shall receive earnings minus a platform fee (configurable, default 10%) |

#### FR-REVIEW: Reviews & Ratings
| ID | Requirement |
|---|---|
| FR-REV-01 | Reviews can only be submitted by students for COMPLETED bookings |
| FR-REV-02 | Only one review per booking is allowed |
| FR-REV-03 | Ratings must be integers from 1–5 |
| FR-REV-04 | Artisan average rating shall be auto-computed and stored on the artisan profile |

---

### 4.2 Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | API response time < 300ms for 95th percentile under normal load |
| **Scalability** | Architecture must support horizontal scaling of the API layer |
| **Security** | HTTPS enforced; no sensitive data in URLs; CORS configured; rate limiting on auth endpoints |
| **Availability** | Target 99.5% uptime |
| **Accessibility** | WCAG 2.1 AA compliance on all frontend screens |
| **Responsiveness** | Application must be fully functional on mobile (>= 320px) and desktop (>= 1440px) |
| **Compatibility** | Support latest 2 versions of Chrome, Firefox, Safari, Edge |

---

## 5. Technical Architecture

### 5.1 Chosen Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18 + Vite | Component-based, fast HMR, ecosystem maturity |
| **Styling** | Vanilla CSS + CSS Custom Properties | Full design control, no framework bloat |
| **State Management** | React Context + TanStack Query (React Query) | Server state handled by RQ; global UI state via Context |
| **Routing** | React Router v6 | Declarative routing, nested layouts |
| **Backend** | Node.js + Express.js | JS context continuity, fast API development |
| **Database** | PostgreSQL | Relational integrity for users, bookings, payments |
| **ORM** | Prisma | Type-safe schema, migrations, elegant queries |
| **Real-time** | Socket.io | WebSocket abstraction for chat + notifications |
| **Authentication** | JWT (access + refresh) + bcrypt + cookie-parser | Dual-mode: Bearer header for API clients; HttpOnly cookie for browser SPA. Refresh token always cookie-only (XSS-safe) |
| **Payment** | Paystack | Leading Nigerian/African payment gateway |
| **File Storage** | Cloudinary | Managed media with transforms |
| **Email** | Nodemailer + Gmail SMTP / Resend | Transactional email (verify, reset, notifications) |
| **Maps/Geo** | Browser Geolocation API + Mapbox / OpenStreetMap | GPS capture + map display |
| **Validation** | Zod (shared) | Schema validation on both FE and BE |
| **Testing** | Vitest (FE) + Jest + Supertest (BE) | Unit + integration tests |
| **API Docs** | Swagger / OpenAPI 3.0 | Auto-generated, living API docs |

---

### 5.2 System Architecture Diagram

```
+-------------------------------------------------------------+
|                        CLIENT LAYER                         |
|  +-----------------------------------------------------+    |
|  |           React 18 + Vite SPA                       |    |
|  |  +----------+ +----------+ +------------------+    |    |
|  |  |  Pages   | |Components| |  React Router v6  |    |    |
|  |  +----------+ +----------+ +------------------+    |    |
|  |  +------------------+  +-----------------------+   |    |
|  |  |  TanStack Query  |  |   Socket.io Client    |   |    |
|  |  +------------------+  +-----------------------+   |    |
|  +-----------------------------------------------------+    |
+------------------------------+------------------------------+
                               | HTTP / WebSocket
+------------------------------v------------------------------+
|                       API LAYER                             |
|  +-----------------------------------------------------+    |
|  |              Node.js + Express.js                   |    |
|  |  +------+ +------+ +-------+ +----------+          |    |
|  |  | Auth | | Users| |Booking| | Messages |          |    |
|  |  +------+ +------+ +-------+ +----------+          |    |
|  |  +------+ +------+ +-------------------------+     |    |
|  |  |Pay   | |Review| |   Socket.io Server      |     |    |
|  |  +------+ +------+ | (Chat + Notifications)  |     |    |
|  |                    +-------------------------+     |    |
|  |  [authMiddleware] [validate] [rateLimiter] [cors]  |    |
|  +-----------------------------------------------------+    |
+------------------------------+------------------------------+
                               | Prisma ORM
+------------------------------v------------------------------+
|                      DATA LAYER                             |
|  +--------------------+  +----------------------------+     |
|  |    PostgreSQL DB    |  |        Cloudinary          |     |
|  |  (Primary Store)   |  |    (Media / Images)        |     |
|  +--------------------+  +----------------------------+     |
+-------------------------------------------------------------+
                               |
+------------------------------v------------------------------+
|                   EXTERNAL SERVICES                         |
|  [Paystack] [Nodemailer/Resend] [Mapbox] [Cloudinary]       |
+-------------------------------------------------------------+
```

---

### 5.3 Repository Structure

```
campusconnect/
├── client/                          # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/                  # Static assets (logo, icons)
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ui/                  # Base: Button, Input, Modal, Badge...
│   │   │   ├── layout/              # Navbar, Sidebar, Footer
│   │   │   ├── artisan/             # ArtisanCard, ArtisanProfile...
│   │   │   ├── booking/             # BookingCard, BookingForm...
│   │   │   ├── chat/                # ChatWindow, MessageBubble...
│   │   │   └── review/              # ReviewCard, ReviewForm...
│   │   ├── pages/                   # Route-level page components
│   │   │   ├── auth/                # Login, Register, ForgotPassword
│   │   │   ├── student/             # Dashboard, Browse, Bookings, Profile
│   │   │   └── artisan/             # Dashboard, Bookings, Profile, Earnings
│   │   ├── context/                 # AuthContext, NotificationContext
│   │   ├── hooks/                   # Custom hooks (useAuth, useGeolocation...)
│   │   ├── lib/                     # api.js (axios instance), socket.js
│   │   ├── schemas/                 # Zod validation schemas (shared forms)
│   │   ├── styles/                  # tokens.css, global.css, components.css
│   │   └── utils/                   # formatters, helpers
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                          # Node.js/Express Backend
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   ├── migrations/
│   │   └── seed.js                  # Seed data
│   ├── src/
│   │   ├── config/                  # env, database, cloudinary, paystack
│   │   ├── controllers/             # Route handler logic
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── artisan.controller.js
│   │   │   ├── booking.controller.js
│   │   │   ├── message.controller.js
│   │   │   ├── payment.controller.js
│   │   │   └── review.controller.js
│   │   ├── middleware/              # auth, validate, upload, rateLimiter
│   │   ├── routes/                  # Express routers
│   │   ├── services/                # Business logic layer
│   │   ├── sockets/                 # Socket.io handlers
│   │   ├── utils/                   # email, tokens, geolocation helpers
│   │   └── app.js                   # Express application factory
│   ├── server.js                    # Entry point + Socket.io setup
│   └── package.json
│
├── docs/                            # Project documentation
│   ├── MASTER_PLAN.md               # <- This file
│   ├── API.md                       # API endpoint reference
│   ├── DESIGN_SYSTEM.md             # UI tokens, component specs
│   ├── DB_SCHEMA.md                 # Entity diagrams and field definitions
│   └── CONTRIBUTING.md              # Dev conventions & git workflow
│
├── .env.example                     # Environment variable template
├── .gitignore
└── README.md
```

---

## 6. Data Modeling & Database Schema

### 6.1 Entity Relationship Overview

```
User ──────────────── StudentProfile
 |                    (extends User)
 |
 └──── ArtisanProfile (extends User)
        |
        ├──── Booking ───── Payment
        |      |
        |      └──── Review
        |
        └──── Conversation ─── Message
              (User <-> Artisan)
```

### 6.2 Prisma Schema (Canonical Definition)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  STUDENT
  ARTISAN
  ADMIN
}

enum ServiceCategory {
  PLUMBING
  ELECTRICAL
  PAINTING
  CARPENTRY
  CLEANING
  TAILORING
  BARBING
  WELDING
  MECHANICS
  TECH_REPAIR
  OTHER
}

enum BookingStatus {
  PENDING
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  REJECTED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

model User {
  id               String   @id @default(cuid())
  email            String   @unique
  passwordHash     String
  role             Role
  isVerified       Boolean  @default(false)
  verifyToken      String?
  resetToken       String?
  resetTokenExpiry DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  studentProfile    StudentProfile?
  artisanProfile    ArtisanProfile?
  sentMessages      Message[]       @relation("SentMessages")
  conversations1    Conversation[]  @relation("User1Conversations")
  conversations2    Conversation[]  @relation("User2Conversations")
  bookingsAsStudent Booking[]       @relation("StudentBookings")
  notifications     Notification[]
}

model StudentProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  firstName String
  lastName  String
  phone     String?
  avatarUrl String?
  lat       Float?
  lng       Float?
  address   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  reviews   Review[]
}

model ArtisanProfile {
  id            String          @id @default(cuid())
  userId        String          @unique
  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  firstName     String
  lastName      String
  phone         String?
  avatarUrl     String?
  bio           String?
  category      ServiceCategory
  lat           Float?
  lng           Float?
  address       String?
  startingPrice Float?
  yearsExp      Int?
  isAvailable   Boolean         @default(true)
  averageRating Float           @default(0)
  totalReviews  Int             @default(0)
  totalJobs     Int             @default(0)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  bookings      Booking[]       @relation("ArtisanBookings")
  reviews       Review[]
}

model Booking {
  id              String         @id @default(cuid())
  studentId       String
  student         User           @relation("StudentBookings", fields: [studentId], references: [id])
  artisanId       String
  artisan         ArtisanProfile @relation("ArtisanBookings", fields: [artisanId], references: [id])
  title           String
  description     String
  address         String
  lat             Float?
  lng             Float?
  scheduledAt     DateTime
  agreedPrice     Float?
  status          BookingStatus  @default(PENDING)
  rejectionReason String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  payment         Payment?
  review          Review?
}

model Payment {
  id           String        @id @default(cuid())
  bookingId    String        @unique
  booking      Booking       @relation(fields: [bookingId], references: [id])
  amount       Float
  platformFee  Float
  artisanAmount Float
  reference    String        @unique
  paystackRef  String?
  status       PaymentStatus @default(PENDING)
  paidAt       DateTime?
  createdAt    DateTime      @default(now())
}

model Review {
  id        String         @id @default(cuid())
  bookingId String         @unique
  booking   Booking        @relation(fields: [bookingId], references: [id])
  studentId String
  student   StudentProfile @relation(fields: [studentId], references: [id])
  artisanId String
  artisan   ArtisanProfile @relation(fields: [artisanId], references: [id])
  rating    Int
  comment   String?
  createdAt DateTime       @default(now())
}

model Conversation {
  id        String    @id @default(cuid())
  user1Id   String
  user1     User      @relation("User1Conversations", fields: [user1Id], references: [id])
  user2Id   String
  user2     User      @relation("User2Conversations", fields: [user2Id], references: [id])
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  messages  Message[]

  @@unique([user1Id, user2Id])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  senderId       String
  sender         User         @relation("SentMessages", fields: [senderId], references: [id])
  content        String
  isRead         Boolean      @default(false)
  createdAt      DateTime     @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  body      String
  type      String
  isRead    Boolean  @default(false)
  metadata  Json?
  createdAt DateTime @default(now())
}
```

---

## 7. API Design

### 7.1 Base URL
```
Development:  http://localhost:5000/api/v1
Production:   https://api.campusconnect.app/api/v1
```

### 7.2 Authentication

The API supports two parallel auth transports. Both are valid on every protected route:

#### Option A — Bearer Token (API clients, mobile, Postman)
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Option B — Cookie (Browser SPA — set automatically on login)
```
Cookie: accessToken=<signed_jwt>; refreshToken=<signed_jwt>
Content-Type: application/json
```

#### Token Resolution Order (middleware)
```
1. Check Authorization header → extract Bearer token
2. If absent, check accessToken cookie
3. If neither present → 401 Unauthorized
```

#### Cookie Attributes
| Cookie | HttpOnly | Secure | SameSite | Path |
|---|---|---|---|---|
| `accessToken` | Yes | Yes (prod) | Strict | `/api/v1` |
| `refreshToken` | Yes | Yes (prod) | Strict | `/api/v1/auth/refresh` |

> **Security note:** The `refreshToken` cookie path is scoped to `/api/v1/auth/refresh` only — it is never sent on any other request, preventing token leakage.

### 7.3 Endpoint Reference

#### Auth Routes — `/api/v1/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register a new user (student or artisan) |
| POST | `/login` | No | Login and receive token pair |
| POST | `/logout` | Yes | Revoke refresh token |
| POST | `/refresh` | No | Refresh access token using refresh token |
| GET | `/verify-email/:token` | No | Verify email from token link |
| POST | `/forgot-password` | No | Send password reset email |
| POST | `/reset-password/:token` | No | Set new password |

#### User Routes — `/api/v1/users`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/me` | Yes | Get own profile |
| PATCH | `/me` | Yes | Update own profile |
| PATCH | `/me/avatar` | Yes | Upload/update profile photo |
| PATCH | `/me/location` | Yes | Update GPS coordinates |

#### Artisan Routes — `/api/v1/artisans`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List artisans (with filters + geo sort) |
| GET | `/:id` | Yes | Get artisan public profile |
| GET | `/:id/reviews` | Yes | Get reviews for an artisan |
| PATCH | `/availability` | Yes (artisan) | Toggle availability |

#### Booking Routes — `/api/v1/bookings`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Yes (student) | Create a booking request |
| GET | `/` | Yes | Get own bookings (by role) |
| GET | `/:id` | Yes | Get specific booking details |
| PATCH | `/:id/accept` | Yes (artisan) | Accept a booking |
| PATCH | `/:id/reject` | Yes (artisan) | Reject with reason |
| PATCH | `/:id/start` | Yes (artisan) | Mark as in-progress |
| PATCH | `/:id/complete` | Yes (artisan) | Mark as completed |
| PATCH | `/:id/cancel` | Yes (student) | Cancel a pending booking |

#### Message Routes — `/api/v1/messages`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/conversations` | Yes | List all conversations |
| GET | `/conversations/:id` | Yes | Get messages in a conversation |
| POST | `/conversations` | Yes | Start or get a conversation |
| POST | `/conversations/:id` | Yes | Send a message |
| PATCH | `/conversations/:id/read` | Yes | Mark conversation as read |

#### Payment Routes — `/api/v1/payments`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/initialize` | Yes (student) | Initialize Paystack payment |
| GET | `/verify/:reference` | Yes | Verify payment status |
| POST | `/webhook` | No | Paystack webhook handler |
| GET | `/earnings` | Yes (artisan) | Get artisan earnings summary |

#### Review Routes — `/api/v1/reviews`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Yes (student) | Submit a review for a booking |
| GET | `/my` | Yes | Get own submitted reviews |

---

## 8. UI/UX Design System

### 8.1 Design Principles
1. **Clarity over Clutter** — Every screen has one primary action. White space is intentional.
2. **Proximity = Trust** — Location is always visible and prominent; it's central to the service.
3. **Status Transparency** — Booking statuses are always visually clear with color + icon + label.
4. **Mobile-First** — Design at 375px first; gracefully expand to desktop.
5. **Progressive Disclosure** — Show only what's needed; avoid overwhelming forms.

### 8.2 Key Screens & User Flows

#### Student Flows
```
Landing -> Register/Login -> GPS Permission -> Home/Browse
  Browse -> Filter/Search -> Artisan Profile -> Chat / Book
  Book -> Payment -> Booking Tracker -> Leave Review
  Profile -> Edit Profile
  Messages -> Chat Thread
```

#### Artisan Flows
```
Landing -> Multi-step Register -> Dashboard
  Dashboard -> Pending Bookings -> Accept/Reject
  Active Booking -> Mark In-Progress -> Mark Complete
  Earnings -> History
  Messages -> Respond to Student
  Profile -> Edit / Toggle Availability
```

### 8.3 Component Inventory
| Component | Type | Description |
|---|---|---|
| Button | Base | Primary, Secondary, Ghost, Destructive variants |
| Input | Base | Text, Email, Password, Textarea |
| Badge | Base | Status chips: Available, Pending, Accepted... |
| Avatar | Base | Circular image with initials fallback |
| Card | Base | Elevation-based container |
| Modal | Base | Centered overlay dialog |
| Toast | Base | Non-blocking notification |
| Spinner | Base | Loading indicator |
| StarRating | Composite | 1–5 star input / display |
| ArtisanCard | Feature | Profile snippet shown in listings |
| BookingCard | Feature | Booking summary with status badge |
| ChatBubble | Feature | Message bubble (sent/received) |
| ReviewCard | Feature | Review display with stars + comment |
| Navbar | Layout | Top nav with role-aware links |
| Sidebar | Layout | Dashboard navigation (desktop) |
| BottomNav | Layout | Mobile tab bar |

### 8.4 Spacing & Sizing Scale
```css
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-5: 20px;  --space-6: 24px;
--space-8: 32px;  --space-10: 40px; --space-12: 48px;
--space-16: 64px; --space-20: 80px; --space-24: 96px;

--radius-sm: 6px;  --radius-md: 10px; --radius-lg: 16px;
--radius-xl: 24px; --radius-full: 9999px;

--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 12px rgba(0,0,0,0.08);
--shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
```

---

## 9. Staged Implementation Roadmap

### Stage 0: Project Setup — COMPLETED (April 10, 2026)
- [x] Initialize monorepo structure (`client/` + `server/`)
- [x] Set up React 18 + Vite client
  - Installed: react-router-dom, @tanstack/react-query, axios, socket.io-client, lucide-react, zod
  - Configured `main.jsx` with BrowserRouter + QueryClientProvider
  - Created `App.jsx` with React Router skeleton
  - SEO-optimized `index.html` (meta description, theme color)
  - Build verified: `vite build` passes clean
- [x] Implement CSS design system (`styles/tokens.css` + `styles/global.css`)
  - Full color palette (primary, accent, success, error, warning, neutrals)
  - Typography scale (Plus Jakarta Sans + Inter)
  - Spacing, radius, shadow, z-index, transition tokens
  - Global reset, utilities, responsive container, animations
- [x] Set up Express server with Prisma
  - 15 dependencies installed (express, cors, helmet, cookie-parser, prisma, socket.io, bcryptjs, jsonwebtoken, etc.)
  - `server.js` — HTTP server + Socket.io wiring
  - `src/app.js` — Express factory with CORS credentials, cookie-parser, rate limiter, all routes mounted
  - `src/config/env.js` — Centralized env config
  - `src/config/database.js` — Prisma client singleton
- [x] Create full Prisma schema (`server/prisma/schema.prisma`)
  - Models: User, StudentProfile, ArtisanProfile, Booking, Payment, Review, Conversation, Message, Notification, RefreshToken
  - Enums: Role, ServiceCategory, BookingStatus, PaymentStatus
- [x] Create dual-mode auth middleware (`src/middleware/auth.js`)
  - Bearer header (Priority 1) + HttpOnly cookie fallback (Priority 2)
  - Role-based `authorize()` helper
- [x] Create Zod validation middleware (`src/middleware/validate.js`)
- [x] Create all 7 route stubs (auth, users, artisans, bookings, messages, payments, reviews)
- [x] Set up Axios API client (`client/src/lib/api.js`)
  - `withCredentials: true` for cookie transport
  - Bearer token from localStorage
  - Silent refresh interceptor on 401 TOKEN_EXPIRED
- [x] Configure `.env.example` files (root, server, client)
- [x] Set up `.gitignore`
- [x] Create docs structure (MASTER_PLAN.md, DESIGN_SYSTEM.md, CONTRIBUTING.md, README.md)
- [ ] Set up ESLint, Prettier, Husky pre-commit hooks *(deferred — not blocking)*
- [ ] Initialize develop branch *(team to do on first PR)*

### Stage 1: Design System & UI Foundations — COMPLETED
- [x] Implement CSS design tokens (colors, typography, spacing) *(completed in Stage 0)*
- [x] Build base UI component library (Button, Input, Badge, Card, Modal, Avatar, Toast, Spinner, StarRating)
- [x] Design and implement Navbar + Sidebar + BottomNav
- [x] Build Landing page
- [x] Implement Auth pages (Login, Register multi-step for both roles)
- [x] Create responsive dashboard layout

### Stage 2: Authentication & User Management (Est. 2–3 days) — UP NEXT
- [ ] Backend: Auth routes (register, login, refresh, verify, reset)
- [ ] Backend: Student & Artisan profile creation on registration
- [ ] Frontend: Register flow (student & artisan onboarding)
- [ ] Frontend: Login, forgot password, email verification
- [ ] Frontend: AuthContext with protected routes
- [ ] Profile view and edit (both roles)
- [ ] Profile photo upload (Cloudinary)

### Stage 3: Discovery & Artisan Listings (Est. 2–3 days)
- [ ] Backend: Artisan listing API with geo-sorting and filtering
- [ ] Frontend: Browse page with artisan cards grid
- [ ] Frontend: Filter sidebar (category, rating, price)
- [ ] Frontend: Search bar
- [ ] Frontend: Artisan public profile page
- [ ] Frontend: Geolocation permission + coordinate capture
- [ ] Frontend: Map view (optional enhancement)

### Stage 4: Booking System (Est. 3–4 days)
- [ ] Backend: Full booking CRUD + state machine
- [ ] Backend: Notification triggers on state changes
- [ ] Frontend: Booking request form (student)
- [ ] Frontend: Bookings dashboard (student) with status tracking
- [ ] Frontend: Bookings dashboard (artisan) with accept/reject
- [ ] Frontend: Booking detail page
- [ ] Email notifications on booking events

### Stage 5: Real-Time Messaging (Est. 2–3 days)
- [ ] Backend: Socket.io server setup + room management
- [ ] Backend: Message persistence API
- [ ] Frontend: Conversation list
- [ ] Frontend: Chat window with real-time updates
- [ ] Frontend: Unread badge indicators
- [ ] Frontend: In-app notification badges

### Stage 6: Payments (Est. 2–3 days)
- [ ] Backend: Paystack payment initialization
- [ ] Backend: Paystack webhook handler
- [ ] Backend: Earnings calculation (platform fee deduction)
- [ ] Frontend: Payment initiation after booking acceptance
- [ ] Frontend: Payment confirmation UI
- [ ] Frontend: Artisan earnings dashboard

### Stage 7: Reviews & Ratings (Est. 1–2 days)
- [ ] Backend: Review CRUD + artisan rating aggregation
- [ ] Frontend: Post-completion review form
- [ ] Frontend: Reviews display on artisan profile
- [ ] Frontend: My Reviews page (student)

### Stage 8: Polish, Testing & Deployment (Est. 3–5 days)
- [ ] Write unit tests (critical business logic)
- [ ] Write integration tests (API endpoints)
- [ ] Cross-browser and responsive testing
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance audit (Lighthouse >= 90)
- [ ] Deployment: Frontend -> Vercel / Netlify
- [ ] Deployment: Backend -> Railway / Render
- [ ] Deployment: Database -> Railway PostgreSQL / Supabase
- [ ] Final QA pass

---

## 10. Team Collaboration Guidelines

### Git Branching Strategy
```
main         - Production-ready code only. Tagged releases.
develop      - Integration branch. All features merge here first.
feature/*    - Individual features (e.g., feature/booking-system)
fix/*        - Bug fixes
docs/*       - Documentation updates
```

### Commit Convention (Conventional Commits)
```
feat(auth):     add JWT refresh token rotation
fix(booking):   correct status transition guard
chore(deps):    update prisma to 5.x
docs(api):      add payment endpoint reference
style(ui):      align card grid spacing
test(auth):     add register endpoint integration test
```

### Pull Request Rules
- All PRs must target `develop`
- Require at least 1 reviewer approval
- CI checks must pass (lint + tests)
- Write a descriptive PR description

### Environment Variables (.env.example)
```bash
# === SERVER ===
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/campusconnect
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:5173

# === CLOUDINARY ===
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# === PAYSTACK ===
PAYSTACK_SECRET_KEY=sk_test_
PAYSTACK_PUBLIC_KEY=pk_test_
PLATFORM_FEE_PERCENT=10

# === EMAIL ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="CampusConnect <noreply@campusconnect.app>"

# === CLIENT ===
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_PAYSTACK_PUBLIC_KEY=pk_test_
VITE_MAPBOX_TOKEN=
```

---

## Document Index

| Document | Path | Owner | Status |
|---|---|---|---|
| Master Plan | docs/MASTER_PLAN.md | CTO / PM | Active |
| DB Schema | docs/DB_SCHEMA.md | Backend Lead | Next |
| API Reference | docs/API.md | Backend Lead | Next |
| Design System | docs/DESIGN_SYSTEM.md | Design Lead | Next |
| Contributing Guide | docs/CONTRIBUTING.md | CTO | Next |

---

*Last updated: April 2026 — CampusConnect Team*
