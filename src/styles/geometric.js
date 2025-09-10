import { pickColors, makeGradient, withAlpha, lighten } from './utils.js';

// Grid: structured grid with varied geometric shapes
export function drawGrid(ctx, rnd, palette, { w, h, useGradient }) {
  const colors = pickColors(rnd, palette, 8);
  const margin = 40;
  const gridSize = Math.min(w, h) / 12;
  const cols = Math.floor((w - margin * 2) / gridSize);
  const rows = Math.floor((h - margin * 2) / gridSize);
  
  const offsetX = (w - cols * gridSize) / 2;
  const offsetY = (h - rows * gridSize) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * gridSize;
      const y = offsetY + r * gridSize;
      const size = gridSize * 0.85;
      const colorIndex = (r * cols + c) % colors.length;
      const color = colors[colorIndex];
      
      // Create checkerboard-like pattern
      if ((r + c) % 2 === 0) {
        // Filled squares
        ctx.fillStyle = useGradient ? 
          makeGradient(ctx, x, y, x + size, y + size, [color, withAlpha(color, 0.7)]) : 
          color;
        ctx.fillRect(x + gridSize * 0.05, y + gridSize * 0.05, size, size);
      } else {
        // Circles or other shapes
        const shape = rnd.int(0, 2);
        ctx.fillStyle = useGradient ?
          makeGradient(ctx, x, y, x + size, y + size, [lighten(color, 0.2), color]) :
          color;
        
        if (shape === 0) {
          // Circle
          ctx.beginPath();
          ctx.arc(x + gridSize / 2, y + gridSize / 2, size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Triangle
          ctx.beginPath();
          ctx.moveTo(x + gridSize / 2, y + gridSize * 0.1);
          ctx.lineTo(x + gridSize * 0.9, y + gridSize * 0.9);
          ctx.lineTo(x + gridSize * 0.1, y + gridSize * 0.9);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }
}

// Sunburst radial wedges from center
export function drawSunburst(ctx, rnd, palette, { w, h, useGradient }) {
  const cx = w / 2, cy = h / 2;
  const radius = Math.hypot(w, h) * 0.65;
  const wedges = 14 + rnd.int(0, 10);
  const colors = pickColors(rnd, palette, Math.min(6, wedges));
  const rot = rnd() * Math.PI;
  for (let i = 0; i < wedges; i++) {
    const a0 = rot + (i / wedges) * Math.PI * 2;
    const a1 = rot + ((i + 1) / wedges) * Math.PI * 2;
    const c = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * radius, cy + Math.sin(a0) * radius);
    ctx.lineTo(cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius);
    ctx.closePath();
    if (useGradient) {
      const g = makeGradient(ctx, cx, cy, cx + Math.cos((a0+a1)/2)*radius, cy + Math.sin((a0+a1)/2)*radius, [lighten(c, 0.15), c]);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = c;
    }
    ctx.fill();
  }
}

// Diagonal stripes with varying width
export function drawDiagStripes(ctx, rnd, palette, { w, h, useGradient }) {
  const angle = -Math.PI / 4; // -45°
  const stripeW = Math.max(30, Math.min(w, h) * 0.08);
  const count = Math.ceil((w + h) / stripeW) + 2;
  const colors = pickColors(rnd, palette, 6);
  ctx.save();
  ctx.translate(w/2, h/2);
  ctx.rotate(angle);
  ctx.translate(-w/2, -h/2);
  for (let i = -1; i < count; i++) {
    const x = i * stripeW;
    const c = colors[(i+1000) % colors.length];
    ctx.fillStyle = useGradient ? makeGradient(ctx, x, 0, x+stripeW, h, [lighten(c, 0.1), c]) : c;
    ctx.fillRect(x, -h, stripeW * 0.9, h*3); // slight gap for rhythm
  }
  ctx.restore();
}

// Concentric diamonds
export function drawConcentricDiamonds(ctx, rnd, palette, { w, h, useGradient }) {
  const cx = w/2, cy = h/2;
  const steps = 10 + rnd.int(0, 8);
  const colors = pickColors(rnd, palette, Math.min(6, steps));
  for (let i = steps; i >= 1; i--) {
    const t = i / steps;
    const dx = (w * 0.45) * t;
    const dy = (h * 0.35) * t;
    const c = colors[(steps - i) % colors.length];
    ctx.beginPath();
    ctx.moveTo(cx - dx, cy);
    ctx.lineTo(cx, cy - dy);
    ctx.lineTo(cx + dx, cy);
    ctx.lineTo(cx, cy + dy);
    ctx.closePath();
    ctx.fillStyle = useGradient ? makeGradient(ctx, cx - dx, cy - dy, cx + dx, cy + dy, [lighten(c, 0.08), c]) : c;
    ctx.fill();
  }
}

// Kites: 中央白色菱形 + 四向彩色楔形
export function drawKites(ctx, rnd, palette, { w, h, useGradient }) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = w * 0.28;
  const dy = h * 0.22;
  const colors = pickColors(rnd, palette, 4);

  const poly = (pts, fill) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };

  const gFill = (x0, y0, x1, y1, c1, c2) => useGradient ? makeGradient(ctx, x0, y0, x1, y1, [c1, c2]) : c1;

  // 左上楔形
  poly([
    [0, 0],
    [cx, cy - dy],
    [cx - dx, cy],
  ], gFill(0, 0, cx, cy, colors[0], lighten(colors[0], 0.15)));
  
  // 左下楔形
  poly([
    [0, h],
    [cx - dx, cy],
    [cx, cy + dy],
  ], gFill(0, h, cx, cy, colors[1], lighten(colors[1], 0.15)));
  
  // 右上楔形
  poly([
    [w, 0],
    [cx + dx, cy],
    [cx, cy - dy],
  ], gFill(w, 0, cx, cy, colors[2], lighten(colors[2], 0.15)));
  
  // 右下楔形
  poly([
    [w, h],
    [cx, cy + dy],
    [cx + dx, cy],
  ], gFill(w, h, cx, cy, colors[3], lighten(colors[3], 0.15)));

  // 中央白色菱形
  ctx.beginPath();
  ctx.moveTo(cx - dx, cy);
  ctx.lineTo(cx, cy - dy);
  ctx.lineTo(cx + dx, cy);
  ctx.lineTo(cx, cy + dy);
  ctx.closePath();
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
}