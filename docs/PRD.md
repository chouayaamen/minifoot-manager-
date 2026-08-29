# Product Requirements Document

## FR-1: Player Self-Registration
- **Fields**: Name, Height (cm), Weight (kg), Photo upload, Primary Position [GK, DEF, MID, PIVOT], Secondary Position [GK, DEF, MID, PIVOT], Preferred Foot [Left, Right, Both]
- **Auto-generate**: FUT-style player cards with overall rating calculated from physical/tactical attributes
- **Validation**: Required fields, position logic (GK cannot have outfield secondary), photo size/type limits

## FR-2: Dynamic Mini-Foot Pitch Board
- **Formats**: 5v5, 6v6, 7v7, 8v8 (configurable per match)
- **Formation Presets**:
  - 5v5: 1-2-1, 2-2
  - 6v6: 1-2-2, 2-2-1
  - 7v7: 2-3-1, 2-2-2
  - 8v8: 2-3-2, 3-2-2
- **Drag-and-Drop**: Assign players to pitch slots with visual position zones
- **Guest Player Slots**: Empty slots labeled "Guest" for non-registered players

## FR-3: Fixtures & RSVPs
- **Fixture Fields**: Match Date/Time, Venue, Home/Away, Kit Color (Home/Away), Opponent Name
- **Kit Clash Alert**: Visual warning when home/away kit colors conflict
- **RSVP Toggles**: Per-player status [Available, Unavailable, Maybe] with deadline reminders

## FR-4: Lineup Image Export
- **One-Click Canvas Download**: Render pitch board with player cards/photos to image
- **Formats**: PNG (primary), JPG (fallback)
- **WhatsApp Optimized**: 1080x1080 or 1080x1350 aspect ratios
- **Includes**: Team name, fixture info, formation, player names/numbers/photos

## FR-5: Match Center & Stats
- **Live Input**: Goals, Assists, Yellow/Red Cards per player per match
- **Aggregated Leaderboards**: Top Scorers, Top Assists, Most Appearances, Cards
- **Match History**: Filterable by season, competition, player
- **Player Stats Card**: Per-player seasonal summary on profile