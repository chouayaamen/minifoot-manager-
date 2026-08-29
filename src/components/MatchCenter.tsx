import React, { useState, useEffect } from 'react';

type PlayerOpt = { id: string; name: string; jerseyNumber?: number | null };
type Props = { matchId: string; token?: string; roster: PlayerOpt[]; onSaved?: () => void };

export const MatchCenter: React.FC<Props> = ({ matchId, token, roster, onSaved }) => {
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);
  const [rows, setRows] = useState<{ playerId: string; eventType: 'GOAL'|'ASSIST'|'YELLOW_CARD'|'RED_CARD'; minute: number }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [events, setEvents] = useState<Record<string,unknown>[]>([]);

  async function load(): Promise<void> {
    const r = await fetch(`/api/matches/${matchId}/events`);
    if (r.ok) setEvents(await r.json());
  }
  useEffect(()=>{ load(); },[matchId]);

  function addRow(): void { setRows([...rows, { playerId: roster[0]?.id || '', eventType: 'GOAL', minute: 0 }]); }
  function upd(i:number, patch: Partial<typeof rows[number]>): void { const n=[...rows]; Object.assign(n[i], patch); setRows(n); }

  async function saveScore(): Promise<void> {
    const r = await fetch(`/api/matches/${matchId}/result`, { method:'POST', headers:{'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{})}, body: JSON.stringify({ scoreHome, scoreAway })});
    const j = await r.json(); if (!r.ok) setMsg(j.error); else { setMsg(`Score saved ${j.scoreHome}-${j.scoreAway} ✓`); onSaved?.(); }
  }
  async function saveEvents(): Promise<void> {
    if (!rows.length) return;
    const r = await fetch(`/api/matches/${matchId}/events`, { method:'POST', headers:{'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{})}, body: JSON.stringify(rows)});
    const j = await r.json(); if (!r.ok) setMsg(j.error); else { setMsg(`Logged ${j.length} events ✓`); setRows([]); load(); }
  }

  return (
    <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:14, padding:16, display:'grid', gap:12, maxWidth:560 }}>
      <div style={{ fontWeight:800, fontSize:14 }}>Match Center — Score & Events</div>
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <label style={lbl}>Home<input type="number" min={0} value={scoreHome} onChange={(e)=> setScoreHome(Number(e.target.value))} style={inp}/></label>
        <span style={{ fontWeight:800 }}>—</span>
        <label style={lbl}>Away<input type="number" min={0} value={scoreAway} onChange={(e)=> setScoreAway(Number(e.target.value))} style={inp}/></label>
        <button onClick={saveScore} style={btn}>Save Score</button>
      </div>
      <div style={{ fontWeight:700, fontSize:12 }}>Events ({events.length})</div>
      {events.length>0 && <div style={{ fontSize:11, color:'#6b7280', maxHeight:80, overflow:'auto' }}>{events.map((e:Record<string,unknown>)=> `${e.minute}' ${e.eventType} — ${(e as {player?:{name:string}}).player?.name || e.playerId}`).join(' · ')}</div>}
      <div style={{ display:'grid', gap:6 }}>
        {rows.map((r,i)=>(
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 130px 90px 30px', gap:6, alignItems:'center' }}>
            <select value={r.playerId} onChange={(e)=> upd(i,{playerId:e.target.value})} style={inp}>
              {roster.map((p)=> <option key={p.id} value={p.id}>{p.name} {p.jerseyNumber?`#${p.jerseyNumber}`:''}</option>)}
            </select>
            <select value={r.eventType} onChange={(e)=> upd(i,{eventType:e.target.value as never})} style={inp}>
              <option value="GOAL">GOAL</option><option value="ASSIST">ASSIST</option><option value="YELLOW_CARD">YELLOW</option><option value="RED_CARD">RED</option>
            </select>
            <input type="number" min={0} max={90} value={r.minute} onChange={(e)=> upd(i,{minute:Number(e.target.value)})} style={inp} placeholder="min"/>
            <button onClick={()=> setRows(rows.filter((_,k)=>k!==i))} style={{...btn, background:'#ef4444'}}>×</button>
          </div>
        ))}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={addRow} style={{...btn, background:'white', color:'#16a34a', border:'1px solid #16a34a'}}> + Add Event</button>
          <button onClick={saveEvents} disabled={!rows.length} style={btn}>Log Events</button>
        </div>
      </div>
      {msg && <div style={{ fontSize:12, color: msg.includes('✓')?'#16a34a':'#dc2626'}}>{msg}</div>}
    </div>
  );
};
const lbl: React.CSSProperties = { display:'grid', gap:4, fontSize:12, fontWeight:600 };
const inp: React.CSSProperties = { padding:'7px 8px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:13 };
const btn: React.CSSProperties = { padding:'8px 12px', borderRadius:8, background:'#16a34a', color:'white', border:'none', fontWeight:700, cursor:'pointer' };
export default MatchCenter;