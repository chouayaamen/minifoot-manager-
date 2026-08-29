import React, { useRef, useState } from 'react';

type Props = {
  targetId: string;
  fixture?: { opponent: string; matchDate: string; venue?: string | null; formatType: string };
  teamName?: string;
};

export const LineupExporter: React.FC<Props> = ({ targetId, fixture, teamName = 'Mini-Foot XI' }) => {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function doExport(): Promise<void> {
    const el = document.getElementById(targetId);
    if (!el) { alert('Pitch board not found'); return; }
    setBusy(true);
    try {
      const mod = await import('html2canvas');
      const html2canvas = (mod as unknown as { default: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement> }).default;
      const canvas = await html2canvas(el, { backgroundColor: '#0f5c28', scale: 2, useCORS: true, logging: false });
      const out = document.createElement('canvas');
      const w = canvas.width, h = canvas.height;
      const headerH = 110;
      out.width = w; out.height = h + headerH;
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('No context');
      ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, out.width, out.height);
      ctx.fillStyle = 'white'; ctx.font = 'bold 28px Inter, sans-serif'; ctx.fillText(teamName, 24, 38);
      if (fixture) {
        ctx.fillStyle = '#9ca3af'; ctx.font = '16px Inter, sans-serif';
        const d = new Date(fixture.matchDate);
        ctx.fillText(`${fixture.opponent} · ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${fixture.venue ? ` · ${fixture.venue}` : ''} · ${fixture.formatType}`, 24, 64);
      }
      ctx.fillStyle = '#4b5563'; ctx.font = '12px Inter, sans-serif'; ctx.fillText('Mini-Foot Tactical Board — WhatsApp lineup', 24, 88);
      ctx.fillStyle = 'white'; ctx.font = '11px Inter, sans-serif'; ctx.fillText(new Date().toLocaleString(), w - 180, 38);
      ctx.drawImage(canvas, 0, headerH);
      const url = out.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = `lineup-${fixture?.opponent || 'match'}-${new Date().toISOString().slice(0,10)}.png`; a.click();
    } catch (e) {
      alert('Export failed: ' + (e as Error).message + ' — try npm install html2canvas');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={doExport} disabled={busy} style={{ padding: '9px 14px', borderRadius: 10, background: '#25D366', color: 'white', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,211,102,0.35)' }}>
        {busy ? 'Rendering…' : '📤 Export to WhatsApp Image (.png)'}
      </button>
      <input ref={fileRef} type="hidden" />
    </div>
  );
};
export default LineupExporter;