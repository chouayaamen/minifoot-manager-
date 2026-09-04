import { useEffect, useState } from 'react';

type MD = { id: string; date: string; stadium: string };

export default function MatchDay({ token, isManager }: { token: string; isManager: boolean }) {
  const [md, setMd] = useState<MD | null>(null);
  const [date, setDate] = useState('');
  const [stadium, setStadium] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  async function load() {
    const r = await fetch('/api/matchday', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) { const j = await r.json(); setMd(j.matchDay); if (j.matchDay) { setDate(j.matchDay.date.slice(0,16)); setStadium(j.matchDay.stadium); } }
  }
  useEffect(() => { load(); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  async function save() {
    if (!date || !stadium.trim()) { setMsg('Pick date + stadium'); return; }
    const r = await fetch('/api/matchday', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ date: new Date(date).toISOString(), stadium: stadium.trim() }) });
    const j = await r.json();
    if (r.ok) { setMd(j.matchDay); setMsg('Match Day saved ✓'); } else setMsg(j.error || 'Save failed');
  }

  function countdown() {
    if (!md) return null;
    const diff = new Date(md.date).getTime() - now;
    if (diff <= 0) return 'Live / Finished';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${d}d ${h}h ${m}m ${s}s`;
  }

  const stadiums = ['Minifoot Central', 'Arena 5', 'City Futsal', 'Five Stadium', 'Urban Pitch'];

  return (
    <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>📅 Match Day</h2>
        {md && <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>{new Date(md.date).toLocaleString()} · {md.stadium}</span>}
        {md && <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, background: '#111827', color: 'white' }}>⏳ {countdown()}</span>}
      </div>

      {isManager && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Manager — set date & stadium</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} style={inp} />
            <input list="stadiums" value={stadium} onChange={e => setStadium(e.target.value)} placeholder="Stadium name" style={inp} />
            <datalist id="stadiums">{stadiums.map(s => <option key={s} value={s} />)}</datalist>
          </div>
          <button onClick={save} style={btn}>Save Match Day</button>
          {msg && <div style={{ fontSize: 12, color: msg.includes('✓') ? '#16a34a' : '#dc2626' }}>{msg}</div>}
        </div>
      )}

      <div style={{ background: md ? '#f0fdf4' : '#fef2f2', border: `1px solid ${md ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
        {md ? (
          <>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{new Date(md.date).toLocaleDateString()} — {new Date(md.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div style={{ fontSize: 14, color: '#374151', marginTop: 6 }}>🏟️ {md.stadium}</div>
            <div style={{ fontSize: 13, color: '#16a34a', marginTop: 8, fontWeight: 800, padding: '6px 12px', background: 'white', borderRadius: 999, display: 'inline-block', border: '1px solid #bbf7d0' }}>⏳ Countdown: {countdown()}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>Visible to all players</div>
          </>
        ) : (
          <div style={{ color: '#9ca3af', fontSize: 13 }}>No Match Day set yet — {isManager ? 'set date & stadium above' : 'waiting for manager.'}</div>
        )}
      </div>
    </section>
  );
}
const inp: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 };
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#16a34a', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' };
