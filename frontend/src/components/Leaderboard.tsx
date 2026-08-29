import React, { useEffect, useState } from 'react';
import PlayerCard from './PlayerCard';

type Entry = { id:string; name:string; photoUrl?:string|null; jerseyNumber?:number|null; primaryPosition:string; secondaryPosition?:string|null; heightCm?:number|null; weightKg?:number|null; preferredFoot?:string|null; overallRating?:number|null; goals:number; assists:number; appearances:number };
type Data = { topScorers:Entry[]; assistLeaders:Entry[]; attendanceLeaders:Entry[]; teamOverview:{ totalMatches:number; completed:number; wins:number; draws:number; losses:number; winRate:number; totalGoalsScored:number; totalConceded:number; goalDifference:number; form:string[] } };

export const Leaderboard: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<'scorers'|'assists'|'attendance'>('scorers');

  useEffect(()=>{ fetch('/api/stats/leaderboard').then((r)=>r.json()).then(setData); },[]);

  if (!data) return <div style={{ padding:16, color:'#6b7280' }}>Loading leaderboard…</div>;
  const list = tab==='scorers'? data.topScorers : tab==='assists'? data.assistLeaders : data.attendanceLeaders;
  const metric = tab==='scorers'? 'goals' : tab==='assists'? 'assists' : 'appearances';

  return (
    <div style={{ display:'grid', gap:14, maxWidth:900, fontFamily:'Inter,system-ui,sans-serif' }}>
      <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:14, padding:14, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        <Stat label="Matches" value={data.teamOverview.completed} sub={`${data.teamOverview.totalMatches} total`} />
        <Stat label="Win Rate" value={`${data.teamOverview.winRate}%`} sub={`${data.teamOverview.wins}W ${data.teamOverview.draws}D ${data.teamOverview.losses}L`} />
        <Stat label="Goals" value={data.teamOverview.totalGoalsScored} sub={`conceded ${data.teamOverview.totalConceded} · GD ${data.teamOverview.goalDifference>=0?'+':''}${data.teamOverview.goalDifference}`} />
        <Stat label="Form (last 5)" value={data.teamOverview.form.join(' ') || '—'} sub="W/D/L" />
      </div>

      <div style={{ display:'flex', gap:8 }}>
        {(['scorers','assists','attendance'] as const).map((t)=>(
          <button key={t} onClick={()=> setTab(t)} style={{ padding:'7px 12px', borderRadius:999, border:`1px solid ${tab===t?'#16a34a':'#e5e7eb'}`, background:tab===t?'#16a34a':'white', color:tab===t?'white':'#374151', fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'capitalize' }}>{t==='scorers'?'Top Scorers':t==='assists'?'Playmakers':'Attendance'}</button>
        ))}
      </div>

      <div style={{ display:'grid', gap:10 }}>
        {list.length===0? <div style={{ color:'#9ca3af', fontSize:13 }}>No data yet — log match results & events.</div> : list.map((p,i)=>(
          <div key={p.id} style={{ display:'flex', gap:12, alignItems:'center', background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:10 }}>
            <div style={{ width:36, height:36, borderRadius:999, display:'grid', placeItems:'center', fontWeight:800, color:'white', background: i===0?'#d4af37':i===1?'#9ca3af':i===2?'#b45309':'#e5e7eb', flexShrink:0 }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉': i+1}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>{p.name} <span style={{ color:'#6b7280', fontWeight:400 }}>#{p.jerseyNumber||'-'} {p.primaryPosition}</span></div>
              <div style={{ fontSize:11, color:'#6b7280' }}>{(p as Entry)[metric]} {metric} · {p.appearances} apps</div>
            </div>
            <div style={{ textAlign:'right' }}><span style={{ fontWeight:800, fontSize:18 }}>{(p as Entry)[metric]}</span><div style={{ fontSize:10, color:'#6b7280', fontWeight:700, letterSpacing:.5 }}>{metric.toUpperCase()}</div></div>
          </div>
        ))}
      </div>

      {list[0] && (
        <div style={{ background:'#f9fafb', border:'1px dashed #e5e7eb', borderRadius:12, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:12, marginBottom:8, color:'#374151' }}>Live Player Card — Leader #{metric}</div>
          <PlayerCard
            name={list[0].name}
            photoUrl={list[0].photoUrl}
            jerseyNumber={list[0].jerseyNumber}
            heightCm={list[0].heightCm}
            weightKg={list[0].weightKg}
            preferredFoot={list[0].preferredFoot}
            primaryPosition={list[0].primaryPosition}
            secondaryPosition={list[0].secondaryPosition}
            overallRating={list[0].overallRating}
            stats={{ goals: list[0].goals, assists: list[0].assists, appearances: list[0].appearances }}
          />
        </div>
      )}
    </div>
  );
};

function Stat({ label, value, sub }: { label:string; value:string|number; sub?:string }): React.ReactElement {
  return <div style={{ textAlign:'center' }}><div style={{ fontSize:11, fontWeight:700, letterSpacing:.6, color:'#6b7280' }}>{label}</div><div style={{ fontSize:18, fontWeight:900 }}>{value}</div>{sub && <div style={{ fontSize:10, color:'#9ca3af' }}>{sub}</div>}</div>;
}
export default Leaderboard;