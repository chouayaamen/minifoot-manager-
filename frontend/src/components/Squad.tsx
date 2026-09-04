import React, { useEffect, useState, useCallback } from 'react';
import PlayerCard from './PlayerCard';

type Squad = { id: string; name: string; code: string; managerId: string };
type Player = {
  id: string;
  name: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
  heightCm: number | null;
  weightKg: number | null;
  preferredFoot: string | null;
  primaryPosition: string;
  secondaryPosition: string | null;
  overallRating: number | null;
  stats?: { goals: number; assists: number; appearances: number };
  user?: { email: string };
};

type Props = { token: string; isManager: boolean };

export const Roster: React.FC<Props> = ({ token, isManager }) => {
  const [squad, setSquad] = useState<Squad | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [pendingKick, setPendingKick] = useState<Player | null>(null);
  const [showLeave, setShowLeave] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [friends, setFriends] = useState<{ email: string; name: string }[]>([]);
  const [pendingOut, setPendingOut] = useState<{ email: string; id: string }[]>([]);
  const [pendingIn, setPendingIn] = useState<{ email: string; id: string }[]>([]);
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [friendSearchQ, setFriendSearchQ] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState<{ email: string; name: string; id: string }[]>([]);
  const [waiting, setWaiting] = useState<{ id: string; squad?: Squad; squadId: string; player: Player & { user?: { name: string; email: string } } }[]>([]);

  const loadWaiting = useCallback(async () => {
    try {
      const r = await fetch('/api/squad/requests', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const j = await r.json() as { requests: { id: string; squadId: string; squad?: Squad; player: Player & { user?: { name: string; email: string } } }[] }; setWaiting(j.requests || []); }
    } catch { /* ignore */ }
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/squad/roster', { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json() as { squad: Squad | null; players: Player[] };
      setSquad(j.squad);
      setPlayers(j.players || []);
      loadWaiting();
    } catch {
      setMsg('Failed to load roster');
    } finally { setLoading(false); }
  }, [token, loadWaiting]);

  useEffect(() => { load(); const pending = localStorage.getItem('pendingSquadCode'); if (pending) setJoinCode(pending);
    fetch('/api/friends', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.ok?r.json():null).then(j=> {
      if(!j) return;
      setFriends((j.friends||[]).map((f:Record<string,unknown>)=>({email:f.email as string,name:f.name as string})));
      const pouts = (j.pendingOut||[]).map((p:Record<string,unknown>)=> ({ email: (p.email as string) || (p as {addressee?:{email:string}}).addressee?.email || (p as {email:string}).email || '', id: p.id as string })).filter((x:{email:string})=> !!x.email) as {email:string,id:string}[];
      setPendingOut(pouts);
      const pins = (j.pendingIn||[]).map((p:Record<string,unknown>)=> ({ email: (p.email as string) || (p as {requester?:{email:string}}).requester?.email || '', id: p.id as string })).filter((x: {email:string})=> !!x.email);
      setPendingIn(pins);
    });
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.ok?r.json():null).then(j=> j && setCurrentEmail((j.email as string)||''));
  }, [load, token]);

  async function handleCreateSquad(): Promise<void> {
    const r = await fetch('/api/squad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newSquadName || undefined }),
    });
    const j = await r.json();
    if (r.ok) { setMsg('Squad created ✓'); load(); } else setMsg(j.error || 'Create failed');
  }

  async function handleAdd(): Promise<void> {
    if (!email.trim()) return;
    const r = await fetch('/api/squad/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: email.trim() }),
    });
    const j = await r.json() as { error?: string; message?: string };
    if (r.ok) { setMsg(j.message || 'Added to waiting list ✓'); setEmail(''); setAddOpen(false); load(); }
    else setMsg(j.error || 'Add failed');
  }

  async function inviteFriend(em: string): Promise<void> {
    const r = await fetch('/api/squad/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: em }),
    });
    const j = await r.json() as { error?: string; message?: string };
    if (r.ok) { setMsg(j.message || `Invited ${em} → waiting list ✓`); setAddOpen(false); load(); } else setMsg(j.error || 'Invite failed');
  }

  async function handleAccept(id: string): Promise<void> {
    const r = await fetch(`/api/squad/requests/${id}/accept`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json() as { error?: string };
    if (r.ok) { setMsg('Player approved ✓'); load(); } else setMsg(j.error || 'Accept failed');
  }
  async function handleReject(id: string): Promise<void> {
    const r = await fetch(`/api/squad/requests/${id}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json() as { error?: string };
    if (r.ok) { setMsg('Request removed ✓'); load(); } else setMsg(j.error || 'Reject failed');
  }
  async function handleCancel(id: string): Promise<void> {
    const r = await fetch(`/api/squad/requests/${id}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json() as { error?: string };
    if (r.ok) { setMsg('Request canceled ✓'); load(); } else setMsg(j.error || 'Cancel failed');
  }

  async function searchFriendsToAdd(): Promise<void> {
    if (!friendSearchQ.trim()) return;
    const r = await fetch(`/api/friends/users?q=${encodeURIComponent(friendSearchQ)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setFriendSearchResults(await r.json());
  }

  async function reloadFriends(): Promise<void> {
    const rr = await fetch('/api/friends', { headers: { Authorization: `Bearer ${token}` } });
    if (!rr.ok) return;
    const jj = await rr.json() as { friends?: Record<string,unknown>[]; pendingOut?: Record<string,unknown>[]; pendingIn?: Record<string,unknown>[] };
    if (!jj) return;
    setFriends((jj.friends||[]).map((f:Record<string,unknown>)=>({email:f.email as string,name:f.name as string})));
    const pouts = (jj.pendingOut||[]).map((p:Record<string,unknown>)=> ({ email: (p.email as string) || (p as unknown as {addressee:{email:string}}).addressee?.email || '', id: p.id as string })).filter((x:{email:string})=> !!x.email) as {email:string,id:string}[];
    setPendingOut(pouts);
    const pins = (jj.pendingIn||[]).map((p:Record<string,unknown>)=> ({ email: (p.email as string) || (p as unknown as {requester:{email:string}}).requester?.email || '', id: p.id as string })).filter((x:{email:string})=> !!x.email) as {email:string,id:string}[];
    setPendingIn(pins);
  }

  async function addFriend(em: string): Promise<void> {
    const r = await fetch('/api/friends/request', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: em }) });
    const j = await r.json() as { error?: string };
    if (r.ok) {
      setMsg(`Friend request to ${em} ✓`);
      await reloadFriends();
    } else setMsg(j.error || 'Add friend failed');
  }

  function friendBadgeFor(email?: string): { label: string | null; action?: () => void } {
    if (!email) return { label: null };
    if (currentEmail && email.toLowerCase()===currentEmail.toLowerCase()) return { label: 'You' };
    if (friends.some(f=> f.email.toLowerCase()===email.toLowerCase())) return { label: '✓ Friend' };
    const out = pendingOut.find(p=> p.email.toLowerCase()===email.toLowerCase());
    if (out) return { label: 'Cancel Request', action: async ()=> {
      const r = await fetch(`/api/friends/${out.id}/cancel`, { method:'POST', headers:{ Authorization:`Bearer ${token}` }});
      if(r.ok) { setMsg('Request canceled ✓'); await reloadFriends(); } else { const jj=await r.json() as {error?:string}; setMsg(jj.error||'Cancel failed'); }
    }};
    const pend = pendingIn.find(p=> p.email.toLowerCase()===email.toLowerCase());
    if (pend) return { label: 'Accept', action: async ()=> {
      const r = await fetch(`/api/friends/${pend.id}/accept`, { method:'POST', headers:{ Authorization:`Bearer ${token}` }});
      if(r.ok) { setMsg('Request accepted ✓'); await reloadFriends(); } else { const jj=await r.json() as {error?:string}; setMsg(jj.error||'Accept failed'); }
    }};
    return { label: null };
  }

  async function handleRemove(): Promise<void> {
    if (!pendingKick) return;
    const r = await fetch(`/api/squad/players/${pendingKick.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await r.json();
    if (r.ok) { setMsg('Removed from squad ✓'); setPendingKick(null); load(); }
    else setMsg(j.error || 'Remove failed');
  }

  async function handleJoin(): Promise<void> {
    if (!joinCode.trim()) return;
    const r = await fetch('/api/squad/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
    });
    const j = await r.json() as { error?: string; message?: string };
    if (r.ok) { setMsg(j.message || 'Joined squad ✓'); setJoinCode(''); localStorage.removeItem('pendingSquadCode'); load(); }
    else setMsg(j.error || 'Join failed');
  }

  async function handleLeave(): Promise<void> {
    const r = await fetch('/api/squad/leave', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json() as { error?: string };
    if (r.ok) { setMsg('Left squad ✓'); setShowLeave(false); load(); } else setMsg(j.error || 'Leave failed');
  }

  async function handleRegenerate(): Promise<void> {
    const r = await fetch('/api/squad/regenerate-code', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    if (r.ok) { setMsg(`New code: ${j.code}`); load(); } else setMsg(j.error || 'Failed');
  }

  if (loading) return <div style={{ padding: 16, color: '#6b7280' }}>Loading squad roster…</div>;

  return (
    <section aria-label="Squad section" style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:16, padding:20, display:'grid', gap:12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Squad</h2>
        <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, background: squad ? '#dcfce7' : '#fef2f2', color: squad ? '#166534' : '#991b1b', border: `1px solid ${squad ? '#86efac' : '#fecaca'}` }}>
          {squad ? `${squad.name} · Code: ${squad.code}` : 'No active squad'}
        </span>
        <button onClick={load} style={btnSm}>Refresh</button>
      </div>

      {squad && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12 }}><b>Squad Code:</b> <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6, fontWeight: 800, letterSpacing: 1 }}>{squad.code}</code> — share to invite players</span>
          <button onClick={() => { navigator.clipboard.writeText(squad.code); setMsg('Code copied ✓'); }} style={btnSm}>Copy Code</button>
          {isManager && <button onClick={handleRegenerate} style={{ ...btnSm, background: '#6b7280' }}>Regenerate Code</button>}
        </div>
      )}

      {!squad && isManager && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 12, display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>No squad yet — create one</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={newSquadName} onChange={(e) => setNewSquadName(e.target.value)} placeholder="Squad name (optional)" style={{ ...inp, flex: 1 }} />
            <button onClick={handleCreateSquad} style={btn}>Create Squad</button>
          </div>
        </div>
      )}

      {!squad && !isManager && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Join a Squad — enter join code</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter 6-char code" maxLength={12} style={{ ...inp, flex: 1, textTransform: 'uppercase', letterSpacing: 1 }} />
            <button onClick={handleJoin} style={btn}>Join Squad</button>
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Ask your manager for the squad code. You must have a player profile created.</div>
        </div>
      )}

      {squad && !isManager && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 10px', display: 'flex', gap: 6 }}>
          <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Switch squad — enter code" style={{ ...inp, flex: 1 }} />
          <button onClick={handleJoin} style={btnSm}>Join / Switch</button>
        </div>
      )}

      {squad && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setAddOpen(true)} style={btn}>{isManager ? '+ Add Player to Squad' : '+ Invite Friend to Squad'}</button>
          {!isManager && <button onClick={() => setShowLeave(true)} style={{ ...btn, background: '#dc2626' }}>Leave Squad</button>}
        </div>
      )}

      {msg && <div style={{ fontSize: 12, color: msg.includes('✓') ? '#16a34a' : '#dc2626', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px' }}>{msg}</div>}

      {isManager && squad && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#92400e' }}>⏳ Waiting List — {waiting.length} pending</span>
            <button onClick={loadWaiting} style={{ ...btnSm, background: '#92400e', padding: '4px 8px' }}>Refresh</button>
          </div>
          {waiting.length === 0 ? (
            <div style={{ fontSize: 12, color: '#a16207', background: 'white', border: '1px dashed #fde68a', borderRadius: 8, padding: 10, textAlign: 'center' }}>No pending requests — invites will appear here for approval.</div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {waiting.map(w => (
                <div key={w.id} style={{ width: 176, background: 'white', border: '1px solid #fde68a', borderRadius: 12, padding: 10, display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 999, overflow: 'hidden', background: '#f3f4f6', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      {w.player.photoUrl ? <img src={w.player.photoUrl} alt={w.player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '⚽'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.player.name}</div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>{w.player.primaryPosition} · #{w.player.jerseyNumber ?? '—'} · {w.player.user?.email || ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleAccept(w.id)} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, background: '#16a34a', color: 'white', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>✓ Accept</button>
                    <button onClick={() => handleReject(w.id)} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, background: 'white', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>✕ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isManager && waiting.length > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: 12, display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#92400e', fontWeight: 800 }}>⏳ Awaiting manager approval — you are in the waiting list</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {waiting.map(w => (
              <div key={w.id} style={{ width: 220, background: 'white', border: '1px solid #fde68a', borderRadius: 12, padding: 10, display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: '#92400e', background: '#fef3c7', padding: '4px 8px', borderRadius: 999, textAlign: 'center' }}>SQUAD: {w.squad?.name || squad?.name || '—'}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 999, overflow: 'hidden', background: '#f3f4f6', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {w.player.photoUrl ? <img src={w.player.photoUrl} alt={w.player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '⚽'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.player.name}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{w.player.primaryPosition} · #{w.player.jerseyNumber ?? '—'} · {w.player.user?.email || ''}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, textAlign: 'center', padding: '6px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>⏳ Waiting for manager</div>
                <button onClick={() => handleCancel(w.id)} style={{ padding: '6px 8px', borderRadius: 8, background: 'white', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>✕ Cancel Request</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {squad && players.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
          No players in this squad yet. {isManager ? 'Use "Add Player to Squad" or share the join code.' : 'Wait for manager to add you or join via code.'}
        </div>
      ) : squad ? (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {players.map((p) => {
            const em = (p as { user?: { email?: string }}).user?.email;
            const badge = friendBadgeFor(em);
            const isYou = badge.label==='You';
            const isRequest = badge.label==='Cancel Request';
            const isAccept = badge.label==='Accept';
            const isFriend = badge.label==='✓ Friend';
            return (
            <div key={p.id} style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
              <PlayerCard
                name={p.name}
                photoUrl={p.photoUrl}
                jerseyNumber={p.jerseyNumber}
                heightCm={p.heightCm}
                weightKg={p.weightKg}
                preferredFoot={p.preferredFoot}
                primaryPosition={p.primaryPosition}
                secondaryPosition={p.secondaryPosition}
                overallRating={p.overallRating}
                friendBadgeLabel={badge.label || undefined}
                showAddFriend={!badge.label && !!em}
                onAddFriend={badge.action || (()=> em && addFriend(em))}
              />
              {isManager && (
                <button onClick={() => setPendingKick(p)} style={{ ...btnSm, background: '#dc2626', width: '100%' }}>Remove from Squad</button>
              )}
              {isYou && <div style={{ fontSize:10, color:'#374151', fontWeight:700 }}>You</div>}
              {isRequest && <div style={{ fontSize:10, color:'#6b7280', fontWeight:700 }}>Request sent — tap Cancel Request to cancel</div>}
              {isAccept && <div style={{ fontSize:10, color:'#16a34a', fontWeight:700 }}>Accept pending — tap Accept on card</div>}
              {isFriend && <div style={{ fontSize:10, color:'#16a34a', fontWeight:700 }}>✓ Friend — can invite to squad</div>}
              {!badge.label && <div style={{ fontSize:10, color:'#6b7280' }}>Tap + Add Friend on card</div>}
            </div>
          );})}
        </div>
      ) : null}

      {addOpen && (
        <div style={overlayStyle} onClick={() => setAddOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px' }}>{isManager ? 'Add Player to Squad' : 'Invite Friend to Squad'}</h3>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{isManager ? 'Managers can add any registered email; players can invite friends.' : 'Invite a friend — they will be linked to '} <b>{squad?.name}</b> ({squad?.code})</div>
            {friends.length > 0 && (
              <div style={{ display:'grid', gap:6, maxHeight:140, overflowY:'auto', marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#374151' }}>Your friends — tap to invite:</div>
                {friends.map(f=>(
                  <div key={f.email} style={{ display:'flex', gap:6, alignItems:'center', background:'#f9fafb', padding:'6px 8px', borderRadius:8, fontSize:12 }}>
                    <span>{f.name} · {f.email}</span>
                    <button onClick={()=> inviteFriend(f.email)} style={{ marginLeft:'auto', ...btnSm, padding:'4px 8px' }}>Invite</button>
                  </div>
                ))}
              </div>
            )}
            {isManager && (
              <>
                <div style={{ fontSize:11, color:'#6b7280', marginBottom:4 }}>Or add by email:</div>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="player@email.com" style={{ ...inp, width: '100%' }} />
              </>
            )}
            {!isManager && friends.length===0 && <div style={{ fontSize:11, color:'#9ca3af', marginBottom:8 }}>No friends yet — search below to add.</div>}
            <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, padding:8, display:'grid', gap:6, marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#92400e' }}>Add friend there — search & add:</div>
              <div style={{ display:'flex', gap:6 }}>
                <input value={friendSearchQ} onChange={e=> setFriendSearchQ(e.target.value)} placeholder="Search by name/email…" style={{ ...inp, flex:1 }} />
                <button onClick={searchFriendsToAdd} style={{ ...btnSm, background:'#111827' }}>Search</button>
              </div>
              {friendSearchResults.slice(0,5).map(u=>(
                <div key={u.id} style={{ display:'flex', gap:6, alignItems:'center', background:'white', padding:'6px 8px', borderRadius:8, fontSize:12 }}>
                  <span>{u.name} · {u.email}</span>
                  <button onClick={()=> addFriend(u.email)} style={{ marginLeft:'auto', ...btnSm, background:'#16a34a', padding:'4px 8px' }}>Add Friend</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => setAddOpen(false)} style={{ ...btnSm, background: '#6b7280' }}>Cancel</button>
              {isManager && <button onClick={handleAdd} style={btn}>Add to Squad</button>}
            </div>
            <div style={{ marginTop: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, fontSize: 11, color: '#6b7280' }}>
              Or share join code: <b style={{ letterSpacing: 1 }}>{squad?.code}</b> — friend can join via “Join Squad” using the code.
            </div>
          </div>
        </div>
      )}

      {pendingKick && (
        <div style={overlayStyle} onClick={() => setPendingKick(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', color: '#991b1b' }}>Confirm Kick</h3>
            <div style={{ fontSize: 13, marginBottom: 12 }}>
              Remove <b>{pendingKick.name}</b> #{pendingKick.jerseyNumber ?? '-'} from <b>{squad?.name}</b>? This unlinks the player from the squad without deleting their account. They can re-join via code later.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setPendingKick(null)} style={{ ...btnSm, background: '#6b7280' }}>Cancel</button>
              <button onClick={handleRemove} style={{ ...btnSm, background: '#dc2626' }}>Remove from Squad</button>
            </div>
          </div>
        </div>
      )}

      {showLeave && (
        <div style={overlayStyle} onClick={() => setShowLeave(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', color: '#991b1b' }}>Leave Squad?</h3>
            <div style={{ fontSize: 13, marginBottom: 12 }}>Leave <b>{squad?.name}</b>? You will be removed instantly and can join another squad via code. Pending requests will be cleared.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowLeave(false)} style={{ ...btnSm, background: '#6b7280' }}>Cancel</button>
              <button onClick={handleLeave} style={{ ...btnSm, background: '#dc2626' }}>Leave Squad</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const inp: React.CSSProperties = { padding: '7px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 };
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#16a34a', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' };
const btnSm: React.CSSProperties = { padding: '6px 10px', borderRadius: 8, background: '#16a34a', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 16 };
const modalStyle: React.CSSProperties = { background: 'white', borderRadius: 12, padding: 16, width: '100%', maxWidth: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };

export default Roster;
