import { pickColors, makeGradient, lighten } from './utils.js';

// 等距立方体（正立方体比例、无间距拼接）
export function drawIsoCubes(ctx, rnd, palette, { w, h, useGradient, iso }) {
  const colsSetting = Math.max(3, Math.min(14, Math.round(iso?.cols ?? 6)));
  const rhombusWidth = Math.ceil(w / colsSetting);
  const rhombusHeight = rhombusWidth * Math.sqrt(3) / 2; // 保证正立方体比例
  const hexWidth = rhombusWidth;
  const hexHeight = rhombusHeight;
  const cols = Math.ceil(w / hexWidth) + 4;
  const rows = Math.ceil(h / hexHeight) + 4;

  const shade = Math.max(0.05, Math.min(0.5, iso?.shade ?? 0.22));
  const variety = Math.max(1, Math.min(8, Math.round(iso?.variety ?? 3)));
  const basePool = rnd.shuffle(palette.colors.slice(1));
  const baseColors = basePool.slice(0, Math.min(variety, basePool.length));

  for (let row = -2; row <= rows; row++) {
    for (let col = -2; col <= cols; col++) {
      const xOffset = (row % 2) * (hexWidth * 0.5);
      const cx = col * hexWidth + xOffset;
      const cy = row * hexHeight;

      const baseColor = baseColors[(row * cols + col + 1000) % baseColors.length] || palette.colors[1];
      const topColor = lighten(baseColor, shade);
      const leftColor = lighten(baseColor, -shade * 0.8);
      const rightColor = lighten(baseColor, -shade * 1.4);

      drawSpacedCube(ctx, cx, cy, rhombusWidth, rhombusHeight, topColor, leftColor, rightColor, useGradient);
    }
  }
}

// 绘制有间距的立方体（经典的3D立方体效果）
function drawSpacedCube(ctx, centerX, centerY, rhombusW, rhombusH, topColor, leftColor, rightColor, useGradient) {
  const halfW = rhombusW / 2;
  const halfH = rhombusH / 2;
  
  // 顶面菱形（水平的60°菱形）
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - halfH);           // 上顶点
  ctx.lineTo(centerX + halfW, centerY);           // 右顶点  
  ctx.lineTo(centerX, centerY + halfH);           // 下顶点
  ctx.lineTo(centerX - halfW, centerY);           // 左顶点
  ctx.closePath();
  ctx.fillStyle = useGradient ? 
    makeGradient(ctx, centerX - halfW, centerY - halfH, centerX + halfW, centerY + halfH, 
                 [lighten(topColor, 0.1), topColor]) : topColor;
  ctx.fill();
  
  // 左侧面（向左下的平行四边形）
  ctx.beginPath();
  ctx.moveTo(centerX - halfW, centerY);           // 与顶面共享的左顶点
  ctx.lineTo(centerX, centerY + halfH);           // 与顶面共享的下顶点
  ctx.lineTo(centerX, centerY + halfH + rhombusH); // 左侧面底部中点
  ctx.lineTo(centerX - halfW, centerY + rhombusH); // 左侧面底部左点
  ctx.closePath();
  ctx.fillStyle = useGradient ?
    makeGradient(ctx, centerX - halfW, centerY, centerX, centerY + halfH + rhombusH,
                 [lighten(leftColor, 0.05), leftColor]) : leftColor;
  ctx.fill();
  
  // 右侧面（向右下的平行四边形）
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + halfH);           // 与顶面共享的下顶点
  ctx.lineTo(centerX + halfW, centerY);           // 与顶面共享的右顶点
  ctx.lineTo(centerX + halfW, centerY + rhombusH); // 右侧面底部右点
  ctx.lineTo(centerX, centerY + halfH + rhombusH); // 右侧面底部中点
  ctx.closePath();
  ctx.fillStyle = useGradient ?
    makeGradient(ctx, centerX, centerY + halfH, centerX + halfW, centerY + halfH + rhombusH,
                 [rightColor, lighten(rightColor, -0.05)]) : rightColor;
  ctx.fill();
}