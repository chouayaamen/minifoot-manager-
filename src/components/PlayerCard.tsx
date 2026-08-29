import React from 'react';

export interface FutCardProps {
  name: string;
  photoUrl?: string | null;
  jerseyNumber?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH' | string | null;
  primaryPosition: string;
  secondaryPosition?: string | null;
  overallRating?: number | null;
  stats?: {
    goals?: number;
    assists?: number;
    appearances?: number;
    winRate?: number;
  } | null;
  variant?: 'gold' | 'silver' | 'bronze';
}

function tier(rating?: number | null, variant?: string): string {
  if (variant) return variant;
  if (!rating) return 'silver';
  if (rating >= 85) return 'gold';
  if (rating >= 75) return 'silver';
  return 'bronze';
}

function footLabel(f?: string | null): string {
  if (!f) return '—';
  if (f === 'LEFT') return 'L';
  if (f === 'RIGHT') return 'R';
  if (f === 'BOTH') return 'B';
  return f;
}

export const PlayerCard: React.FC<FutCardProps> = ({
  name,
  photoUrl,
  jerseyNumber,
  heightCm,
  weightKg,
  preferredFoot,
  primaryPosition,
  secondaryPosition,
  overallRating,
  stats,
  variant,
}) => {
  const t = tier(overallRating, variant);
  const bg =
    t === 'gold'
      ? 'linear-gradient(135deg,#b8860b 0%,#ffd700 25%,#f5d76e 50%,#d4af37 75%,#b8860b 100%)'
      : t === 'silver'
      ? 'linear-gradient(135deg,#6b7280 0%,#d1d5db 25%,#f3f4f6 50%,#9ca3af 75%,#6b7280 100%)'
      : 'linear-gradient(135deg,#78350f 0%,#d97706 30%,#fbbf24 50%,#92400e 80%,#78350f 100%)';

  const accent = t === 'gold' ? '#7c5a00' : t === 'silver' ? '#374151' : '#7c2d12';

  return (
    <div
      style={{
        width: 280,
        borderRadius: 18,
        background: bg,
        padding: 3,
        boxShadow: '0 12px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          borderRadius: 15,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.9) 100%)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px 6px',
            borderBottom: `1px solid ${accent}20`,
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: accent,
                lineHeight: 1,
                textShadow: '0 1px 0 rgba(255,255,255,0.8)',
              }}
            >
              {overallRating ?? '--'}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: accent }}>{primaryPosition}</span>
              {secondaryPosition && (
                <span style={{ fontSize: 9, fontWeight: 600, color: '#6b7280' }}>{secondaryPosition}</span>
              )}
            </span>
          </div>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: accent,
              color: 'white',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {jerseyNumber ?? '#'}
          </div>
        </div>

        <div style={{ position: 'relative', height: 170, background: `radial-gradient(ellipse at 50% 30%, ${accent}12 0%, transparent 65%)` }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
              onError={(e) => ((e.currentTarget.style.display = 'none'), ((e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'grid'))}
            />
          ) : null}
          <div
            style={{
              display: photoUrl ? 'none' : 'grid',
              placeItems: 'center',
              height: '100%',
              fontSize: 64,
              color: `${accent}30`,
            }}
          >
            ⚽
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
              padding: '22px 12px 8px',
            }}
          >
            <div style={{ color: 'white', fontWeight: 900, fontSize: 16, letterSpacing: 0.5, textShadow: '0 2px 6px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, padding: '8px 10px', flexWrap: 'wrap' }}>
          <span style={badgeStyle(accent)}>{heightCm ? `${heightCm}cm` : '—cm'}</span>
          <span style={badgeStyle(accent)}>{weightKg ? `${weightKg}kg` : '—kg'}</span>
          <span style={badgeStyle(accent)}>{footLabel(preferredFoot)} foot</span>
          <span style={{ ...badgeStyle(accent), background: accent, color: 'white' }}>{primaryPosition}</span>
          {secondaryPosition && <span style={badgeStyle(accent, true)}>{secondaryPosition}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: `1px solid ${accent}18`, background: `${accent}08` }}>
          <StatCell label="GOALS" value={stats?.goals} />
          <StatCell label="ASSISTS" value={stats?.assists} />
          <StatCell label="APPS" value={stats?.appearances} />
        </div>
        {stats?.winRate !== undefined && (
          <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: '#6b7280', padding: '4px 0 8px' }}>
            WIN RATE {stats.winRate}%
          </div>
        )}
      </div>
    </div>
  );
};

function badgeStyle(accent: string, dashed = false): React.CSSProperties {
  return {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.4,
    padding: '4px 7px',
    borderRadius: 999,
    border: `1px ${dashed ? 'dashed' : 'solid'} ${accent}30`,
    background: 'white',
    color: accent,
  };
}

function StatCell({ label, value }: { label: string; value?: number | null }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 4px', borderRight: '1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{value ?? 0}</div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.7, color: '#6b7280', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default PlayerCard;