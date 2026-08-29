import React, { useState } from 'react';
import { kitClashCheck } from '../utils/kitClash';

type Props = {
  onCreated?: (match: Record<string, unknown> & { clash?: { clash: boolean; warning: string | null } }) => void;
  token?: string;
};

export const MatchForm: React.FC<Props> = ({ onCreated, token }) => {
  const [opponent, setOpponent] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [venue, setVenue] = useState('');
  const [formatType, setFormatType] = useState<'5v5'|'6v6'|'7v7'|'8v8'>('7v7');
  const [homeKitColor, setHomeKitColor] = useState('#16a34a');
  const [awayKitColor, setAwayKitColor] = useState('#dc2626');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const clash = kitClashCheck(homeKitColor, awayKitColor);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ opponent, matchDate: new Date(matchDate).toISOString(), venue, formatType, homeKitColor, awayKitColor }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setMsg(j.clash?.warning ? `Created — ${j.clash.warning}` : 'Created ✓');
      onCreated?.(j);
    } catch (err) { setMsg((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, display: 'grid', gap: 10, maxWidth: 520 }}>
      <div style={{ fontWeight: 800, fontSize: 14 }}>New Fixture</div>
      <input placeholder="Opponent" value={opponent} onChange={(e) => setOpponent(e.target.value)} required style={input} />
      <input type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} required style={input} />
      <input placeholder="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} style={input} />
      <div style={{ display: 'flex', gap: 6 }}>
        {(['5v5','6v6','7v7','8v8'] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFormatType(f)} style={tab(formatType===f)}>{f}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={label}>Home Kit<input type="color" value={homeKitColor} onChange={(e) => setHomeKitColor(e.target.value)} style={colorPick} /></label>
        <label style={label}>Away Kit<input type="color" value={awayKitColor} onChange={(e) => setAwayKitColor(e.target.value)} style={colorPick} /></label>
      </div>
      {clash.clash && <div style={clashBanner}>⚠️ {clash.warning} (distance {clash.distance})</div>}
      {!clash.clash && homeKitColor && awayKitColor && <div style={{ ...clashBanner, background: '#dcfce7', borderColor: '#86efac', color: '#166534' }}>✓ Kits distinct (distance {clash.distance})</div>}
      <button type="submit" disabled={loading} style={primary}>{loading ? 'Creating…' : 'Create Match'}</button>
      {msg && <div style={{ fontSize: 12, color: msg.includes('warning') || msg.includes('Created') ? '#166534' : '#dc2626' }}>{msg}</div>}
    </form>
  );
};

const input: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 };
const label: React.CSSProperties = { display: 'grid', gap: 4, fontSize: 12, fontWeight: 600, color: '#374151' };
const colorPick: React.CSSProperties = { height: 36, borderRadius: 8, border: '1px solid #e5e7eb', width: '100%', cursor: 'pointer' };
const tab = (on: boolean): React.CSSProperties => ({ padding: '6px 10px', borderRadius: 999, border: `1px solid ${on ? '#16a34a' : '#e5e7eb'}`, background: on ? '#16a34a' : 'white', color: on ? 'white' : '#374151', fontWeight: 700, fontSize: 12, cursor: 'pointer' });
const clashBanner: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12, fontWeight: 600 };
const primary: React.CSSProperties = { padding: '9px 12px', borderRadius: 8, background: '#16a34a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' };
export default MatchForm;