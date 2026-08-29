import React, { useEffect, useState } from 'react';

type Status = 'ATTENDING' | 'UNAVAILABLE' | 'INJURED' | 'LATE';
type Props = { matchId: string; token?: string; currentPlayerId?: string };

const opts: { id: Status; label: string; color: string }[] = [
  { id: 'ATTENDING', label: 'Attending', color: '#16a34a' },
  { id: 'UNAVAILABLE', label: 'Out', color: '#6b7280' },
  { id: 'INJURED', label: 'Injured', color: '#dc2626' },
  { id: 'LATE', label: 'Late', color: '#f59e0b' },
];

export const RsvpCard: React.FC<Props> = ({ matchId, token }) => {
  const [active, setActive] = useState<Status | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(): Promise<void> {
    const r = await fetch(`/api/matches/${matchId}/rsvp`);
    if (r.ok) { const j = await r.json(); setCounts(j.counts); }
  }
  useEffect(() => { load(); }, [matchId]);

  async function pick(s: Status): Promise<void> {
    setLoading(true);
    const r = await fetch(`/api/matches/${matchId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ status: s }),
    });
    if (r.ok) { setActive(s); await load(); }
    setLoading(false);
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 13 }}>Your RSVP</span>
        {counts && <span style={{ fontSize: 11, color: '#6b7280' }}>{counts.ATTENDING} attending · {counts.UNAVAILABLE} out · {counts.INJURED} injured · {counts.LATE} late</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {opts.map((o) => (
          <button key={o.id} onClick={() => pick(o.id)} disabled={loading} style={{
            padding: '9px 6px', borderRadius: 10, border: `2px solid ${active===o.id ? o.color : '#e5e7eb'}`,
            background: active===o.id ? o.color : 'white', color: active===o.id ? 'white' : '#374151',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>{o.label}</button>
        ))}
      </div>
      {active && <div style={{ fontSize: 11, color: '#6b7280' }}>You are <b>{active}</b> for this fixture.</div>}
    </div>
  );
};
export default RsvpCard;