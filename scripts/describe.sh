#!/usr/bin/env bash
set -e
cat <<'EOF'
=== Mini-Foot Tactical & Roster Manager — Progress Report ===

[1] DOCS SCAFFOLD (Step 1)
  - docs/PRODUCT_BRIEF.md  : Vision + Personas (Manager/Captain, Player)
  - docs/PRD.md            : FR-1..FR-5 (Registration, Pitch Board, RSVPs, Export, Stats)
  - docs/ARCHITECTURE.md   : SQL schemas for users, players, matches, rsvps, lineups, guest_players, match_events
  - .opencode              : Workspace rules enforcing docs compliance

[2] SERVER & DATABASE (Step 2)
  - Express 5 + TypeScript + Prisma (SQLite dev.db, PostgreSQL-ready)
  - prisma/schema.prisma   : 7 models mapped to ARCHITECTURE.md fields
  - prisma/migrations/     : init migration applied
  - src/index.ts, src/routes/index.ts, src/config/env.ts (zod validation)
  - src/utils/db.ts, bcrypt.ts, jwt.ts
  - src/middleware/authenticate.ts (Bearer JWT), errorHandler.ts
  - Auth API:
      POST /api/auth/register  {name,email,password,role} -> JWT
      POST /api/auth/login     {email,password} -> JWT + player

[3] PLAYER ONBOARDING & FUT CARD (Step 3)
  - POST /api/players/profile  (auth) {photoUrl,heightCm,weightKg,primaryPosition,secondaryPosition,preferredFoot,jerseyNumber} -> overallRating auto-calc, upsert
  - GET  /api/players                -> active roster + {goals,assists,appearances}
  - GET  /api/players/profile/:id    -> player + {goals,assists,appearances,rsvpCount,wins,winRate}
  - src/components/PlayerCard.tsx   : FIFA/FUT gold/silver/bronze card, photo fallback, badges (cm/kg/foot), position tags, stats row

[4] VERIFICATION
  - npx prisma generate && migrate dev OK, npx tsc --noEmit OK
  - curl /health, /api/health, /api/players OK
  - Live test: register manager+player, login, profile upsert, list, profile/:id with stats

Next: FR-2 Pitch Board (5v5-8v8 formations + drag-drop + guests), FR-3 Fixtures/RSVPs, FR-4 Canvas export, FR-5 Match Center.
EOF
