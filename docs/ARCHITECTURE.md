# Architecture: Database Schema

## Tables

### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('manager', 'player')),
    team_id UUID REFERENCES teams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### players
```sql
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    height_cm INT,
    weight_kg INT,
    photo_url TEXT,
    primary_position VARCHAR(10) NOT NULL CHECK (primary_position IN ('GK', 'DEF', 'MID', 'PIVOT')),
    secondary_position VARCHAR(10) CHECK (secondary_position IN ('GK', 'DEF', 'MID', 'PIVOT')),
    preferred_foot VARCHAR(10) NOT NULL CHECK (preferred_foot IN ('LEFT', 'RIGHT', 'BOTH')),
    jersey_number INT,
    overall_rating INT GENERATED ALWAYS AS (
        CASE 
            WHEN primary_position = 'GK' THEN (height_cm + weight_kg) / 2
            ELSE (height_cm * 0.4 + weight_kg * 0.6)::int
        END
    ) STORED,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### teams
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    home_kit_color VARCHAR(7) NOT NULL, -- hex color
    away_kit_color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### matches
```sql
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    opponent_name VARCHAR(100) NOT NULL,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(200),
    format VARCHAR(10) NOT NULL CHECK (format IN ('5v5', '6v6', '7v7', '8v8')),
    home_kit_color VARCHAR(7),
    away_kit_color VARCHAR(7),
    is_home BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### rsvps
```sql
CREATE TABLE rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'maybe' CHECK (status IN ('available', 'unavailable', 'maybe')),
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (match_id, player_id)
);
```

### lineups
```sql
CREATE TABLE lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    formation VARCHAR(20) NOT NULL, -- e.g., '1-2-1', '2-3-1'
    slots JSONB NOT NULL, -- array of {slot_id, position, player_id, is_guest, guest_name}
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (match_id)
);
```

### guest_players
```sql
CREATE TABLE guest_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    lineup_slot_id VARCHAR(50) NOT NULL, -- references slot_id in lineups.slots
    name VARCHAR(100) NOT NULL,
    position VARCHAR(10) CHECK (position IN ('GK', 'DEF', 'MID', 'PIVOT')),
    jersey_number INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### match_events
```sql
CREATE TABLE match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    guest_player_id UUID REFERENCES guest_players(id) ON DELETE SET NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card', 'sub_on', 'sub_off')),
    minute INT NOT NULL CHECK (minute >= 0 AND minute <= 90),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes
```sql
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_matches_team_id ON matches(team_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_rsvps_match_id ON rsvps(match_id);
CREATE INDEX idx_match_events_match_id ON match_events(match_id);
CREATE INDEX idx_match_events_player_id ON match_events(player_id);
```