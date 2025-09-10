import { pickColors, makeGradient, withAlpha, lighten } from './utils.js';

// Corner Steps: 角落阶梯矩形
export function drawCornerSteps(ctx, rnd, palette, { w, h, useGradient, corner }) {
  const steps = Math.max(3, Math.min(20, Math.round(corner?.steps ?? 8)));
  const colors = pickColors(rnd, palette, Math.min(steps, 6));

  // 先铺满一个底色矩形（非背景色），确保不露底
  const base = colors[0] || palette.colors[1] || "#000";
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // 逐步从左上角向内"阶梯式"缩进，形成层叠
  const stepX = w * Math.max(0.02, Math.min(0.3, corner?.stepX ?? 0.10));
  const stepY = h * Math.max(0.02, Math.min(0.3, corner?.stepY ?? 0.12));
  const irregular = !!corner?.irregular;
  const jitterAmt = Math.max(0, Math.min(0.6, corner?.irregularAmt ?? 0.25));

  let accX = 0, accY = 0;
  for (let i = 1; i < steps; i++) {
    let dx = stepX;
    let dy = stepY;
    if (irregular) {
      const jx = (rnd() * 2 - 1) * stepX * jitterAmt;
      const jy = (rnd() * 2 - 1) * stepY * jitterAmt;
      dx = Math.max(0, stepX + jx);
      dy = Math.max(0, stepY + jy);
    }
    accX += dx;
    accY += dy;
    const x = Math.round(accX);
    const y = Math.round(accY);
    const ww = Math.max(0, Math.ceil(w - x));
    const hh = Math.max(0, Math.ceil(h - y));
    const c = colors[i % colors.length];
    const fill = useGradient 
      ? makeGradient(ctx, x, y, x + ww, y + hh, [lighten(c, 0.08), c]) 
      : c;
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, ww, hh);
  }
}

// Chevron: 斜视立方体（等距视角的三面体铺砖）
export function drawChevron(ctx, rnd, palette, { w, h, useGradient }) {
  const cols = 6;
  const cellW = Math.ceil(w / cols);
  const skew = 0.35;
  const height = Math.round(cellW);
  const rowStep = Math.round(height * 0.5);
  const rows = Math.ceil((h + height) / rowStep);

  const sideBase = pickColors(rnd, palette, 1)[0];
  const leftShade = lighten(sideBase, -0.22);
  const rightShade = lighten(sideBase, -0.10);
  const topChoices = pickColors(rnd, palette, 3);

  for (let r = -1; r < rows; r++) {
    const y = r * rowStep - Math.floor(height * 0.5);
    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const k = cellW * skew;
      const hh = height;
      const topCol = topChoices[(r + c + 1000) % topChoices.length];

      // 顶面（覆盖上半部分）
      ctx.beginPath();
      ctx.moveTo(x + k, y);
      ctx.lineTo(x + cellW - k, y);
      ctx.lineTo(x + cellW, y + hh * 0.5);
      ctx.lineTo(x, y + hh * 0.5);
      ctx.closePath();
      ctx.fillStyle = useGradient ? makeGradient(ctx, x, y, x + cellW, y + hh * 0.5, [topCol, lighten(topCol, 0.08)]) : topCol;
      ctx.fill();

      // 左侧面（与上下两行顶面拼合）
      ctx.beginPath();
      ctx.moveTo(x, y + hh * 0.5);
      ctx.lineTo(x + k, y);
      ctx.lineTo(x + k, y + hh);
      ctx.lineTo(x, y + hh * 1.5);
      ctx.closePath();
      ctx.fillStyle = useGradient ? makeGradient(ctx, x, y, x + k, y + hh, [leftShade, sideBase]) : leftShade;
      ctx.fill();

      // 右侧面
      ctx.beginPath();
      ctx.moveTo(x + cellW, y + hh * 0.5);
      ctx.lineTo(x + cellW - k, y);
      ctx.lineTo(x + cellW - k, y + hh);
      ctx.lineTo(x + cellW, y + hh * 1.5);
      ctx.closePath();
      ctx.fillStyle = useGradient ? makeGradient(ctx, x + cellW - k, y, x + cellW, y + hh, [rightShade, sideBase]) : rightShade;
      ctx.fill();
    }
  }
}

// Rhombus Weave: 菱形编织效果
export function drawRhombusWeave(ctx, rnd, palette, { w, h, useGradient }) {
  const cubeWidth = Math.min(w, h) / 6;
  const rhombusWidth = cubeWidth;
  const rhombusHeight = cubeWidth * Math.sqrt(3) / 2;
  
  const hexWidth = rhombusWidth;
  const hexHeight = rhombusHeight;
  
  const cols = Math.ceil(w / hexWidth) + 4;
  const rows = Math.ceil(h / hexHeight) + 4;
  
  const baseColors = pickColors(rnd, palette, 4);
  
  for (let row = -2; row <= rows; row++) {
    for (let col = -2; col <= cols; col++) {
      const xOffset = (row % 2) * (hexWidth * 0.5);
      const cx = col * hexWidth + xOffset;
      const cy = row * hexHeight;
      
      const baseColor = baseColors[(row * cols + col + 1000) % baseColors.length];
      
      const topColor = lighten(baseColor, 0.2);
      const leftColor = baseColor;
      const rightColor = lighten(baseColor, -0.3);
      
      drawCube(ctx, cx, cy, rhombusWidth, rhombusHeight, topColor, leftColor, rightColor, useGradient);
    }
  }
}

// 绘制单个立方体（由3个60°菱形组成，完全拼接）
function drawCube(ctx, centerX, centerY, rhombusW, rhombusH, topColor, leftColor, rightColor, useGradient) {
  const halfW = rhombusW / 2;
  const halfH = rhombusH / 2;
  
  // 顶面菱形
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - halfH);
  ctx.lineTo(centerX + halfW, centerY);
  ctx.lineTo(centerX, centerY + halfH);
  ctx.lineTo(centerX - halfW, centerY);
  ctx.closePath();
  ctx.fillStyle = useGradient ? 
    makeGradient(ctx, centerX - halfW, centerY - halfH, centerX + halfW, centerY + halfH, 
                 [lighten(topColor, 0.1), topColor]) : topColor;
  ctx.fill();
  
  // 左侧面菱形
  ctx.beginPath();
  ctx.moveTo(centerX - halfW, centerY);
  ctx.lineTo(centerX, centerY + halfH);
  ctx.lineTo(centerX - halfW, centerY + rhombusH);
  ctx.lineTo(centerX - rhombusW, centerY + halfH);
  ctx.closePath();
  ctx.fillStyle = useGradient ?
    makeGradient(ctx, centerX - rhombusW, centerY, centerX, centerY + rhombusH,
                 [lighten(leftColor, 0.05), leftColor]) : leftColor;
  ctx.fill();
  
  // 右侧面菱形
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + halfH);
  ctx.lineTo(centerX + halfW, centerY);
  ctx.lineTo(centerX + rhombusW, centerY + halfH);
  ctx.lineTo(centerX + halfW, centerY + rhombusH);
  ctx.closePath();
  ctx.fillStyle = useGradient ?
    makeGradient(ctx, centerX, centerY + halfH, centerX + rhombusW, centerY + rhombusH,
                 [rightColor, lighten(rightColor, -0.05)]) : rightColor;
  ctx.fill();
}