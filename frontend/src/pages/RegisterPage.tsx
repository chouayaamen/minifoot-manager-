import { useState } from 'react';

type Props = {
  onAuthed: (token: string, user: Record<string, unknown>) => void;
  switchToLogin: () => void;
};

export default function RegisterPage({ onAuthed, switchToLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'player'|'manager'>('player');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true); setErr(null);
    const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, role }) });
    const j = await r.json();
    if (!r.ok) { setErr(j.details? JSON.stringify(j.details): j.error || 'Registration failed'); setLoading(false); return; }
    const r2 = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const j2 = await r2.json();
    if (!r2.ok) setErr(j2.error); else onAuthed(j2.token as string, j2);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#16a34a 0%,#0f172a 100%)', padding: 16 }}>
      <form onSubmit={submit} style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, display: 'grid', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28 }}>⚽</div>
          <h1 style={{ margin: '4px 0 0', fontSize: 20 }}>Create account</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>Join your squad on Mini-Foot</p>
        </div>
        <label style={lbl}>Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required style={inp} /></label>
        <label style={lbl}>Email<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@team.com" required style={inp} /></label>
        <label style={lbl}>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} style={inp} /></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['player','manager'] as const).map((r)=>(
            <button key={r} type="button" onClick={()=> setRole(r)} style={{ flex:1, padding:'8px 10px', borderRadius:10, border:`1px solid ${role===r?'#16a34a':'#e5e7eb'}`, background: role===r?'#dcfce7':'white', color: role===r?'#166534':'#374151', fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'capitalize' }}>{r}</button>
          ))}
        </div>
        {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '8px 10px', borderRadius: 8, fontSize: 12 }}>{err}</div>}
        <button type="submit" disabled={loading} style={primary}>{loading ? 'Creating…' : 'Create account'}</button>
        <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
          Already have an account? <button type="button" onClick={switchToLogin} style={link}>Log in</button>
        </div>
      </form>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'grid', gap: 4, fontSize: 12, fontWeight: 600, color: '#374151' };
const inp: React.CSSProperties = { padding: '9px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14 };
const primary: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, background: '#16a34a', color: 'white', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer' };
const link: React.CSSProperties = { background: 'none', border: 'none', color: '#16a34a', fontWeight: 700, cursor: 'pointer', fontSize: 13 };