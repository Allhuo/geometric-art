import { pickColors, makeGradient, withAlpha, lighten } from './utils.js';

// Waves: flowing wave patterns with layered transparency
export function drawWaves(ctx, rnd, palette, { w, h, useGradient }) {
  const colors = pickColors(rnd, palette, 5);
  const waveCount = 4 + rnd.int(0, 3);
  
  for (let i = 0; i < waveCount; i++) {
    const amplitude = h * (0.1 + rnd() * 0.15);
    const frequency = 2 + rnd() * 3;
    const phase = rnd() * Math.PI * 2;
    const yOffset = (h / waveCount) * i + rnd() * (h * 0.1);
    const color = colors[i % colors.length];
    
    ctx.save();
    ctx.globalAlpha = 0.6 + rnd() * 0.4;
    
    ctx.beginPath();
    ctx.moveTo(0, yOffset);
    
    for (let x = 0; x <= w; x += 2) {
      const y = yOffset + Math.sin((x / w) * frequency * Math.PI + phase) * amplitude;
      ctx.lineTo(x, y);
    }
    
    // Close the wave shape
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    
    if (useGradient) {
      const g = makeGradient(ctx, 0, yOffset - amplitude, w, yOffset + amplitude, 
        [withAlpha(lighten(color, 0.3), 0.8), withAlpha(color, 0.9)]);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = withAlpha(color, 0.8);
    }
    ctx.fill();
    ctx.restore();
  }
}

// Flow Ribbons (thick–thin–thick bezier ribbons)
export function drawFlowRibbons(ctx, rnd, palette, { w, h, useGradient }) {
  const ribbons = 3 + rnd.int(0, 3);
  const colors = pickColors(rnd, palette, Math.min(6, ribbons + 2));

  const bez = (t, p0, p1, p2, p3) => (
    (
      (1 - t) ** 3 * p0 +
      3 * (1 - t) ** 2 * t * p1 +
      3 * (1 - t) * t ** 2 * p2 +
      t ** 3 * p3
    )
  );
  const dbez = (t, p0, p1, p2, p3) => (
    (
      -3 * (1 - t) ** 2 * p0 +
      (3 * (1 - t) ** 2 - 6 * (1 - t) * t) * p1 +
      (6 * (1 - t) * t - 3 * t ** 2) * p2 +
      3 * t ** 2 * p3
    )
  );

  for (let i = 0; i < ribbons; i++) {
    const c = colors[i % colors.length];
    const a = i / (ribbons - 1 + 1e-6);
    const y0 = h * (0.15 + 0.7 * a) + rnd() * 20 - 10;
    const y1 = h * (0.15 + 0.7 * (1 - a)) + rnd() * 20 - 10;
    const cp1 = { x: w * (0.25 + 0.1 * rnd()), y: y0 + (rnd() - 0.5) * h * 0.3 };
    const cp2 = { x: w * (0.75 - 0.1 * rnd()), y: y1 + (rnd() - 0.5) * h * 0.3 };
    const p0 = { x: -w * 0.05, y: y0 };
    const p3 = { x: w * 1.05, y: y1 };

    const samples = 90;
    const left = [];
    const right = [];
    const baseW = Math.max(8, Math.min(w, h) * 0.06) * (0.9 + rnd() * 0.2);

    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      const x = bez(t, p0.x, cp1.x, cp2.x, p3.x);
      const y = bez(t, p0.y, cp1.y, cp2.y, p3.y);
      const dx = dbez(t, p0.x, cp1.x, cp2.x, p3.x);
      const dy = dbez(t, p0.y, cp1.y, cp2.y, p3.y);
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len; // 法向
      // 厚薄节奏：厚-薄-厚
      const wv = baseW * (0.55 + 0.45 * (1 + Math.cos(2 * Math.PI * t)) / 2);
      left.push([x + nx * wv / 2, y + ny * wv / 2]);
      right.push([x - nx * wv / 2, y - ny * wv / 2]);
    }

    // 组装多边形
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (let k = 1; k < left.length; k++) ctx.lineTo(left[k][0], left[k][1]);
    for (let k = right.length - 1; k >= 0; k--) ctx.lineTo(right[k][0], right[k][1]);
    ctx.closePath();
    if (useGradient) {
      const g = makeGradient(ctx, left[0][0], left[0][1], right[Math.floor(right.length/2)][0], right[Math.floor(right.length/2)][1], [lighten(c, 0.15), c]);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = withAlpha(c, 0.9);
    }
    ctx.fill();
  }
}