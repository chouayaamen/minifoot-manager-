import { useEffect, useState } from 'react';

type Props = { token: string; onSaved?: () => void };

export default function EditProfile({ token, onSaved }: Props) {
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [primaryPosition, setPrimaryPosition] = useState<'GK'|'DEF'|'MID'|'PIVOT'>('MID');
  const [secondaryPosition, setSecondaryPosition] = useState<string>('');
  const [preferredFoot, setPreferredFoot] = useState<'LEFT'|'RIGHT'|'BOTH'>('RIGHT');
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    fetch('/api/players/profile/me', { headers: { Authorization: `Bearer ${token}` }})
      .then((r)=> r.ok? r.json(): null)
      .then((j)=> {
        if(!j) return;
        setNickname(j.nickname||''); setBio(j.bio||''); setPhone(j.phone||''); setPhotoUrl(j.photoUrl||''); setPreview(j.photoUrl||null);
        setHeightCm(j.heightCm||''); setWeightKg(j.weightKg||''); setPrimaryPosition(j.primaryPosition||'MID'); setSecondaryPosition(j.secondaryPosition||''); setPreferredFoot(j.preferredFoot||'RIGHT'); setJerseyNumber(j.jerseyNumber||'');
      });
  },[token]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>): void {
    const f = e.target.files?.[0]; if(!f) return;
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setPendingFile(f);
    setMsg(null);
  }

  async function save(e: React.FormEvent): Promise<void> {
    e.preventDefault(); setLoading(true); setMsg(null);
    let finalPhotoUrl = photoUrl || null;
    if (pendingFile) {
      const fd = new FormData(); fd.append('avatar', pendingFile);
      const ur = await fetch('/api/players/avatar', { method:'POST', headers:{ Authorization:`Bearer ${token}` }, body: fd });
      const uj = await ur.json();
      if (!ur.ok) { setMsg(uj.error || 'Avatar upload failed'); setLoading(false); return; }
      finalPhotoUrl = uj.url as string;
      setPhotoUrl(finalPhotoUrl);
      setPendingFile(null);
    }
    const body: Record<string,unknown> = { nickname: nickname||null, bio: bio||null, phone: phone||null, photoUrl: finalPhotoUrl, heightCm: heightCm===''? null: Number(heightCm), weightKg: weightKg===''? null: Number(weightKg), primaryPosition, secondaryPosition: secondaryPosition||null, preferredFoot, jerseyNumber: jerseyNumber===''? null: Number(jerseyNumber) };
    const r = await fetch('/api/players/profile', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(body)});
    const j = await r.json();
    if(!r.ok) setMsg(j.error || 'Save failed'); else { setMsg('Profile saved ✓'); onSaved?.(); }
    setLoading(false);
  }

  return (
    <form onSubmit={save} style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:16, padding:20, display:'grid', gap:14, maxWidth:560 }}>
      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
        <div style={{ width:72, height:72, borderRadius:999, background:'#e5e7eb', overflow:'hidden', display:'grid', placeItems:'center', flexShrink:0 }}>
          {preview? <img src={preview} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={()=> setPreview(null)} /> : <span style={{ fontSize:28 }}>👤</span>}
        </div>
        <div style={{ display:'grid', gap:6, flex:1 }}>
          <label style={lbl}>Profile picture — URL or upload
            <input value={pendingFile ? '' : photoUrl} onChange={(e)=> { setPendingFile(null); if(preview?.startsWith('blob:')) URL.revokeObjectURL(preview); setPhotoUrl(e.target.value); setPreview(e.target.value||null); }} placeholder="https://..." style={inp} disabled={!!pendingFile} />
            {pendingFile && <span style={{ fontSize:11, color:'#16a34a' }}>Chosen file: {pendingFile.name} — previewing locally, will upload on Save</span>}
          </label>
          <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize:12 }} />
          {pendingFile && <button type="button" onClick={()=> { if(preview?.startsWith('blob:')) URL.revokeObjectURL(preview); setPendingFile(null); setPreview(photoUrl||null); }} style={{ fontSize:11, padding:'4px 8px', borderRadius:6, border:'1px solid #e5e7eb', background:'white', cursor:'pointer', alignSelf:'start' }}>Clear file & use URL</button>}
        </div>
      </div>

      <label style={lbl}>Nickname<input value={nickname} onChange={(e)=> setNickname(e.target.value)} placeholder="El Matador" maxLength={30} style={inp} /></label>
      <label style={lbl}>Bio<textarea value={bio} onChange={(e)=> setBio(e.target.value)} placeholder="Quick story..." maxLength={280} rows={3} style={{...inp, resize:'vertical'}} /></label>
      <label style={lbl}>Phone<input value={phone} onChange={(e)=> setPhone(e.target.value)} placeholder="+212 6..." style={inp} /></label>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <label style={lbl}>Height (cm)<input type="number" value={heightCm} onChange={(e)=> setHeightCm(e.target.value===''? '' : Number(e.target.value))} style={inp} /></label>
        <label style={lbl}>Weight (kg)<input type="number" value={weightKg} onChange={(e)=> setWeightKg(e.target.value===''? '' : Number(e.target.value))} style={inp} /></label>
        <label style={lbl}>Primary<input value={primaryPosition} onChange={(e)=> setPrimaryPosition(e.target.value as never)} style={inp} list="pos" /></label>
        <label style={lbl}>Secondary<input value={secondaryPosition} onChange={(e)=> setSecondaryPosition(e.target.value)} placeholder="optional" style={inp} /></label>
        <label style={lbl}>Foot<select value={preferredFoot} onChange={(e)=> setPreferredFoot(e.target.value as never)} style={inp}><option value="LEFT">LEFT</option><option value="RIGHT">RIGHT</option><option value="BOTH">BOTH</option></select></label>
        <label style={lbl}>Jersey #<input type="number" value={jerseyNumber} onChange={(e)=> setJerseyNumber(e.target.value===''? '' : Number(e.target.value))} min={1} max={99} style={inp} /></label>
      </div>
      <datalist id="pos"><option value="GK"/><option value="DEF"/><option value="MID"/><option value="PIVOT"/></datalist>

      <button type="submit" disabled={loading} style={primary}>{loading? 'Saving…':'Save profile'}</button>
      {msg && <div style={{ fontSize:12, color: msg.includes('✓')?'#16a34a':'#dc2626', textAlign:'center' }}>{msg}</div>}
    </form>
  );
}
const lbl: React.CSSProperties = { display:'grid', gap:4, fontSize:12, fontWeight:600, color:'#374151' };
const inp: React.CSSProperties = { padding:'9px 12px', borderRadius:10, border:'1px solid #e5e7eb', fontSize:14 };
const primary: React.CSSProperties = { padding:'10px 14px', borderRadius:10, background:'#16a34a', color:'white', border:'none', fontWeight:800, cursor:'pointer' };