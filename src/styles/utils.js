// 绘图工具函数

// ---------- PRNG 工具 ----------
export function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export function sfc32(a, b, c, d) {
  return function () {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export function makePRNG(seedStr) {
  const seed = xmur3(seedStr || "seed")();
  const seed2 = xmur3(seedStr + "$")();
  const seed3 = xmur3("@" + seedStr)();
  const seed4 = xmur3("#" + seedStr)();
  const rand = sfc32(seed, seed2, seed3, seed4);
  const rnd = () => rand();
  rnd.int = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
  rnd.pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  rnd.shuffle = (arr) => arr.map(v => [rnd(), v]).sort((a,b)=>a[0]-b[0]).map(p=>p[1]);
  return rnd;
}

// ---------- 绘图辅助函数 ----------
export function withShadow(ctx, cb, alpha = 0, enabled = false) {
  ctx.save();
  if (enabled) {
    ctx.shadowColor = `rgba(0,0,0,${alpha})`;
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
  }
  cb();
  ctx.restore();
}

export function vignette(ctx, w, h, alpha = 0.18) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function makeGradient(ctx, x0, y0, x1, y1, colors) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const step = 1 / (colors.length - 1);
  colors.forEach((c, i) => g.addColorStop(i * step, c));
  return g;
}

export function pickColors(rnd, palette, n) {
  const pool = palette.colors.slice(1);
  const picked = rnd.shuffle(pool).slice(0, n);
  return picked;
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
}

// ---------- 颜色工具 ----------
export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') {
    return { r: 0, g: 0, b: 0 };
  }
  const s = hex.replace('#', '');
  const bigint = parseInt(s.length === 3 ? s.split('').map(c=>c+c).join('') : s, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

export function withAlpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function clamp01(v) { 
  return Math.max(0, Math.min(1, v)); 
}

export function lighten(hex, amt) {
  if (!hex || typeof hex !== 'string') {
    hex = '#000000';
  }
  const { r, g, b } = hexToRgb(hex);
  const L = (x) => Math.round(255 * clamp01(x / 255 + amt));
  return `rgb(${L(r)}, ${L(g)}, ${L(b)})`;
}

// ---------- 几何工具 ----------
export function circleFrom3Points(x1, y1, x2, y2, x3, y3) {
  const d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
  if (Math.abs(d) < 1e-6) return null;
  const x1s = x1 * x1 + y1 * y1;
  const x2s = x2 * x2 + y2 * y2;
  const x3s = x3 * x3 + y3 * y3;
  const cx = (x1s * (y2 - y3) + x2s * (y3 - y1) + x3s * (y1 - y2)) / d;
  const cy = (x1s * (x3 - x2) + x2s * (x1 - x3) + x3s * (x2 - x1)) / d;
  const r = Math.hypot(cx - x1, cy - y1);
  return { cx, cy, r };
}