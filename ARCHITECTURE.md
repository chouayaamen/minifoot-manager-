# Mini-Foot Manager — Architecture

> Generated 2026-08-30 — describes current codebase after Squad-Isolated Roster implementation.

## 1. Overview
Mini-Foot Tactical & Roster Manager is a full-stack **Squad-isolated** app for managers and players: tactical pitch board, fixtures/RSVP, match center, leaderboard analytics, friends/invites, profile, and squad roster with join-code.
- **Manager**: creates squad, gets unique 6-char code, adds/kicks players, manages pitch/lineups/fixtures.
- **Player**: registers → creates profile → joins squad via code (Squad tab) → appears in squad roster only.

## 2. Tech Stack
| Layer | Tech |
|-------|------|
| Backend | Node 20, Express 4, TypeScript, `ts-node` dev, `tsc` build |
| ORM | Prisma 5.22 — SQLite dev (`dev.db`), `prisma/migrations` |
| Auth | `bcrypt` hash, `jsonwebtoken` JWT (`utils/jwt.ts`), `authenticate` + `authorize(['manager'])` middleware |
| Frontend | React 18, Vite 6, TypeScript, `frontend/src` → `frontend/dist` → copied to `public/` for Express static |
| Styling | Inline `React.CSSProperties`, no Tailwind, FUT-card `PlayerCard.tsx`, `html2canvas` for lineup export |
| Proxy | Vite `server.proxy /api → :5000` (dev), Express `cors`, `helmet`, `morgan`, `express.static(../public)` (prod) |

## 3. Directory Tree
```
C:\minifoot-app\
├── prisma/
│   ├── schema.prisma
│   └── migrations/20260830*_add_squad_isolation/migration.sql
├── src/
│   ├── index.ts              # Express app + static public + /api
│   ├── controllers/          # auth, player, squad, match, invite, friend, comment, stats
│   ├── routes/               # index.ts mounts /auth /players /squad /matches ...
│   ├── middleware/authenticate.ts + authorize
│   ├── utils/{db,bcrypt,jwt}
│   └── components/           # mirror of frontend Squad/Roster for spec path
├── frontend/src/
│   ├── App.tsx               # tab router (squad/pitch/fixtures/center/board/profile/friends)
│   ├── components/{Roster.tsx,Squad.tsx,PitchBoard.tsx,PlayerCard.tsx,...}
│   ├── pages/{LoginPage,RegisterPage,EditProfile}
│   └── vite.config.ts
├── public/                   # built frontend (copied from frontend/dist)
└── ARCHITECTURE.md
```

## 4. Database — `prisma/schema.prisma`
```prisma
User { id cuid, name, email @unique, passwordHash, role String default "player", managedSquads Squad[] }
Squad { id cuid, name, code String @unique, managerId → User Cascade, players Player[], createdAt, updatedAt } @map("squads")
Player { id cuid, userId @unique → User Cascade, squadId? → Squad SetNull, name, nickname?, photoUrl?, heightCm?, weightKg?, primaryPosition, secondaryPosition?, preferredFoot, jerseyNumber?, overallRating?, isActive } 
Match { id, opponent, matchDate, venue, formatType, status, lineups, rsvps, events }
+ Invite, FriendRequest, Rsvp, Lineup, MatchEvent, PitchComment
```
- **Isolation**: `Player.squadId` FK. `DELETE Squad → SetNull` (unlink, keep user). `DELETE User (manager) → Cascade` squad.
- **Code**: 6-char `A-Z2-9` (no 0/O/I/1), `@unique`, regenerated via `/squad/regenerate-code`.

## 5. Backend Architecture `src/`
### Routes `src/routes/index.ts`
```
/api/auth     → register, login, me
/api/players  → profile upsert, profile/me, avatar upload, list, :id
/api/squad    → roster, me, POST / (create), POST /players (add by email), DELETE /players/:id (kick), POST /join (by code), POST /regenerate-code
/api/matches  → CRUD, lineup, guests, rsvp, events
/api/invites  → invite by email, accept/decline, status
/api/friends  → request/accept/cancel, list, search users?q=
/api/comments → pitch comments
/api/stats    → leaderboard
```

