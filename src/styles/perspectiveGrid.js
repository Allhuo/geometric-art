import { pickColors, makeGradient, withAlpha, lighten } from './utils.js';

// Perspective Grid: 透视网格 - 从中心向外辐射的线条网格
export function drawPerspectiveGrid(ctx, rnd, palette, { w, h, useGradient }) {
  const colors = pickColors(rnd, palette, 3);
  
  // 设置中心点（可以偏移制造不对称效果）
  const centerX = w * (0.45 + rnd() * 0.1);
  const centerY = h * (0.45 + rnd() * 0.1);
  
  // 选择网格类型：径向线 + 同心圆 或者 透视方格
  const gridType = rnd() > 0.5 ? 'radial' : 'perspective';
  
  if (gridType === 'radial') {
    // 径向线条 + 同心圆
    const radialLines = 24 + rnd.int(0, 16);
    const concentricRings = 12 + rnd.int(0, 8);
    
    // 绘制径向线
    for (let i = 0; i < radialLines; i++) {
      const angle = (i / radialLines) * Math.PI * 2;
      const lineColor = colors[i % colors.length];
      
      // 线条从中心延伸到边缘
      const maxRadius = Math.max(w, h) * 0.8;
      const endX = centerX + Math.cos(angle) * maxRadius;
      const endY = centerY + Math.sin(angle) * maxRadius;
      
      ctx.save();
      if (useGradient) {
        const grad = ctx.createLinearGradient(centerX, centerY, endX, endY);
        grad.addColorStop(0, withAlpha(lineColor, 0.9));
        grad.addColorStop(0.7, withAlpha(lineColor, 0.6));
        grad.addColorStop(1, withAlpha(lineColor, 0.2));
        ctx.strokeStyle = grad;
      } else {
        ctx.strokeStyle = withAlpha(lineColor, 0.7);
      }
      
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    }
    
    // 绘制同心圆
    for (let ring = 1; ring <= concentricRings; ring++) {
      const radius = (ring / concentricRings) * Math.min(w, h) * 0.4 + 20;
      const ringColor = colors[(ring - 1) % colors.length];
      
      ctx.save();
      ctx.strokeStyle = withAlpha(ringColor, 0.6 - ring * 0.03);
      ctx.lineWidth = 1 + Math.floor(ring / 4);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    
  } else {
    // 透视方格网格
    const gridSize = 20 + rnd.int(0, 10);
    const perspective = 0.8 + rnd() * 0.4; // 透视强度
    
    // 计算透视变换参数
    const vanishingX = centerX;
    const vanishingY = centerY;
    
    // 绘制水平线条
    for (let i = -gridSize; i <= gridSize; i++) {
      if (i === 0) continue; // 跳过中心线
      
      const t = i / gridSize;
      const baseY = h * 0.5 + t * h * 0.4;
      
      // 计算透视后的线条
      const leftX = 0;
      const rightX = w;
      const leftY = baseY + (vanishingY - baseY) * perspective * Math.abs(t);
      const rightY = baseY + (vanishingY - baseY) * perspective * Math.abs(t);
      
      const lineColor = colors[Math.abs(i) % colors.length];
      
      ctx.save();
      if (useGradient) {
        const grad = ctx.createLinearGradient(leftX, leftY, rightX, rightY);
        grad.addColorStop(0, withAlpha(lineColor, 0.3));
        grad.addColorStop(0.5, withAlpha(lineColor, 0.8));
        grad.addColorStop(1, withAlpha(lineColor, 0.3));
        ctx.strokeStyle = grad;
      } else {
        ctx.strokeStyle = withAlpha(lineColor, 0.7 - Math.abs(t) * 0.3);
      }
      
      ctx.lineWidth = 1 + Math.max(0, 3 - Math.abs(i));
      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.stroke();
      ctx.restore();
    }
    
    // 绘制垂直线条
    for (let i = -gridSize; i <= gridSize; i++) {
      if (i === 0) continue;
      
      const t = i / gridSize;
      const baseX = w * 0.5 + t * w * 0.4;
      
      // 计算透视后的线条
      const topY = 0;
      const bottomY = h;
      const topX = baseX + (vanishingX - baseX) * perspective * Math.abs(t);
      const bottomX = baseX + (vanishingX - baseX) * perspective * Math.abs(t);
      
      const lineColor = colors[Math.abs(i) % colors.length];
      
      ctx.save();
      if (useGradient) {
        const grad = ctx.createLinearGradient(topX, topY, bottomX, bottomY);
        grad.addColorStop(0, withAlpha(lineColor, 0.3));
        grad.addColorStop(0.5, withAlpha(lineColor, 0.8));
        grad.addColorStop(1, withAlpha(lineColor, 0.3));
        ctx.strokeStyle = grad;
      } else {
        ctx.strokeStyle = withAlpha(lineColor, 0.7 - Math.abs(t) * 0.3);
      }
      
      ctx.lineWidth = 1 + Math.max(0, 3 - Math.abs(i));
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(bottomX, bottomY);
      ctx.stroke();
      ctx.restore();
    }
  }
  
  // 在中心添加一个焦点
  const coreColor = colors[0];
  ctx.save();
  
  // 发光效果
  const glowGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25);
  glowGrad.addColorStop(0, withAlpha(coreColor, 0.9));
  glowGrad.addColorStop(0.7, withAlpha(coreColor, 0.4));
  glowGrad.addColorStop(1, withAlpha(coreColor, 0));
  
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
  ctx.fill();
  
  // 核心点
  ctx.fillStyle = useGradient ? 
    makeGradient(ctx, centerX - 8, centerY - 8, centerX + 8, centerY + 8,
      [lighten(coreColor, 0.3), coreColor]) : coreColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}