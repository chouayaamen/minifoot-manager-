import React, { useState, useMemo } from 'react';
import { FORMATIONS, FormatType, Slot, allFormatTypes } from '../utils/formations';
import LineupExporter from './LineupExporter';

export type RosterPlayer = {
  id: string;
  name: string;
  photoUrl?: string | null;
  primaryPosition: string;
  jerseyNumber?: number | null;
  overallRating?: number | null;
};

export type Assignments = Record<string, { playerId?: string | null; positionName: string }>;

type Props = {
  matchId: string;
  initialFormat?: FormatType;
  initialFormation?: string;
  initialAssignments?: Assignments;
  roster: RosterPlayer[];
  fixture?: { opponent: string; matchDate: string; venue?: string | null; formatType: string };
  teamName?: string;
  readOnly?: boolean;
  onSave?: (data: { formationName: string; pitchPositionsJson: Assignments }) => void;
  commentBoard?: React.ReactNode;
};

export const PitchBoard: React.FC<Props> = ({
  initialFormat = '5v5',
  initialFormation,
  initialAssignments = {},
  roster,
  fixture,
  teamName,
  readOnly = false,
  onSave,
  commentBoard,
}) => {
  const [format, setFormat] = useState<FormatType>(initialFormat);
  const formations = useMemo(() => FORMATIONS[format], [format]);
  const [formationName, setFormationName] = useState<string>(initialFormation || formations[0]?.name || '1-2-1');
  const slots: Slot[] = useMemo(() => formations.find((f) => f.name === formationName)?.slots || formations[0]?.slots || [], [formations, formationName]);
  const [assignments, setAssignments] = useState<Assignments>(initialAssignments);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const assignedPlayerIds = new Set(Object.values(assignments).map((a) => a.playerId).filter(Boolean) as string[]);
  const bench = roster.filter((p) => !assignedPlayerIds.has(p.id));

  function handleFormatChange(f: FormatType): void {
    setFormat(f);
    const nf = FORMATIONS[f][0];
    setFormationName(nf.name);
    setAssignments({});
    setSelectedSlot(null);
  }

  function handleFormationChange(name: string): void {
    setFormationName(name);
    const def = FORMATIONS[format].find((x) => x.name === name);
    if (!def) return;
    const next: Assignments = {};
    def.slots.forEach((s) => {
      next[s.id] = assignments[s.id] || { playerId: null, positionName: s.position };
    });
    setAssignments(next);
    setSelectedSlot(null);
  }

  function assignToSlot(slotId: string, playerId: string): void {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    const next: Assignments = { ...assignments };
    next[slotId] = { playerId, positionName: slot.position };
    const otherSlot = Object.entries(assignments).find(([, v]) => v.playerId === playerId)?.[0];
    if (otherSlot && otherSlot !== slotId) delete (next[otherSlot] as Assignments[string]).playerId;
    setAssignments(next);
    setSelectedSlot(null);
  }

  function clearSlot(slotId: string): void {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    setAssignments((prev) => ({ ...prev, [slotId]: { playerId: null, positionName: slot.position } }));
  }

  function handleDragStart(playerId: string): void { setDragId(playerId); }
  function handleDrop(slotId: string): void { if (dragId) assignToSlot(slotId, dragId); setDragId(null); }

  const playerMap = useMemo(() => new Map(roster.map((p) => [p.id, p])), [roster]);

  return (
    <div style={{ fontFamily: 'Inter,system-ui,sans-serif', maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {allFormatTypes().map((f) => (
            <button key={f} disabled={readOnly} onClick={() => handleFormatChange(f)} style={{...tabStyle(format === f), opacity: readOnly ? 0.6 : 1, cursor: readOnly ? 'default' : 'pointer'}}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
          {formations.map((f) => (
            <button key={f.name} disabled={readOnly} onClick={() => handleFormationChange(f.name)} style={{...pillStyle(formationName === f.name), opacity: readOnly ? 0.6 : 1, cursor: readOnly ? 'default' : 'pointer'}}>{f.name}</button>
          ))}
        </div>
        {onSave && (
          <button onClick={() => onSave({ formationName, pitchPositionsJson: assignments })} style={primaryBtn}>Save Lineup</button>
        )}
        <LineupExporter targetId="pitch-board-capture" fixture={fixture} teamName={teamName} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        <div
          id="pitch-board-capture"
          style={{
            position: 'relative',
            aspectRatio: '3/4',
            background: 'linear-gradient(180deg,#1a7f37 0%,#0f5c28 100%)',
            borderRadius: 16,
            border: '3px solid white',
            boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 12, border: '2px solid rgba(255,255,255,0.9)', borderRadius: 8, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: 12, right: 12, height: 2, background: 'rgba(255,255,255,0.9)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 80, height: 80, transform: 'translate(-50%,-50%)', border: '2px solid rgba(255,255,255,0.9)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 12, left: '25%', right: '25%', height: 56, border: '2px solid rgba(255,255,255,0.9)', borderTop: 'none', borderRadius: '0 0 8px 8px', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 12, left: '25%', right: '25%', height: 56, border: '2px solid rgba(255,255,255,0.9)', borderBottom: 'none', borderRadius: '8px 8px 0 0', pointerEvents: 'none' }} />

          {slots.map((slot) => {
            const a = assignments[slot.id];
            const p = a?.playerId ? playerMap.get(a.playerId) : null;
            const filled = Boolean(p);
            return (
              <div
                key={slot.id}
                onClick={() => { if (readOnly) return; setSelectedSlot(selectedSlot === slot.id ? null : slot.id); }}
                onDragOver={(e) => { if (readOnly) return; e.preventDefault(); }}
                onDrop={() => { if (readOnly) return; handleDrop(slot.id); }}
                style={{
                  position: 'absolute',
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 72,
                  height: 82,
                  borderRadius: 12,
                  background: filled ? 'white' : selectedSlot === slot.id ? '#fef08a' : 'rgba(255,255,255,0.92)',
                  border: `2px ${selectedSlot === slot.id ? 'dashed' : 'solid'} ${filled ? '#16a34a' : '#e5e7eb'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: readOnly ? 'default' : 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  padding: 4,
                  textAlign: 'center',
                }}
              >
                {p ? (
                  <>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#16a34a', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, overflow: 'hidden' }}>
                      {p.photoUrl ? <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p.jerseyNumber ?? p.name[0])}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 64 }}>{p.name}</div>
                    <div style={{ fontSize: 8, color: '#6b7280' }}>{slot.label}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 18, color: '#9ca3af' }}>+</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#6b7280' }}>{slot.label}</div>
                    <div style={{ fontSize: 7, color: '#9ca3af' }}>{slot.id}</div>
                  </>
                )}
                {filled && !readOnly && (
                  <button onClick={(e) => { e.stopPropagation(); clearSlot(slot.id); }} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#ef4444', color: 'white', fontSize: 10, cursor: 'pointer' }}>×</button>
                )}
                {selectedSlot === slot.id && !filled && !readOnly && (
                  <div style={{ position: 'absolute', top: '100%', marginTop: 6, left: '50%', transform: 'translateX(-50%)', background: 'white', borderRadius: 8, boxShadow: '0 8px 16px rgba(0,0,0,0.2)', padding: 6, zIndex: 10, minWidth: 140 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, color: '#374151' }}>Assign to {slot.label}</div>
                    <div style={{ maxHeight: 120, overflowY: 'auto', display: 'grid', gap: 4 }}>
                      {bench.map((pl) => (
                        <button key={pl.id} onClick={() => assignToSlot(slot.id, pl.id)} style={assignBtn}>{pl.name} · {pl.primaryPosition}</button>
                      ))}
                      {bench.length === 0 && <span style={{ fontSize: 11, color: '#9ca3af' }}>No players available</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: '#374151', marginBottom: 8 }}>BENCH ({bench.length})</div>
            <div style={{ display: 'grid', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
              {bench.length === 0 ? <span style={{ fontSize: 12, color: '#9ca3af' }}>All roster players assigned. Clear a slot to return.</span> : bench.map((pl) => (
                <div key={pl.id} draggable={!readOnly} onDragStart={() => { if(readOnly) return; handleDragStart(pl.id); }} onDragEnd={() => setDragId(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: dragId === pl.id ? '#f0fdf4' : '#f9fafb', border: '1px solid #e5e7eb', cursor: readOnly ? 'default' : 'grab', opacity: readOnly ? 0.7 : 1 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#16a34a', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 10, flexShrink: 0, overflow: 'hidden' }}>
                    {pl.photoUrl ? <img src={pl.photoUrl} alt={pl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : pl.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.name}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{pl.primaryPosition}{pl.jerseyNumber ? ` · #${pl.jerseyNumber}` : ''}</div>
                  </div>
                  {!readOnly && <button onClick={() => { const empty = slots.find((s) => !assignments[s.id]?.playerId); if (empty) assignToSlot(empty.id, pl.id); }} style={{ fontSize: 10, padding: '4px 6px', borderRadius: 6, border: '1px solid #16a34a', background: 'white', color: '#16a34a', cursor: 'pointer' }}>Add</button>}
                </div>
              ))}
            </div>
          </div>

          {!readOnly && (
            <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:12, padding:10, fontSize:12, color:'#6b7280', textAlign:'center' }}>Drag players from bench onto pitch. Use + to assign.</div>
          )}
          {readOnly && (
            <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:12, padding:10, fontSize:12, color:'#6b7280', textAlign:'center' }}>View-only — manager lineup final</div>
          )}
          {commentBoard && <div style={{ marginTop: 4 }}>{commentBoard}</div>}
        </div>
      </div>
    </div>
  );
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 12px', borderRadius: 999, border: `1px solid ${active ? '#16a34a' : '#e5e7eb'}`, background: active ? '#16a34a' : 'white', color: active ? 'white' : '#374151', fontWeight: 700, fontSize: 12, cursor: 'pointer',
});
const pillStyle = (active: boolean): React.CSSProperties => ({
  padding: '5px 10px', borderRadius: 8, border: `1px solid ${active ? '#16a34a' : '#e5e7eb'}`, background: active ? '#dcfce7' : 'white', color: active ? '#166534' : '#374151', fontWeight: 600, fontSize: 12, cursor: 'pointer',
});
const primaryBtn: React.CSSProperties = { marginLeft: 'auto', padding: '7px 14px', borderRadius: 8, background: '#16a34a', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' };
const assignBtn: React.CSSProperties = { padding: '4px 6px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 11, textAlign: 'left', cursor: 'pointer' };

export default PitchBoard;