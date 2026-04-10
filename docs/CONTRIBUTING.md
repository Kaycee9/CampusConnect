# CampusConnect — Contributing Guide

## Branching Strategy

```
main         → Production only. Never commit directly.
develop      → Integration branch. Base for all PRs.
feature/*    → New features (e.g., feature/booking-state-machine)
fix/*        → Bug fixes (e.g., fix/auth-token-expiry)
docs/*       → Documentation changes
```

## Commit Messages (Conventional Commits)

Format: `type(scope): short description`

| Type | When to Use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, dependencies |
| `docs` | Documentation |
| `style` | Formatting, no logic change |
| `refactor` | Refactor without feature/fix |
| `test` | Adding/updating tests |
| `perf` | Performance improvement |

### Examples
```
feat(auth): implement refresh token rotation
fix(booking): prevent double accept on booking
chore(deps): upgrade prisma to 5.12
docs(api): document payment webhook endpoint
```

## Pull Request Process

1. Branch from `develop`
2. Make your changes following the code style guide below
3. Write tests for new logic
4. Open PR targeting `develop` with this template:

```markdown
## What does this PR do?
Brief description of changes.

## Why?
Context / motivation.

## How to test?
Steps to validate the changes locally.

## Screenshots (if UI changes)
Before | After

## Checklist
- [ ] Code follows the project style guide
- [ ] Tests written and passing
- [ ] Self-reviewed
```

## Code Style

- **JavaScript:** ESLint (Airbnb config) + Prettier
- **Naming:** camelCase for variables/functions, PascalCase for components/classes
- **Files:** kebab-case filenames (`booking-card.jsx`, `auth.controller.js`)
- **CSS:** BEM-like class names (`.artisan-card__header`, `.btn--primary`)
- **No console.log in production code** — use the logger utility

## Folder Conventions

### Frontend (`client/src/`)
- One component per file
- Co-locate component-specific styles in the same folder
- Hooks start with `use` (e.g., `useAuth.js`)
- API calls go through `lib/api.js` — never raw fetch in components

### Backend (`server/src/`)
- Controllers: handle HTTP layer only — no business logic
- Services: all business logic lives here
- Routes: wire controllers with middleware
- Middleware: reusable request processing

## Environment Setup

```bash
# Clone the repo
git clone https://github.com/Kaycee9/CampusConnect.git
cd campusconnect

# Install all dependencies
cd client && npm install
cd ../server && npm install

# Copy env files
cp .env.example .env        # server
cp client/.env.example client/.env

# Start development
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

## Running Tests

```bash
# Frontend
cd client && npm test

# Backend
cd server && npm test

# Backend with coverage
cd server && npm run test:coverage
```
