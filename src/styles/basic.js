import { pickColors, makeGradient, withAlpha, lighten } from './utils.js';

// Concentric: nested sharp rectangles with gradients
export function drawConcentric(ctx, rnd, palette, { w, h, useGradient }) {
  const steps = 10 + rnd.int(0, 6);
  const margin = 160;
  const colors = pickColors(rnd, palette, Math.min(6, steps));

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const x = margin + (w - margin * 2) * (t / 2);
    const y = margin + (h - margin * 2) * (t / 2);
    const ww = w - x * 2;
    const hh = h - y * 2;

    const c = colors[i % colors.length];
    if (useGradient) {
      const g = makeGradient(ctx, x, y, x + ww, y + hh, [c, withAlpha(c, 0.8)]);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = c;
    }
    ctx.fillRect(x, y, ww, hh);
  }
}

// Diamonds: grid pattern of diamond shapes with geometric repetition
export function drawDiamonds(ctx, rnd, palette, { w, h, useGradient }) {
  const colors = pickColors(rnd, palette, 6);
  const margin = 60;
  const gridSize = Math.min(w, h) / 8;
  const cols = Math.floor((w - margin * 2) / gridSize);
  const rows = Math.floor((h - margin * 2) / gridSize);
  
  const offsetX = (w - cols * gridSize) / 2;
  const offsetY = (h - rows * gridSize) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * gridSize + gridSize / 2;
      const y = offsetY + r * gridSize + gridSize / 2;
      const size = gridSize * 0.35;
      
      // Create pattern variations
      const pattern = (r + c) % 3;
      const colorIndex = (r * cols + c) % colors.length;
      const color = colors[colorIndex];
      
      if (pattern === 0) {
        // Diamond
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fillStyle = useGradient ? makeGradient(ctx, x - size, y - size, x + size, y + size, [color, withAlpha(color, 0.6)]) : color;
        ctx.fill();
      } else if (pattern === 1) {
        // Square rotated 45°
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = useGradient ? makeGradient(ctx, -size, -size, size, size, [color, lighten(color, 0.2)]) : color;
        ctx.fillRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
        ctx.restore();
      } else {
        // Circle
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        if (useGradient) {
          const g = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size * 0.8);
          g.addColorStop(0, lighten(color, 0.3));
          g.addColorStop(1, color);
          ctx.fillStyle = g;
        } else {
          ctx.fillStyle = color;
        }
        ctx.fill();
      }
    }
  }
}

// Orbs: overlapping circles with clean transparency effects
export function drawOrbs(ctx, rnd, palette, { w, h, useGradient }) {
  const n = 8 + rnd.int(0, 4);
  const colors = pickColors(rnd, palette, n);
  const centerX = w / 2;
  const centerY = h / 2;
  const maxRadius = Math.min(w, h) * 0.4;

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + rnd() * 0.5;
    const distance = rnd() * maxRadius * 0.6;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    const r = maxRadius * (0.15 + rnd() * 0.25);
    const c = colors[i % colors.length];

    ctx.save();
    ctx.globalAlpha = 0.7 + rnd() * 0.3;
    
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    
    if (useGradient) {
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      g.addColorStop(0, lighten(c, 0.4));
      g.addColorStop(0.7, c);
      g.addColorStop(1, withAlpha(c, 0.3));
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = c;
    }
    ctx.fill();
    ctx.restore();
  }
}

// Bands: horizontal bands with random heights and soft blends
export function drawBands(ctx, rnd, palette, { w, h, useGradient }) {
  const colors = pickColors(rnd, palette, 6);
  let y = 0;
  while (y < h) {
    const bandH = Math.min(h - y, rnd.int(Math.floor(h * 0.07), Math.floor(h * 0.22)));
    const c1 = colors[rnd.int(0, colors.length - 1)];
    const c2 = colors[rnd.int(0, colors.length - 1)];
    const g = useGradient ? makeGradient(ctx, 0, y, w, y + bandH, [c1, c2]) : c1;

    ctx.fillStyle = g;
    ctx.fillRect(0, y, w, bandH);

    // thin spacer line for rhythm
    if (rnd() < 0.4) {
      ctx.fillStyle = withAlpha("#000000", 0.08);
      ctx.fillRect(0, y + bandH - 2, w, 2);
    }

    y += bandH;
  }
}