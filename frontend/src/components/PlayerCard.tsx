import React, { useState } from 'react';

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
  stats?: { goals?: number; assists?: number; appearances?: number; winRate?: number } | null;
  variant?: 'gold' | 'silver' | 'bronze';
  showAddFriend?: boolean;
  onAddFriend?: () => void;
  friendBadgeLabel?: string;
  friendBadgeDisabled?: boolean;
}

function posColor(pos: string): string {
  const p = pos.toUpperCase();
  if (['GK','GKP','GOALKEEPER'].includes(p)) return '#f59e0b';
  if (['CB','LB','RB','LWB','RWB','DEF','DF'].includes(p)) return '#3b82f6';
  if (['CDM','CM','CAM','LM','RM','MID','MF'].includes(p)) return '#10b981';
  if (['CF','ST','LW','RW','FW','ATT'].includes(p)) return '#ef4444';
  return '#6b7280';
}
function footLabel(f?: string | null): string {
  if (!f) return '—';
  if (f === 'LEFT') return 'L';
  if (f === 'RIGHT') return 'R';
  if (f === 'BOTH') return 'B';
  return f;
}

export const PlayerCard: React.FC<FutCardProps> = ({
  name, photoUrl, jerseyNumber, heightCm, weightKg, preferredFoot,
  primaryPosition, secondaryPosition, overallRating, stats,
  showAddFriend, onAddFriend, friendBadgeLabel,
}) => {
  const accent = posColor(primaryPosition);
  const isAction = friendBadgeLabel === 'Accept' || friendBadgeLabel === 'Cancel Request';
  const [imgErr, setImgErr] = useState(false);
  const showImg = !!photoUrl && !imgErr;
  return (
    <div style={{
      width: 176, borderRadius: 20, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
      overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 4, background: accent }} />
      <div style={{ padding: '10px 10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, padding: '3px 7px', borderRadius: 999, background: `${accent}14`, color: accent, border: `1px solid ${accent}22` }}>
          {primaryPosition}{secondaryPosition ? ` · ${secondaryPosition}` : ''}
        </span>
        <span style={{ minWidth: 26, height: 26, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#111827', color: 'white', fontWeight: 800, fontSize: 11 }}>
          {jerseyNumber ?? '#'}
        </span>
      </div>
      <div style={{ position: 'relative', height: 148, margin: '10px 10px 0', borderRadius: 14, overflow: 'hidden', background: '#f3f4f6' }}>
        {showImg ? (
          <img src={photoUrl!} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} onError={() => setImgErr(true)} />
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', fontSize: 36, color: '#9ca3af', background: `linear-gradient(135deg, ${accent}14, #f3f4f6)` }}>⚽</div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
          <div style={{ color: 'white', fontWeight: 900, fontSize: 13, lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 700, marginTop: 2 }}>{heightCm ? `${heightCm}cm` : '—'} · {weightKg ? `${weightKg}kg` : '—'} · {footLabel(preferredFoot)} foot</div>
        </div>
        {overallRating != null && (
          <span style={{ position: 'absolute', top: 8, left: 8, minWidth: 28, height: 22, padding: '0 6px', borderRadius: 999, background: 'rgba(17,24,39,0.9)', color: 'white', fontWeight: 900, fontSize: 11, display: 'grid', placeItems: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>{overallRating}</span>
        )}
      </div>
      {stats && (stats.goals || stats.assists || stats.appearances) ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '1px solid #f3f4f6', marginTop: 4 }}>
          <MiniStat label="G" value={stats.goals} />
          <MiniStat label="A" value={stats.assists} />
          <MiniStat label="AP" value={stats.appearances} />
        </div>
      ) : <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 4 }} />}
      <div style={{ padding: 8 }}>
        {friendBadgeLabel ? (
          isAction ? (
            <button onClick={onAddFriend} style={{ width: '100%', padding: '7px 8px', borderRadius: 999, border: 'none', background: friendBadgeLabel === 'Cancel Request' ? '#6b7280' : accent, color: 'white', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>{friendBadgeLabel}</button>
          ) : (
            <div style={{ textAlign: 'center', padding: '7px 8px', borderRadius: 999, fontWeight: 800, fontSize: 11, background: friendBadgeLabel === 'You' ? '#111827' : friendBadgeLabel === '✓ Friend' ? '#dcfce7' : '#f3f4f6', color: friendBadgeLabel === '✓ Friend' ? '#166534' : friendBadgeLabel === 'You' ? 'white' : '#6b7280', border: '1px solid #e5e7eb' }}>{friendBadgeLabel}</div>
          )
        ) : showAddFriend ? (
          <button onClick={onAddFriend} style={{ width: '100%', padding: '7px 8px', borderRadius: 999, border: `1px solid ${accent}`, background: 'white', color: accent, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>+ Add Friend</button>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 10, color: '#9ca3af', padding: '4px 0' }}>{primaryPosition} · #{jerseyNumber ?? '—'}</div>
        )}
      </div>
    </div>
  );
};

function MiniStat({ label, value }: { label: string; value?: number | null }) {
  return (
    <div style={{ textAlign: 'center', padding: '7px 2px', borderRight: '1px solid #f3f4f6' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value ?? 0}</div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: '#9ca3af' }}>{label}</div>
    </div>
  );
}
export default PlayerCard;
