import { useEffect, useState } from 'react';

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string; role: string };
  replies: { id: string; content: string; createdAt: string; user: { name: string; role: string } }[];
};

type Props = { token: string; isManager: boolean };

export default function CommentBoard({ token, isManager }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [reacts, setReacts] = useState<Record<string, string>>({});
  const [meName, setMeName] = useState('You');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  useEffect(() => { fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.ok?r.json():null).then(j=> j && setMeName((j.name as string)||'You')); }, [token]);

  async function load(): Promise<void> {
    const r = await fetch('/api/comments');
    if (r.ok) setComments(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function postComment(): Promise<void> {
    if (!newComment.trim()) return;
    const r = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: newComment.trim() }),
    });
    const j = await r.json();
    if (!r.ok) setMsg(j.error);
    else { setNewComment(''); setMsg(null); load(); }
  }

  async function postReply(parentId: string): Promise<void> {
    const content = (replyContent[parentId] || '').trim();
    if (!content) return;
    const r = await fetch(`/api/comments/${parentId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content }),
    });
    const j = await r.json();
    if (!r.ok) setMsg(j.error);
    else { setReplyContent((prev) => ({ ...prev, [parentId]: '' })); load(); }
  }

  return (
    <div style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#ecfeff 100%)', border: '1px solid #e5e7eb', borderRadius: 16, padding: 12, display: 'grid', gap: 10, width: '100%', boxSizing: 'border-box', minWidth: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 900, fontSize: 13, whiteSpace: 'nowrap' }}>✨ Pitch Board — Glass</span>
        <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.9)', padding: '3px 7px', borderRadius: 999, border: '1px solid #e5e7eb' }}>{comments.length} notes</span>
      </div>

      <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', padding: 6, borderRadius: 12, border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', minWidth: 0 }}>
        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={isManager ? "Post as manager..." : "Add a comment..."} style={{ flex: 1, minWidth: 0, padding: '7px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, background: 'white' }} maxLength={500} />
        <button onClick={postComment} style={{ padding: '7px 12px', borderRadius: 8, background: '#111827', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>Post</button>
      </div>
      {msg && <div style={{ fontSize: 12, color: '#dc2626' }}>{msg}</div>}

      <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 14, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.7)', color: '#6b7280', fontSize: 12 }}>No notes yet — glass is clear.</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.7)', borderRadius: 12, padding: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, background: c.user.role === 'manager' ? '#16a34a' : '#111827', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{c.user.name[0].toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 11 }}>{c.user.name}</span>
                    {c.user.role === 'manager' && <span style={{ fontSize: 9, background: '#16a34a', color: 'white', padding: '1px 5px', borderRadius: 999, flexShrink: 0 }}>MANAGER</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ display: 'flex', gap: 3, flexShrink: 0, alignItems: 'center' }}>
                  {['👏', '🔥', '⚽'].map((e) => (
                    <button key={e} title={reacts[c.id]===e ? `${meName} reacted with ${e}` : `React ${e}`} onClick={() => setReacts((p) => ({ ...p, [c.id]: p[c.id] === e ? '' : e }))} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 999, border: reacts[c.id] === e ? '1px solid #16a34a' : '1px solid #e5e7eb', background: reacts[c.id] === e ? '#dcfce7' : 'white', cursor: 'pointer', fontSize: 11, padding: 0 }}>{e}</button>
                  ))}
                </div>
              </div>
              {reacts[c.id] && (
                <div onClick={() => setExpanded(p=> ({...p,[c.id]:!p[c.id]}))} title={`${meName} reacted with ${reacts[c.id]} — click to expand`} style={{ fontSize: 10, color: '#16a34a', marginTop: 4, cursor: 'pointer', background: 'rgba(220,252,231,0.7)', padding: '4px 8px', borderRadius: 999, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                  <span>{reacts[c.id]} 1</span>
                  <span style={{ color: '#6b7280' }}>· {meName}</span>
                  <span style={{ fontSize: 9 }}>{expanded[c.id] ? '▲' : '▼'}</span>
                </div>
              )}
              {reacts[c.id] && expanded[c.id] && (
                <div style={{ marginTop: 4, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 6, fontSize: 11 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Reactions — 1</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span>{reacts[c.id]}</span> <span>{meName}</span> <span style={{ color: '#9ca3af' }}>{new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span></div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>{['👏','🔥','⚽'].map(e=> <span key={e} style={{ padding: '2px 6px', borderRadius: 999, background: reacts[c.id]===e?'#dcfce7':'#f3f4f6', border: '1px solid #e5e7eb' }}>{e} {reacts[c.id]===e?1:0}</span>)}</div>
                </div>
              )}
              <div style={{ fontSize: 12, marginTop: 6, color: '#111827', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{c.content}</div>
              {c.replies.length > 0 && (
                <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                  {c.replies.map((r) => (
                    <div key={r.id} style={{ background: 'rgba(240,253,244,0.95)', border: '1px solid #bbf7d0', borderRadius: 10, padding: '7px 8px', minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, display: 'flex', gap: 4, flexWrap: 'wrap' }}>↳ {r.user.name} <span style={{ color: '#16a34a' }}>· MANAGER</span> <span style={{ color: '#9ca3af', fontWeight: 400 }}>{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {new Date(r.createdAt).toLocaleDateString()}</span></div>
                      <div style={{ fontSize: 12, marginTop: 2, wordBreak: 'break-word' }}>{r.content}</div>
                    </div>
                  ))}
                </div>
              )}
              {isManager && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, minWidth: 0 }}>
                  <input value={replyContent[c.id] || ''} onChange={(e) => setReplyContent((p) => ({ ...p, [c.id]: e.target.value }))} placeholder="Reply..." style={{ flex: 1, minWidth: 0, padding: '6px 8px', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 12 }} maxLength={500} />
                  <button onClick={() => postReply(c.id)} style={{ padding: '6px 10px', borderRadius: 8, background: '#16a34a', color: 'white', border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>Reply</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