### Key Controllers
- **authController.ts**: `registerSchema {name,email,password,role,squadCode?}` validates code exists before create; `login` returns `player`; JWT `signToken({userId,email,role})`.
- **squadController.ts**: `getActiveSquadForUser()` manager→ `squad where managerId=userId`, player→ `player.squadId → squad`; `getSquadRoster` filters `player where squadId=squad.id isActive` + enriches `stats {goals,assists,appearances}` from `MatchEvent`; manager auto-creates squad on add if missing.
- **playerController.ts**: `profileSchema {primaryPosition, preferredFoot, heightCm, weightKg, ..., squadCode?}` calc `overallRating` from height/weight/pos; on `squadCode` lookup `squad` and patch `squadId`.

### Middleware
`authenticate` verifies `Bearer JWT` → `req.user {userId,email,role}`; `authorize(['manager'])` 403 otherwise.

## 6. Frontend `frontend/src/App.tsx`
- **State**: `token (localStorage), me, tab: 'squad'|'pitch'|'fixtures'|'center'|'board'|'profile'|'friends', players, matches, friends, invites, isInvited, hasSquad`
- **Unlock**: `isManager = me.role==='manager'`; `hasSquad = !!GET /api/squad/me`; `canSeeAll = isManager||isInvited||hasSquad`; `!canSeeAll` → limited view but still shows header nav + **Squad section top + Edit Profile section** (new accounts see join from start).
- **Tabs**:
  - **Squad** `<section id="squad"><Roster/></section>` — Squad section (white card radius16 padding20)
  - **Pitch** `PitchBoard` tactical 5-a-side + `CommentBoard`
  - **Fixtures** `MatchForm` + `RsvpCard`
  - **Center** `MatchCenter` (manager score/events)
  - **Board** `Leaderboard`
  - **Profile** `EditProfile` (pure profile fields) + `InvitesPanel`
  - **Friends** search/add, pending, friends list, invite selected

### Squad Component `frontend/src/components/Roster.tsx` (aliased `Squad.tsx`)
```tsx
<Squad> → <section aria-label="Squad section" style="white card">
  Squad + badge Code: 785A6G [Refresh]
  [Squad Code: CODE Copy][Regenerate if manager]
  !squad&manager → Create Squad
  !squad&!manager → Join a Squad [Join Squad] (prefill pendingSquadCode)
  squad&!manager → Switch squad [Join/Switch]
  squad&manager → + Add Player to Squad (modal email) 
  players flex wrap → <PlayerCard/> + Remove from Squad (manager) + confirm modal
</section>
```
- **EditProfile** `pages/EditProfile.tsx`: avatar URL/upload, nickname/bio/phone, height/weight/positions/foot/# → `POST /api/players/profile` (no squadCode now).
- **RegisterPage** `pages/RegisterPage.tsx`: name/email/password/role (no squad code — join only via Squad tab).

## 7. Data Flows
1. **Register player → Edit Profile → Join**: `POST /auth/register {role:player}` → `POST /auth/login → token` → `App` sets `tab='profile'` → `EditProfile Save → POST /players/profile` → `Squad tab → ENTER CODE → POST /squad/join {code}` → `PATCH player.squadId` → `GET /squad/roster` shows isolated players.
2. **Manager add**: `Squad → + Add Player → POST /squad/players {email}` → `UPDATE player.squadId = managerSquad.id`.
3. **Roster isolation**: `GET /squad/roster` middleware checks `req.user` → returns only `players where squadId = mySquad.id`.
4. **Kick**: `DELETE /squad/players/:id` → `squadId=null` (no user delete).

## 8. Build & Run
```bash
npx prisma migrate dev --name add_squad_isolation  # already 20260830165130
npx prisma generate
npm run build          # tsc → dist/
npm run build --prefix frontend  # tsc + vite → frontend/dist → cp -r frontend/dist/* public/
npm start              # node dist/index.js serves public/ + /api
# dev
npm run dev:all        # nodemon ts-node :5000 + vite :5173 proxy /api→:5000
```

## 9. Deployment Notes
- `public/index.html` references `assets/index-*.js` (cache-bust hash); after each `frontend` build `cp -r frontend/dist/* public/` required; hard-refresh `Ctrl+F5` or `?v=` to bust.
- Env `.env` → `DATABASE_URL`, `JWT_SECRET`; Prisma `SetNull/Cascade` ensures orphans unlinked not deleted.
- Typecheck: `npx tsc --noEmit` (backend) + `npx tsc --noEmit --project frontend/tsconfig.json` (frontend) both 0.

---
*Mirror for spec path `src/components/Squad.tsx` == `frontend/src/components/Squad.tsx`. Future: add `SquadSection` reusable import if needed.*
