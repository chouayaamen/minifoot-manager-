# CURRENT SPRINT — Epic 5: Post-Match & Leaderboards (FR-5) ✅ COMPLETE

## Epic Goal
Post-Match Score Logging, Player Events & Leaderboard Analytics per PRD FR-5 + ARCHITECTURE.md match_events & matches.

## Stories
- [x] Backend: POST /api/matches/:id/result (scoreHome/scoreAway → COMPLETED)
- [x] Backend: POST /api/matches/:id/events (array {playerId, eventType GOAL/ASSIST/YELLOW_CARD/RED_CARD, minute}) + GET/DELETE events
- [x] Backend: GET /api/stats/leaderboard (Top Scorers, Assist Leaders, Attendance Leaders, Team Overview: matches/winRate/goals)
- [x] UI: src/components/MatchCenter.tsx — score entry + per-player event rows
- [x] UI: src/components/Leaderboard.tsx — tabbed scorers/playmakers/attendance, W/D/L form, gold/silver/bronze + live PlayerCard integration
- [x] PlayerCard live stats wiring (goals/assists/apps from leaderboard)
- [x] Type checks clean (`npx tsc --noEmit` ✅), Prisma direct
- [x] Sprint wrap-up — Epic 3,4,5 all marked [x]

## Verification
- `npx tsc --noEmit` → 0 errors
- `npx tsc` build ok
- Leaderboard aggregates goals/assists/appearances from match_events + rsvps
