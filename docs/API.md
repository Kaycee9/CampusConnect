# CampusConnect API

Last updated: April 11, 2026

## Product in One Minute

CampusConnect is a two-sided marketplace:
- Students discover artisans and request services.
- Artisans manage incoming requests and job progress.

Current shipping capability:
- Auth and profile management
- Artisan listing and artisan public profile
- Booking creation, tracking, state transitions, and price negotiation
- Notification and email triggers on booking events

Not yet implemented:
- Messaging API
- Payments API
- Reviews API

## Base URL

- Development: http://localhost:5000/api/v1

## Authentication

Protected routes accept either:
- Authorization header with Bearer token
- Cookie-based access token

Token resolution order in middleware:
1. Authorization header
2. accessToken cookie

Refresh endpoint:
- POST /auth/refresh

## Error Shape

Most errors return:
- { error: string }

Some unimplemented routes return:
- { message: string }

## Health

- GET /health
- Auth: Public
- Purpose: API liveness check

## Auth Endpoints

- POST /auth/register
  - Auth: Public
  - Purpose: Create student or artisan account

- POST /auth/login
  - Auth: Public
  - Purpose: Sign in and issue tokens

- POST /auth/refresh
  - Auth: Public (uses refresh token)
  - Purpose: Rotate tokens

- POST /auth/logout
  - Auth: Public or token/cookie-backed session
  - Purpose: End session

- GET /auth/me
  - Auth: Required
  - Purpose: Get current user

- POST /auth/forgot-password
  - Auth: Public
  - Purpose: Send reset flow email

- POST /auth/reset-password/:token
  - Auth: Public
  - Purpose: Reset password

- GET /auth/verify-email/:token
  - Auth: Public
  - Status: Deferred for MVP (501)

## User Endpoints

- PUT /users/profile
  - Auth: Required
  - Purpose: Update profile fields and optional avatar upload

## Artisan Endpoints

- GET /artisans
  - Auth: Public
  - Purpose: List artisans
  - Query params:
    - category
    - minRating
    - maxPrice
    - search
    - isAvailable
    - sortBy (rating, price, distance, newest)
    - page
    - limit
    - lat
    - lng

- GET /artisans/:id
  - Auth: Public
  - Purpose: Get artisan profile details

## Booking Endpoints

All booking routes require authentication.

- GET /bookings
  - Purpose: List bookings for current user role

- POST /bookings
  - Role: STUDENT
  - Purpose: Create booking request

- GET /bookings/:id
  - Purpose: Get booking detail
  - Includes:
    - booking
    - negotiationHistory (if offers exist)

- PATCH /bookings/:id/accept
  - Role: ARTISAN
  - Purpose: Accept booking
  - Optional body: agreedPrice

- PATCH /bookings/:id/reject
  - Role: ARTISAN
  - Purpose: Reject booking
  - Optional body: rejectionReason

- PATCH /bookings/:id/start
  - Role: ARTISAN
  - Purpose: Move ACCEPTED to IN_PROGRESS

- PATCH /bookings/:id/complete
  - Role: ARTISAN
  - Purpose: Move IN_PROGRESS to COMPLETED

- PATCH /bookings/:id/cancel
  - Role: STUDENT
  - Purpose: Cancel PENDING booking

- PATCH /bookings/:id/price
  - Role: STUDENT, ARTISAN, ADMIN (participant guard enforced)
  - Purpose: Send counter-offer
  - Body:
    - agreedPrice (required)
    - note (optional)

Booking state model:
- PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED
- PENDING -> REJECTED
- PENDING -> CANCELLED

## Negotiation History

Negotiation timeline is currently persisted via Notification records:
- type: BOOKING_NEGOTIATION
- metadata includes bookingId, offerId, proposedPrice, by, actorName, note

The booking detail endpoint reconstructs and returns a de-duplicated, latest-first negotiation history.

## Routes Not Yet Implemented

These route groups currently return 501:
- /messages
- /payments
- /reviews

## Frontend Routes (Current)

- /login
- /register
- /dashboard
- /browse
- /artisan/:id
- /bookings
- /bookings/new
- /bookings/:id
- /profile
