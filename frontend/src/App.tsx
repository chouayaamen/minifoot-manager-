import { useEffect, useState } from 'react';
import PlayerCard from './components/PlayerCard';
import PitchBoard from './components/PitchBoard';
import MatchForm from './components/MatchForm';
import RsvpCard from './components/RsvpCard';
import MatchCenter from './components/MatchCenter';
import Leaderboard from './components/Leaderboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EditProfile from './pages/EditProfile';
import CommentBoard from './components/CommentBoard';
import InvitesPanel from './components/InvitesPanel';

type Tab = 'roster'|'pitch'|'fixtures'|'center'|'board'|'profile'|'friends';

export default function App() {
  const [tab, setTab] = useState<Tab>('roster');
  const [token, setToken] = useState<string>(() => localStorage.getItem('token') || '');
  const [authPage, setAuthPage] = useState<'login'|'register'>('login');
  const [me, setMe] = useState<Record<string,unknown> | null>(() => {
    try { const s = localStorage.getItem('me'); return s? JSON.parse(s): null; } catch { return null; }
  });
  const [justRegistered, setJustRegistered] = useState(false);
  const [players, setPlayers] = useState<Record<string,unknown>[]>([]);
  const [matches, setMatches] = useState<Record<string,unknown>[]>([]);
  const [activeMatch, setActiveMatch] = useState<string>('');
  const [isInvited, setIsInvited] = useState<boolean>(false);
  const [friendQ, setFriendQ] = useState('');
  const [friendResults, setFriendResults] = useState<Record<string,unknown>[]>([]);
  const [friendMsg, setFriendMsg] = useState<string | null>(null);
  const [friends, setFriends] = useState<Record<string,unknown>[]>([]);
  const [pendingOut, setPendingOut] = useState<Record<string,unknown>[]>([]);
  const [pendingIn, setPendingIn] = useState<Record<string,unknown>[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [invites, setInvites] = useState<Record<string,unknown>[]>([]);

  useEffect(()=>{ if(token) localStorage.setItem('token', token); else localStorage.removeItem('token'); },[token]);
  useEffect(()=>{ if(me) localStorage.setItem('me', JSON.stringify(me)); else localStorage.removeItem('me'); },[me]);
  useEffect(()=>{ if(token && !me) { fetch('/api/auth/me', { headers:{ Authorization:`Bearer ${token}` }}).then((r)=> r.ok? r.json(): null).then((j)=> j && setMe(j)); } },[]);
  useEffect(()=>{ const role = (me as {role?:string})?.role; if(token && role !== 'manager') { fetch('/api/invites/status', { headers:{ Authorization:`Bearer ${token}` }}).then((r)=> r.ok? r.json(): null).then((j)=> j && setIsInvited(!!j.isInvited)); } else if(role==='manager') setIsInvited(true); },[token, me]);

  function handleAuthed(t: string, user: Record<string, unknown>): void {
    const isNew = !token;
    setToken(t); setMe(user);
    if (isNew) { setJustRegistered(true); setTab('profile'); }
  }
  async function loadPlayers(): Promise<void> {
    const r = await fetch('/api/players'); setPlayers(await r.json());
  }
  async function loadMatches(): Promise<void> {
    const r = await fetch('/api/matches'); const j=await r.json(); setMatches(j); if(j[0] && !activeMatch) setActiveMatch(j[0].id as string);
  }
  async function loadFriends(): Promise<void> {
    if(!token) return;
    const r = await fetch('/api/friends', { headers:{ Authorization:`Bearer ${token}` }});
    if(r.ok){ const j=await r.json(); setFriends(j.friends); setPendingOut(j.pendingOut); setPendingIn(j.pendingIn); }
  }
  async function loadInvites(): Promise<void> {
    if(!token) return;
    const r = await fetch('/api/invites/me', { headers:{ Authorization:`Bearer ${token}` }});
    if(r.ok){ const j=await r.json(); setInvites(j.invites); if(j.isInvited) setIsInvited(true); }
  }
  function friendStatus(email: string): { label: string; disabled: boolean; action?: string; removeId?: string } {
    const fr = friends.find((f)=> (f as {email:string; requestId:string}).email===email) as unknown as {requestId:string}|undefined;
    if (fr) return { label: 'Friends ✓', disabled: true, removeId: fr.requestId };
    const out = (pendingOut as unknown as {id:string; addressee:{email:string}}[]).find((p)=> p.addressee?.email===email);
    if (out) return { label: 'Request Sent', disabled: true, removeId: out.id };
    const incoming = (pendingIn as unknown as {id:string; requester:{email:string}}[]).find((p)=> p.requester?.email===email);
    if (incoming) return { label: 'Accept Request', disabled: false, action: incoming.id };
    return { label: 'Send Request', disabled: false };
  }
  useEffect(()=>{ loadPlayers(); loadMatches(); loadFriends(); loadInvites(); },[token]);

  const rosterForBoard = players.map((p)=> ({ id: p.id as string, name: p.name as string, photoUrl: p.photoUrl as string, primaryPosition: p.primaryPosition as string, jerseyNumber: p.jerseyNumber as number, overallRating: p.overallRating as number }));
  const fixture = matches.find((m)=> m.id===activeMatch) as unknown as { opponent:string; matchDate:string; venue:string; formatType:string } | undefined;

  if (!token) {
    return authPage==='login'
      ? <LoginPage onAuthed={handleAuthed} switchToRegister={()=> setAuthPage('register')} />
      : <RegisterPage onAuthed={handleAuthed} switchToLogin={()=> setAuthPage('login')} />;
  }

  const isManager = (me as {role?:string})?.role === 'manager';
  const canSeeAll = isManager || isInvited;

  if (!canSeeAll) {
    return (
      <div style={{ minHeight:'100vh', background:'#f3f4f6' }}>
        <header style={{ background:'#111827', color:'white', padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <b>⚽ Mini-Foot Manager</b>
          <button onClick={()=>{ setToken(''); localStorage.removeItem('token'); setMe(null); localStorage.removeItem('me');}} style={btnSm}>Logout</button>
        </header>
        <main style={{ maxWidth:600, margin:'24px auto', padding:'0 14px', display:'grid', gap:16 }}>
          <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:12, padding:14, textAlign:'center' }}>
            <div style={{ fontWeight:800 }}>Waiting for manager invite — Friends & Invites below</div>
            <div style={{ fontSize:12, color:'#92400e', marginTop:4 }}>Add friends or wait for email invite to unlock roster & pitch.</div>
          </div>
          <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:12, display:'grid', gap:8 }}>
            <div style={{ fontWeight:800, fontSize:13, color:'#92400e' }}>📩 Your Invitations — Accept to unlock</div>
            {invites.length===0 ? <div style={{ fontSize:12, color:'#9ca3af' }}>No invites yet — ask a manager to invite you by email.</div> : invites.filter((x)=> (x as {status:string}).status==='pending').length===0 ? <div style={{ fontSize:12, color:'#16a34a' }}>No pending invites — you may have already accepted.</div> : invites.filter((x)=> (x as {status:string}).status==='pending').map((inv)=>(
              <div key={inv.id as string} style={{ display:'flex', gap:8, alignItems:'center', background:'#f9fafb', padding:'8px 10px', borderRadius:8, fontSize:12, border:'1px solid #fde68a' }}>
                <span>From <b>{(inv as {manager:{name:string}}).manager?.name}</b> ({(inv as {manager:{email:string}}).manager?.email})</span>
                <button onClick={async ()=>{
                  const r = await fetch(`/api/invites/${inv.id as string}/accept`, { method:'POST', headers:{ Authorization:`Bearer ${token}` }});
                  if(r.ok){ setIsInvited(true); loadInvites(); }
                }} style={{ marginLeft:'auto', ...btnSm, background:'#16a34a', padding:'8px 14px', fontSize:13 }}>Accept Invitation</button>
              </div>
            ))}
          </div>
          <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:12, display:'grid', gap:8 }}>
            <div style={{ fontWeight:700, fontSize:12 }}>Find Friends — add friends to get invited faster</div>
            <div style={{ display:'flex', gap:6 }}>
              <input value={friendQ} onChange={(e)=> setFriendQ(e.target.value)} placeholder="Search by name/email…" style={{ ...inp, flex:1 }} />
              <button onClick={async ()=>{
                const r = await fetch(`/api/friends/users?q=${encodeURIComponent(friendQ)}`, { headers:{ Authorization:`Bearer ${token}` }});
                if(r.ok) setFriendResults(await r.json());
              }} style={btnSm}>Search</button>
            </div>
            {friendResults.filter((u)=> (u.email as string) !== (me as {email?:string})?.email).slice(0,5).map((u)=>{
              const st = friendStatus(u.email as string);
              return (
                <div key={u.id as string} style={{ display:'flex', gap:6, alignItems:'center', background:'#f9fafb', padding:'6px 8px', borderRadius:8, fontSize:12 }}>
                  <span>{u.name as string} · {u.email as string}</span>
                  <button onClick={async ()=>{
                    if(st.label==='Send Request'){
                      const r = await fetch('/api/friends/request', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ email: u.email })});
                      if(r.ok) loadFriends();
                    }
                  }} style={{ marginLeft:'auto', ...btnSm, background:'#111827' }}>{st.label}</button>
                </div>
              );
            })}
          </div>
          <EditProfile token={token} onSaved={()=> loadPlayers()} />
          <button onClick={()=> fetch('/api/invites/status', { headers:{ Authorization:`Bearer ${token}` }}).then((r)=> r.json()).then((j)=> setIsInvited(!!j.isInvited))} style={btn}>Check invite status — unlock</button>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6' }}>
      <header style={{ background:'#111827', color:'white', padding:'12px 18px', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <b>⚽ Mini-Foot Manager</b>
        <nav style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {(['roster','pitch','fixtures','center','board','profile','friends'] as Tab[]).map((t)=>(
            <button key={t} onClick={()=> setTab(t)} style={{ padding:'6px 10px', borderRadius:999, border:'1px solid #374151', background: tab===t?'#16a34a':'transparent', color:'white', fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'capitalize' }}>{t==='profile'?'Edit Profile':t}</button>
          ))}
        </nav>
        <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
          {me && <span style={{ fontSize:11, padding:'4px 8px', borderRadius:999, background: isManager?'#16a34a':'#374151', color:'white', fontWeight:700 }}>{isManager?'MANAGER':'PLAYER'}</span>}
          {!token ? <>
            <button onClick={()=> setAuthPage('login')} style={{...btnSm, background: authPage==='login'?'#16a34a':'white', color: authPage==='login'?'white':'#111827'}}>Login</button>
            <button onClick={()=> setAuthPage('register')} style={{...btnSm, background: authPage==='register'?'#16a34a':'white', color: authPage==='register'?'white':'#111827'}}>Register</button>
          </> : <>
            <span style={{ fontSize:12, color:'#9ca3af' }}>{(me as {email?:string})?.email || 'logged in'}</span>
            <button onClick={()=>{ setToken(''); localStorage.removeItem('token'); setMe(null); localStorage.removeItem('me');}} style={btnSm}>Logout</button>
          </>}
        </div>
      </header>

      <main style={{ maxWidth:1100, margin:'18px auto', padding:'0 14px', display:'grid', gap:16 }}>
        {tab==='roster' && (
          <div style={{ display:'grid', gap:12 }}>
            <h2 style={{ margin:0 }}>Roster — FUT Cards (live stats)</h2>
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'8px 10px', fontSize:12, color:'#166534' }}>Find & invite friends in the <b>Friends</b> tab — or use quick Add per card below.</div>
            {players.length===0? <span style={{ color:'#6b7280' }}>No players — login & create profile via POST /api/players/profile</span> :
              <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                {players.map((p)=>{
                  const isOwn = (p as {user?:{email:string}}).user?.email === (me as {email?:string})?.email;
                  const email = (p as {user?:{email:string}}).user?.email as string;
                  const st = email ? friendStatus(email) : { label:'Send Request', disabled:false } as never;
                  return (
                    <div key={p.id as string} style={{ display:'grid', gap:6, justifyItems:'center' }}>
                      <PlayerCard name={p.name as string} photoUrl={p.photoUrl as string} jerseyNumber={p.jerseyNumber as number} heightCm={p.heightCm as number} weightKg={p.weightKg as number} preferredFoot={p.preferredFoot as string} primaryPosition={p.primaryPosition as string} secondaryPosition={p.secondaryPosition as string} overallRating={p.overallRating as number} stats={p.stats as {goals:number;assists:number;appearances:number}} />
                      {!isOwn && email && (
                        <div style={{ display:'flex', gap:4, width:'100%' }}>
                          <button disabled={(st as {disabled:boolean}).disabled && (st as {label:string}).label!=='Accept Request'} onClick={async ()=>{
                            if((st as {label:string}).label==='Accept Request' && (st as {action?:string}).action){
                              const r = await fetch(`/api/friends/${(st as {action:string}).action}/accept`, { method:'POST', headers:{ Authorization:`Bearer ${token}`}});
                              const j = await r.json(); alert(r.ok?'Accepted ✓': j.error); if(r.ok) loadFriends();
                            } else if((st as {label:string}).label==='Send Request'){
                              const r = await fetch('/api/friends/request', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ email })});
                              const j = await r.json(); alert(r.ok?'Friend request sent ✓': j.error); if(r.ok) loadFriends();
                            }
                          }} style={{ flex:1, ...btnSm, background: (st as {label:string}).label==='Friends ✓'?'#16a34a': (st as {label:string}).label==='Request Sent'?'#9ca3af': (st as {label:string}).label==='Accept Request'?'#16a34a':'#111827', opacity: (st as {disabled:boolean}).disabled && (st as {label:string}).label!=='Accept Request' ? 0.7 : 1 }}>{(st as {label:string}).label}</button>
                          {(st as {removeId?:string}).removeId && <button onClick={async ()=>{
                            const rid = (st as {removeId:string}).removeId;
                            const isPending = (st as {label:string}).label==='Request Sent';
                            const url = isPending ? `/api/friends/${rid}/cancel` : `/api/friends/${rid}`;
                            const method = isPending ? 'POST' : 'DELETE';
                            const r = await fetch(url, { method, headers:{ Authorization:`Bearer ${token}` }});
                            const j = await r.json(); alert(r.ok?'Removed ✓': j.error); if(r.ok) loadFriends();
                          }} style={{ ...btnSm, background:'#dc2626' }}>Remove</button>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>}
            <button onClick={loadPlayers} style={btn}>Refresh Roster</button>
          </div>
        )}

        {tab==='pitch' && (
          <div style={{ display:'grid', gap:16 }}>
            <div>
              <h2 style={{ margin:'0 0 8px' }}>Tactical Pitch Board { !isManager && <span style={{ fontSize:12, color:'#6b7280', fontWeight:400 }}>— read-only (manager only)</span>}</h2>
              <div style={{ marginBottom:8, display:'flex', gap:8, alignItems:'center' }}>
                <select value={activeMatch} onChange={(e)=> setActiveMatch(e.target.value)} style={inp}>
                  <option value="">— select match for lineup save —</option>
                  {matches.map((m)=> <option key={m.id as string} value={m.id as string}>{m.opponent as string} · {m.formatType as string}</option>)}
                </select>
                <button onClick={loadMatches} style={btnSm}>Reload</button>
              </div>
              {!isManager && <div style={{ background:'#fef3c7', border:'1px solid #fde68a', color:'#92400e', padding:'8px 10px', borderRadius:8, fontSize:12, marginBottom:8 }}>Only managers can edit lineups. You have view access to final results.</div>}
              <PitchBoard
                matchId={activeMatch || 'demo'}
                roster={rosterForBoard}
                guests={[]}
                fixture={fixture}
                teamName="Mini-Foot XI"
                readOnly={!isManager}
                onSave={isManager ? async (data)=>{
                  if(!activeMatch) return alert('Select a match first');
                  const r=await fetch(`/api/matches/${activeMatch}/lineup`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(data)});
                  alert(r.ok? 'Lineup saved ✓' : (await r.json()).error);
                } : undefined}
                onAddGuest={isManager ? async (name,pos)=>{
                  if(!activeMatch) return alert('Select a match first');
                  const r=await fetch(`/api/matches/${activeMatch}/guests`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ name, assignedPosition: pos })});
                  alert(r.ok? 'Guest added' : (await r.json()).error);
                } : undefined}
              />
            </div>
            <CommentBoard token={token} isManager={isManager} />
          </div>
        )}

        {tab==='fixtures' && (
          <div style={{ display:'grid', gap:16 }}>
            <h2 style={{ margin:0 }}>Fixtures & RSVP { !isManager && <span style={{ fontSize:12, color:'#6b7280' }}>— RSVP only</span>}</h2>
            {isManager ? <MatchForm token={token} onCreated={()=> loadMatches()} /> : <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:12, color:'#6b7280', fontSize:12 }}>Only managers can create fixtures. Browse matches below and RSVP.</div>}
            <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
              <b style={{ fontSize:13 }}>Upcoming & Past Matches</b>
              <div style={{ display:'grid', gap:6, marginTop:8 }}>
                {matches.map((m)=>(
                  <div key={m.id as string} style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 10px', background:'#f9fafb', borderRadius:8, fontSize:12 }}>
                    <span><b>{m.opponent as string}</b> {m.formatType as string} {new Date(m.matchDate as string).toLocaleDateString()} {(m as {clash?:{clash:boolean}}).clash?.clash? '⚠️ clash':''} — {(m as {rsvpCounts?:{total:number}}).rsvpCounts?`RSVPs ${ (m as {rsvpCounts:{total:number}}).rsvpCounts.total}`:''}</span>
                    <button onClick={()=> setActiveMatch(m.id as string)} style={{ marginLeft:'auto', ...btnSm, background: activeMatch===m.id?'#16a34a':'#111827' }}>{activeMatch===m.id?'Active':'Select'}</button>
                  </div>
                ))}
              </div>
            </div>
            {activeMatch && <RsvpCard matchId={activeMatch} token={token} />}
          </div>
        )}

        {tab==='center' && (
          <div style={{ display:'grid', gap:16 }}>
            <h2 style={{ margin:0 }}>Match Center — Score & Events { !isManager && <span style={{ fontSize:12, color:'#6b7280' }}>— manager only</span>}</h2>
            {!activeMatch? <span style={{ color:'#6b7280' }}>Select a fixture in Fixtures tab first.</span> :
              isManager ? <MatchCenter matchId={activeMatch} token={token} roster={rosterForBoard.map((r)=> ({ id:r.id, name:r.name, jerseyNumber:r.jerseyNumber }))} onSaved={()=> loadMatches()} />
              : <div style={{ background:'#fef3c7', border:'1px solid #fde68a', color:'#92400e', padding:'12px', borderRadius:10, fontSize:12 }}>Only managers can log scores and events. View results in Leaderboard.</div>}
          </div>
        )}

        {tab==='board' && (
          <div>
            <h2 style={{ margin:'0 0 8px' }}>Leaderboard — Squad Analytics</h2>
            <Leaderboard />
          </div>
        )}

        {tab==='profile' && (
          <div style={{ display:'grid', gap:16 }}>
            <h2 style={{ margin:0 }}>Edit Profile {justRegistered && <span style={{ color:'#16a34a', fontSize:12, fontWeight:600 }}>— Welcome! Complete your profile</span>}</h2>
            <EditProfile token={token} onSaved={()=> { setJustRegistered(false); loadPlayers(); }} />
            <InvitesPanel token={token} isManager={isManager} />
          </div>
        )}

        {tab==='friends' && (
          <div style={{ display:'grid', gap:16 }}>
            <h2 style={{ margin:0 }}>Friends — Find & Invite</h2>
            <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:12, display:'grid', gap:8 }}>
              <div style={{ fontWeight:800, fontSize:13, color: isManager ? '#111827' : '#92400e' }}>{isManager ? '📤 Sent Invitations' : '📩 Your Invitations — accept to unlock'}</div>
              {invites.length===0 ? <div style={{ fontSize:12, color:'#9ca3af' }}>{isManager ? 'No invites sent yet — invite friends via checkboxes below.' : 'No invites yet — add friends or ask manager to invite by email.'}</div>
                : invites.filter((x)=> (x as {status:string}).status==='pending').length===0 ? <div style={{ fontSize:12, color:'#16a34a' }}>No pending invitations.</div>
                : invites.filter((x)=> (x as {status:string}).status==='pending').map((inv)=>(
                  <div key={inv.id as string} style={{ display:'flex', gap:8, alignItems:'center', background:'#f9fafb', padding:'8px 10px', borderRadius:8, fontSize:12, border:'1px solid #fde68a' }}>
                    <span>From <b>{(inv as {manager:{name:string}}).manager?.name}</b> ({(inv as {manager:{email:string}}).manager?.email})</span>
                    {!isManager && <button onClick={async ()=>{
                      const r = await fetch(`/api/invites/${inv.id as string}/accept`, { method:'POST', headers:{ Authorization:`Bearer ${token}` }});
                      if(r.ok){ setIsInvited(true); loadInvites(); }
                    }} style={{ marginLeft:'auto', ...btnSm, background:'#16a34a' }}>Accept</button>}
                    {!isManager && <button onClick={async ()=>{
                      const r = await fetch(`/api/invites/${inv.id as string}/decline`, { method:'POST', headers:{ Authorization:`Bearer ${token}` }});
                      if(r.ok) loadInvites();
                    }} style={{ ...btnSm, background:'#6b7280' }}>Decline</button>}
                  </div>
                ))}
            </div>
            <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:12, display:'grid', gap:8 }}>
              <div style={{ fontWeight:700, fontSize:12 }}>Find Friends — search by name or email</div>
              <div style={{ display:'flex', gap:6 }}>
                <input value={friendQ} onChange={(e)=> setFriendQ(e.target.value)} placeholder="Search users…" style={{ ...inp, flex:1 }} />
                <button onClick={async ()=> {
                  const r = await fetch(`/api/friends/users?q=${encodeURIComponent(friendQ)}`, { headers:{ Authorization:`Bearer ${token}` }});
                  if(r.ok) setFriendResults(await r.json()); else setFriendMsg('Search failed');
                }} style={btnSm}>Search</button>
              </div>
              {friendResults.filter((u)=> (u.email as string) !== (me as {email?:string})?.email).length>0 && (
                <div style={{ display:'grid', gap:6 }}>
                  {friendResults.filter((u)=> (u.email as string) !== (me as {email?:string})?.email).map((u)=>{
                    const st = friendStatus(u.email as string);
                    return (
                      <div key={u.id as string} style={{ display:'flex', gap:6, alignItems:'center', background:'#f9fafb', padding:'6px 8px', borderRadius:8, fontSize:12 }}>
                        <span>{u.name as string} · {u.email as string} ({u.role as string})</span>
                        <button disabled={st.disabled && st.label!=='Accept Request'} onClick={async ()=>{
                          if(st.label==='Accept Request' && st.action){
                            const r = await fetch(`/api/friends/${st.action}/accept`, { method:'POST', headers:{ Authorization:`Bearer ${token}`}});
                            const j = await r.json(); setFriendMsg(r.ok?'Accepted ✓': j.error); if(r.ok) loadFriends();
                          } else if(st.label==='Send Request'){
                            const r = await fetch('/api/friends/request', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ email: u.email })});
                            const j = await r.json(); setFriendMsg(r.ok?'Friend request sent ✓': j.error); if(r.ok) loadFriends();
                          }
                        }} style={{ marginLeft:'auto', ...btnSm, background: st.label==='Friends ✓'?'#16a34a': st.label==='Request Sent'?'#9ca3af': st.label==='Accept Request'?'#16a34a':'#111827', opacity: st.disabled && st.label!=='Accept Request' ? 0.7 : 1 }}>{st.label}</button>
                        {st.removeId && <button onClick={async ()=>{
                          const isPending = st.label==='Request Sent';
                          const url = isPending ? `/api/friends/${st.removeId}/cancel` : `/api/friends/${st.removeId}`;
                          const method = isPending ? 'POST' : 'DELETE';
                          const r = await fetch(url, { method, headers:{ Authorization:`Bearer ${token}` }});
                          const j = await r.json(); setFriendMsg(r.ok?'Removed ✓': j.error); if(r.ok) loadFriends();
                        }} style={{ ...btnSm, background:'#dc2626' }}>Remove</button>}
                      </div>
                    );
                  })}
                </div>
              )}
              {friendMsg && <div style={{ fontSize:12, color: friendMsg.includes('✓')?'#16a34a':'#dc2626' }}>{friendMsg}</div>}
            </div>

            <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:12, display:'grid', gap:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:700, fontSize:12 }}>Your Friends ({friends.length}) — select to invite</span>
                {isManager && <button disabled={selectedFriends.size===0} onClick={async ()=>{
                  let ok=0; for(const email of selectedFriends){
                    const r = await fetch('/api/invites', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ email })});
                    if(r.ok) ok++;
                  }
                  setFriendMsg(ok? `Invited ${ok} friend(s) ✓` : 'No invites sent'); setSelectedFriends(new Set());
                }} style={{ ...btnSm, background: selectedFriends.size? '#16a34a':'#9ca3af', opacity: selectedFriends.size?1:0.6 }}>Invite Selected ({selectedFriends.size})</button>}
              </div>
              {!isManager && <div style={{ fontSize:11, color:'#6b7280' }}>Only managers can invite friends to the team.</div>}
              {friends.length===0 ? <span style={{ fontSize:12, color:'#9ca3af' }}>No friends yet — search above to add.</span> : friends.map((f)=> {
                const email = (f as {email:string}).email;
                const checked = selectedFriends.has(email);
                return (
                  <label key={(f as {id:string}).id} style={{ display:'flex', gap:8, alignItems:'center', background: checked?'#f0fdf4':'#f9fafb', padding:'6px 8px', borderRadius:8, fontSize:12, border: checked?'1px solid #86efac':'1px solid transparent', cursor:'pointer' }}>
                    <input type="checkbox" checked={checked} onChange={(e)=>{
                      const ns = new Set(selectedFriends);
                      if(e.target.checked) ns.add(email); else ns.delete(email);
                      setSelectedFriends(ns);
                    }} disabled={!isManager} />
                    <span>{(f as {name:string}).name} · {email}</span>
                    <button onClick={async (e)=>{ e.preventDefault(); const fr = friends.find((x)=> (x as {email:string}).email===email) as unknown as {requestId:string}; if(!fr?.requestId) return; const r = await fetch(`/api/friends/${fr.requestId}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` }}); if(r.ok) loadFriends(); }} style={{ marginLeft:'auto', ...btnSm, background:'#dc2626', padding:'3px 6px', fontSize:10 }}>Remove</button>
                  </label>
                );
              })}
            </div>

            <InvitesPanel token={token} isManager={isManager} />
          </div>
        )}
      </main>
      <footer style={{ textAlign:'center', padding:'18px 0', color:'#9ca3af', fontSize:12 }}>Backend :5000 · Frontend :5173 · Vite proxy /api → :5000</footer>
    </div>
  );
}
const inp: React.CSSProperties = { padding:'7px 10px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:12 };
const btn: React.CSSProperties = { padding:'8px 12px', borderRadius:8, background:'#16a34a', color:'white', border:'none', fontWeight:700, cursor:'pointer' };
const btnSm: React.CSSProperties = { padding:'6px 10px', borderRadius:8, background:'#16a34a', color:'white', border:'none', fontWeight:700, fontSize:12, cursor:'pointer' };