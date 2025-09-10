import { circleFrom3Points } from './utils.js';

// 沿对角线的圆盘轨迹（可调控、圆半径固定）
export function drawOrbTrail(ctx, rnd, palette, { w, h, orb }) {
  const count = Math.max(3, Math.min(12, Math.round(orb?.count ?? 7)));
  const gamma = Math.max(1.0, Math.min(3.0, orb?.gamma ?? 1.75));
  const radius = Math.min(w, h) * Math.max(0.06, Math.min(0.25, orb?.radiusPct ?? 0.14));
  const endX = w * (orb?.endX ?? 0.84);
  const endY = h * (orb?.endY ?? 0.84);
  const trailScale = Math.max(0.5, Math.min(1.4, orb?.trailScale ?? 0.9));
  const curvature = Math.max(-0.3, Math.min(0.3, orb?.curvature ?? 0));

  // 方向向量 (1,1)，单位化
  const inv = Math.SQRT1_2; // 1/√2
  const dx = inv, dy = inv;
  const diag = Math.sqrt(w * w + h * h);
  const L = diag * trailScale;

  // 右下为终点，从终点向左上回退 L 得到起点（可部分在画外）
  let S;
  if (orb?.manualStart) {
    S = { x: w * orb.startX, y: h * orb.startY };
  } else {
    S = { x: endX - dx * L, y: endY - dy * L };
  }
  const E = { x: endX, y: endY };

  // 中点：以画面中心为基，沿法向量（-dy, dx）偏移控制弯曲
  const nx = -dy, ny = dx; // 与(1,1)垂直
  const M = { x: w * 0.5 + nx * curvature * Math.min(w, h), y: h * 0.5 + ny * curvature * Math.min(w, h) };

  const circle = circleFrom3Points(S.x, S.y, M.x, M.y, E.x, E.y);
  if (!circle) return;
  const { cx, cy, r: R } = circle;

  // 角度顺序处理，确保 S -> E 单调
  let a0 = Math.atan2(S.y - cy, S.x - cx);
  let am = Math.atan2(M.y - cy, M.x - cx);
  let a1 = Math.atan2(E.y - cy, E.x - cx);
  while (am < a0) am += Math.PI * 2;
  while (a1 < a0) a1 += Math.PI * 2;
  if (am > a1) a1 += Math.PI * 2;

  // 颜色顺序：随机化调色盘（跳过背景色），最后一个为白色
  const base = rnd.shuffle(palette.colors.slice(1));
  const colors = [];
  for (let i = 0; i < count - 1; i++) colors.push(base[i % base.length]);
  colors.push("#FFFFFF");

  for (let i = 0; i < count; i++) {
    const t = Math.pow(i / (count - 1), gamma);
    const ang = a0 + (a1 - a0) * t;
    const x = cx + R * Math.cos(ang);
    const y = cy + R * Math.sin(ang);
    const c = colors[i];

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  }
}