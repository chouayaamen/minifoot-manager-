import { useEffect, useState } from 'react';

type Invite = { id: string; email: string; status: string; manager: { name: string; email: string } };
type Friend = { id: string; name: string; email: string; role?: string };

export default function InvitesPanel({ token, isManager }: { token: string; isManager: boolean }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isInvited, setIsInvited] = useState(false);
  const [email, setEmail] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<Friend[]>([]);

  async function load(): Promise<void> {
    const r = await fetch('/api/invites/me', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) { const j = await r.json(); setInvites(j.invites); setIsInvited(j.isInvited); }
    const r2 = await fetch('/api/friends', { headers: { Authorization: `Bearer ${token}` } });
    if (r2.ok) { const j = await r2.json(); setFriends(j.friends); }
  }
  useEffect(() => { load(); }, []);

  async function inviteByEmail(): Promise<void> {
    if (!email.trim()) return;
    const r = await fetch('/api/invites', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: email.trim() }) });
    const j = await r.json();
    if (!r.ok) setMsg(j.error); else { setMsg('Invited ✓'); setEmail(''); load(); }
  }

  async function accept(id: string): Promise<void> {
    const r = await fetch(`/api/invites/${id}/accept`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) load(); else setMsg('Accept failed');
  }

  async function searchUsers(): Promise<void> {
    const r = await fetch(`/api/friends/users?q=${encodeURIComponent(search)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setUsers(await r.json());
  }

  if (isManager) {
    return (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, display: 'grid', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 13 }}>Invite Players</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="player@email.com" style={inp} />
          <button onClick={inviteByEmail} style={btn}>Invite by Email</button>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>Or pick from friends ({friends.length})</div>
        {friends.length === 0 ? <span style={{ fontSize: 12, color: '#9ca3af' }}>No friends yet — add friends below.</span> : friends.map((f) => (
          <div key={f.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, background: '#f9fafb', padding: '6px 8px', borderRadius: 8 }}>
            <span>{f.name} · {f.email}</span><button onClick={() => { setEmail(f.email); }} style={btnSm}>Select</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find users by name/email" style={{ ...inp, flex: 1 }} />
          <button onClick={searchUsers} style={btnSm}>Search</button>
        </div>
        {users.map((u) => (
          <div key={u.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, background: '#f0fdf4', padding: '6px 8px', borderRadius: 8 }}>
            <span>{u.name} ({u.role}) · {u.email}</span>
            <button onClick={async () => {
              const r = await fetch('/api/friends/request', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: u.email }) });
              const j = await r.json(); setMsg(r.ok ? 'Friend request sent' : j.error); load();
            }} style={btnSm}>Add Friend</button>
            <button onClick={() => setEmail(u.email)} style={{ ...btnSm, background: '#16a34a' }}>Invite</button>
          </div>
        ))}
        {msg && <div style={{ fontSize: 12, color: msg.includes('✓') ? '#16a34a' : '#dc2626' }}>{msg}</div>}
      </div>
    );
  }

  return (
    <div style={{ background: isInvited ? '#f0fdf4' : '#fef3c7', border: `1px solid ${isInvited ? '#86efac' : '#fde68a'}`, borderRadius: 12, padding: 14, display: 'grid', gap: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 13 }}>{isInvited ? '✓ You are invited — roster unlocked' : '⏳ Waiting for manager invite'}</div>
      {!isInvited && <div style={{ fontSize: 12, color: '#92400e' }}>You can only edit your profile until a manager invites you. Ask a manager to invite you by email or add you as friend.</div>}
      {invites.map((inv) => (
        <div key={inv.id} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'white', padding: '8px 10px', borderRadius: 8, fontSize: 12 }}>
          <span>From <b>{inv.manager.name}</b> ({inv.manager.email}) — <b>{inv.status}</b></span>
          {inv.status === 'pending' && <button onClick={() => accept(inv.id)} style={{ marginLeft: 'auto', ...btn, background: '#16a34a' }}>Accept</button>}
        </div>
      ))}
      {isInvited && <div style={{ fontSize: 12, color: '#166534' }}>You now have full access to Roster, Pitch, Fixtures, etc.</div>}
    </div>
  );
}

const inp: React.CSSProperties = { flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 };
const btn: React.CSSProperties = { padding: '7px 10px', borderRadius: 8, background: '#111827', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' };
const btnSm: React.CSSProperties = { padding: '4px 8px', borderRadius: 6, background: '#111827', color: 'white', border: 'none', fontWeight: 600, fontSize: 11, cursor: 'pointer' };