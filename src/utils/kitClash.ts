export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const h = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h) && !/^[0-9a-fA-F]{3}$/.test(h)) return null;
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
}

export function colorDistance(a: string, b: string): number | null {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return null;
  return Math.sqrt((ca.r - cb.r) ** 2 + (ca.g - cb.g) ** 2 + (ca.b - cb.b) ** 2);
}

export function kitClashCheck(home?: string | null, away?: string | null): { clash: boolean; distance: number | null; warning: string | null } {
  if (!home || !away) return { clash: false, distance: null, warning: null };
  const d = colorDistance(home, away);
  if (d === null) return { clash: false, distance: null, warning: null };
  const clash = d < 100;
  return {
    clash,
    distance: Math.round(d),
    warning: clash ? `Kit clash warning — colors too similar (distance ${Math.round(d)} < 100). Consider alternate kit.` : null,
  };
}