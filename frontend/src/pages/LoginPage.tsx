import { useState } from 'react';

type Props = {
  onAuthed: (token: string, user: Record<string, unknown>) => void;
  switchToRegister: () => void;
};

export default function LoginPage({ onAuthed, switchToRegister }: Props) {
  const [email, setEmail] = useState('bob@minifoot.test');
  const [password, setPassword] = useState('Pass123!');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true); setErr(null);
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const j = await r.json();
    if (!r.ok) setErr(j.error || 'Login failed');
    else onAuthed(j.token as string, j);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#0f172a 0%,#16a34a 100%)', padding: 16 }}>
      <form onSubmit={submit} style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, display: 'grid', gap: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28 }}>⚽</div>
          <h1 style={{ margin: '4px 0 0', fontSize: 20 }}>Welcome back</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>Login to Mini-Foot Manager</p>
        </div>
        <label style={lbl}>Email<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@team.com" required style={inp} /></label>
        <label style={lbl}>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={inp} /></label>
        {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '8px 10px', borderRadius: 8, fontSize: 12 }}>{err}</div>}
        <button type="submit" disabled={loading} style={primary}>{loading ? 'Logging in…' : 'Login'}</button>
        <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
          No account? <button type="button" onClick={switchToRegister} style={link}>Create one</button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af' }}>Demo: bob@minifoot.test / Pass123!</div>
      </form>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'grid', gap: 4, fontSize: 12, fontWeight: 600, color: '#374151' };
const inp: React.CSSProperties = { padding: '9px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14 };
const primary: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, background: '#16a34a', color: 'white', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer' };
const link: React.CSSProperties = { background: 'none', border: 'none', color: '#16a34a', fontWeight: 700, cursor: 'pointer', fontSize: 13 };