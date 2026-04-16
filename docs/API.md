# CampusConnect API

Last updated: April 16, 2026

## Product in One Minute

CampusConnect is a two-sided marketplace:
- Students discover artisans and request services.
- Artisans manage incoming requests and job progress.

Current shipping capability:
- Auth and profile management
- Artisan listing and artisan public profile
- Booking creation, tracking, completion verification, and price negotiation
- Messaging conversations, booking-scoped threads, unread counts, and live updates
- Payment simulation lifecycle with event logging (initiate, simulate, retry, refund)
- Withdrawal request workflow for artisans (completed + paid bookings only)
- Reviews and ratings for completed, successfully paid bookings
- Notification and email triggers on major booking lifecycle events

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
  - Supports artisan payout fields:
    - bankName
    - accountName
    - accountNumber (10 digits)

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

- PATCH /bookings/:id/request-completion
  - Role: ARTISAN
  - Purpose: Request student completion confirmation for an IN_PROGRESS booking

- PATCH /bookings/:id/confirm-completion
  - Role: STUDENT
  - Purpose: Confirm completion and move IN_PROGRESS to COMPLETED

- PATCH /bookings/:id/decline-completion
  - Role: STUDENT
  - Purpose: Decline completion request and keep booking IN_PROGRESS
  - Optional body:
    - reason

- PATCH /bookings/:id/complete
  - Role: ARTISAN
  - Purpose: Backward-compatible alias for request-completion

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

Completion verification model:
- Artisan requests completion while booking is IN_PROGRESS
- Student confirms to move booking to COMPLETED
- Student can decline with a reason and keep booking IN_PROGRESS

## Messaging Endpoints

All messaging routes require authentication.

- GET /messages/conversations
  - Purpose: List inbox threads for the current user

- POST /messages/conversations
  - Purpose: Start or fetch a thread
  - Body:
    - participantId (optional)
    - bookingId (optional, preferred when starting from a booking)

- GET /messages/conversations/:id
  - Purpose: Get thread messages and booking context

- POST /messages/conversations/:id
  - Purpose: Send a chat message
  - Body:
    - content (required)

- PATCH /messages/conversations/:id/read
  - Purpose: Mark unread messages as read

- PATCH /messages/conversations/:id/finalize
  - Purpose: Finalize a booking negotiation from inside chat
  - Body:
    - agreedPrice (required)

## Payment Endpoints

All payment routes require authentication.

- GET /payments/bookings/:bookingId
  - Purpose: Get payment summary for booking

- POST /payments/bookings/:bookingId/initiate
  - Role: STUDENT
  - Purpose: Create or return payment record for an accepted booking

- POST /payments/:paymentId/simulate
  - Purpose: Simulate payment outcome
  - Body:
    - outcome (success | failed | cancelled)

- POST /payments/:paymentId/retry
  - Purpose: Retry a failed simulation payment

- POST /payments/:paymentId/refund
  - Purpose: Refund a successful payment
  - Optional body:
    - reason

- GET /payments/withdrawals/summary
  - Role: ARTISAN
  - Purpose: Get withdrawable balance from completed and successfully paid bookings

- POST /payments/withdrawals/request
  - Role: ARTISAN
  - Purpose: Create a withdrawal request from currently eligible completed payment items
  - Optional body:
    - note

## Review Endpoints

All review routes require authentication.

- GET /reviews/bookings/:bookingId
  - Purpose: Get booking review if available

- POST /reviews/bookings/:bookingId
  - Role: STUDENT
  - Purpose: Submit review for a completed and successfully paid booking
  - Body:
    - rating (1-5)
    - comment (optional)

## Frontend Routes (Current)

- /login
- /register
- /dashboard
- /browse
- /artisan/:id
- /bookings
- /bookings/new
- /bookings/:id
- /messages
- /messages/:id
- /payments
- /reviews
- /profile
