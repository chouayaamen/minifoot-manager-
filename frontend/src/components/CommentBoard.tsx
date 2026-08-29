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
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 14 }}>Pitch Comments — Global Board</div>
      {!isManager ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment on the pitch..." style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} maxLength={500} />
          <button onClick={postComment} style={btn}>Post</button>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#6b7280', background: '#f9fafb', padding: '8px 10px', borderRadius: 8 }}>Players comment, managers reply below.</div>
      )}
      {msg && <div style={{ fontSize: 12, color: '#dc2626' }}>{msg}</div>}
      <div style={{ display: 'grid', gap: 10 }}>
        {comments.length === 0 ? (
          <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 12 }}>No comments yet — players start the conversation.</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, background: '#f9fafb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 12 }}>{c.user.name} <span style={{ fontWeight: 400, color: '#6b7280' }}>· {c.user.role}</span></span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 13, marginTop: 4, whiteSpace: 'pre-wrap' }}>{c.content}</div>
              {c.replies.length > 0 && (
                <div style={{ marginTop: 8, display: 'grid', gap: 6, paddingLeft: 12, borderLeft: '2px solid #e5e7eb' }}>
                  {c.replies.map((r) => (
                    <div key={r.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>↳ {r.user.name} <span style={{ color: '#16a34a' }}>· MANAGER</span> <span style={{ color: '#9ca3af', fontWeight: 400 }}>{new Date(r.createdAt).toLocaleString()}</span></div>
                      <div style={{ fontSize: 13, marginTop: 2 }}>{r.content}</div>
                    </div>
                  ))}
                </div>
              )}
              {isManager && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input value={replyContent[c.id] || ''} onChange={(e) => setReplyContent((prev) => ({ ...prev, [c.id]: e.target.value }))} placeholder="Reply as manager..." style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid #16a34a', fontSize: 12 }} maxLength={500} />
                  <button onClick={() => postReply(c.id)} style={{ ...btn, background: '#16a34a' }}>Reply</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#111827', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' };