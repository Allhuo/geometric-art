import { pickColors, makeGradient, withAlpha, lighten } from './utils.js';

// Transformer Attention: 变换器注意力矩阵可视化
export function drawTransformerAttention(ctx, rnd, palette, { w, h, useGradient }) {
  const colors = pickColors(rnd, palette, 5);
  const matrixSize = 12 + rnd.int(0, 6); // 12x12 到 18x18 的注意力矩阵
  const margin = Math.min(w, h) * 0.1;
  const cellSize = Math.min((w - margin * 2) / matrixSize, (h - margin * 2) / matrixSize);
  
  // 计算矩阵居中位置
  const startX = (w - cellSize * matrixSize) / 2;
  const startY = (h - cellSize * matrixSize) / 2;
  
  // 生成注意力权重矩阵
  const attentionMatrix = [];
  for (let i = 0; i < matrixSize; i++) {
    attentionMatrix[i] = [];
    for (let j = 0; j < matrixSize; j++) {
      let weight = 0;
      
      // 自注意力（对角线）
      if (i === j) {
        weight = 0.7 + rnd() * 0.3;
      }
      // 局部注意力（临近位置）
      else if (Math.abs(i - j) <= 2) {
        weight = 0.3 + rnd() * 0.4;
      }
      // 长距离依赖（稀疏）
      else if (rnd() < 0.1) {
        weight = 0.4 + rnd() * 0.5;
      }
      // 其他位置（较弱注意力）
      else {
        weight = rnd() * 0.25;
      }
      
      attentionMatrix[i][j] = weight;
    }
  }
  
  // 绘制注意力矩阵
  for (let i = 0; i < matrixSize; i++) {
    for (let j = 0; j < matrixSize; j++) {
      const x = startX + j * cellSize;
      const y = startY + i * cellSize;
      const weight = attentionMatrix[i][j];
      
      // 根据权重选择颜色和透明度
      const colorIndex = Math.floor(weight * (colors.length - 0.001));
      const baseColor = colors[Math.min(colorIndex, colors.length - 1)];
      const alpha = 0.3 + weight * 0.7;
      
      // 绘制单元格
      ctx.save();
      ctx.globalAlpha = alpha;
      
      if (useGradient) {
        const g = ctx.createRadialGradient(
          x + cellSize / 2, y + cellSize / 2, 0,
          x + cellSize / 2, y + cellSize / 2, cellSize / 2
        );
        g.addColorStop(0, lighten(baseColor, 0.3));
        g.addColorStop(1, baseColor);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = baseColor;
      }
      
      // 圆角矩形效果
      const radius = cellSize * 0.1;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, radius);
      ctx.fill();
      
      // 高注意力区域添加额外高亮
      if (weight > 0.7) {
        ctx.fillStyle = withAlpha("#FFFFFF", weight * 0.4);
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }
  
  // 添加多头注意力的层次感（绘制几个半透明的重复矩阵）
  const numHeads = 3;
  for (let head = 1; head < numHeads; head++) {
    const offset = head * 8;
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.translate(offset, offset);
    
    for (let i = 0; i < Math.min(matrixSize - 1, matrixSize); i++) {
      for (let j = 0; j < Math.min(matrixSize - 1, matrixSize); j++) {
        if (startX + (j + 1) * cellSize + offset > w || startY + (i + 1) * cellSize + offset > h) continue;
        
        const x = startX + j * cellSize;
        const y = startY + i * cellSize;
        const weight = attentionMatrix[i][j] * (1 - head * 0.3);
        
        const colorIndex = Math.floor(weight * (colors.length - 0.001));
        const baseColor = colors[Math.min(colorIndex, colors.length - 1)];
        
        ctx.fillStyle = baseColor;
        const radius = cellSize * 0.05;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, radius);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }
}

// Latent Space: 简洁的多维空间网格
export function drawLatentSpace(ctx, rnd, palette, { w, h, useGradient }) {
  // 秩序化：规则六边格 + 量化色带（去除辉光/节点/描边）
  const base = pickColors(rnd, palette, 1)[0];
  const toneA = lighten(base, 0.32);
  const toneB = lighten(base, 0.0);
  const toneC = lighten(base, -0.22);
  const tones = [toneA, toneB, toneC];

  const hexRadius = Math.min(w, h) / 18;
  const hexHeight = hexRadius * Math.sqrt(3);
  const hexWidth = hexRadius * 2;

  const cols = Math.ceil(w / (hexWidth * 0.75)) + 4;
  const rows = Math.ceil(h / hexHeight) + 4;

  // 色带方向与密度（限定范围，保证秩序与节奏）
  const angle = (rnd() * 0.5 + 0.25) * Math.PI; // 45°~135°
  const dirX = Math.cos(angle), dirY = Math.sin(angle);
  const bands = 12 + rnd.int(0, 6);

  // 网格整体居中偏移
  const gridW = cols * hexWidth * 0.75 + hexWidth * 0.25;
  const gridH = rows * hexHeight + hexHeight * 0.5;
  const offX = (w - gridW) / 2 + hexWidth * 0.5;
  const offY = (h - gridH) / 2 + hexHeight * 0.5;

  ctx.save();
  ctx.translate(offX, offY);

  for (let row = -2; row < rows; row++) {
    for (let col = -2; col < cols; col++) {
      // 正确的平铺：奇偶行水平偏移为半个 hex 宽度，避免三角空洞
      const xOffset = (row % 2) * (hexWidth * 0.5);
      const x = col * hexWidth * 0.75 + xOffset;
      const y = row * hexHeight;

      const nx = (x - gridW / 2) / Math.max(1, gridW);
      const ny = (y - gridH / 2) / Math.max(1, gridH);
      const s = (nx * dirX + ny * dirY + 1) * 0.5; // 0..1
      const k = Math.floor(s * bands) % 3;

      ctx.fillStyle = useGradient
        ? makeGradient(ctx, x - hexRadius, y - hexRadius, x + hexRadius, y + hexRadius, [lighten(tones[k], 0.15), tones[k]])
        : tones[k];

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const hx = x + Math.cos(a) * hexRadius;
        const hy = y + Math.sin(a) * hexRadius;
        if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

// Gradient Flow: 简洁的流线图案
export function drawGradientFlow(ctx, rnd, palette, { w, h, useGradient }) {
  // 同焦椭圆（双焦点）等距等高线：一组不相交的环，秩序清晰
  const [cA, cB] = pickColors(rnd, palette, 2);
  const midX = w * 0.5;
  const midY = h * (0.5 + (rnd() - 0.5) * 0.06);
  const focusGap = Math.min(w, h) * 0.34; // 焦点间距（大致控制形状拉伸）
  const f1x = midX - focusGap * 0.5;
  const f2x = midX + focusGap * 0.5;
  const fY = midY;

  // 选择一组主轴半径 a_k，使 a > c，b = sqrt(a^2 - c^2)
  const c = focusGap * 0.5;
  const rings = 12 + rnd.int(0, 6);
  const a0 = c * 1.05; // 最内层略大于 c，避免夹点
  const aStep = Math.min(w, h) * 0.018; // 等距层增量

  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';

  for (let k = 0; k < rings; k++) {
    const a = a0 + k * aStep;
    const b2 = a * a - c * c;
    if (b2 <= 0) continue;
    const b = Math.sqrt(b2);

    // 单色或轻微渐变（纵向）
    const color = k % 2 === 0 ? cA : cB;
    ctx.strokeStyle = useGradient
      ? makeGradient(ctx, midX, midY - b, midX, midY + b, [withAlpha(lighten(color, 0.15), 0.95), withAlpha(color, 0.95)])
      : withAlpha(color, 0.95);

    // 参数方程：x(t) = midX + a cos t, y(t) = midY + b sin t
    const seg = 320;
    ctx.beginPath();
    for (let i = 0; i <= seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      const x = midX + a * Math.cos(t);
      const y = midY + b * Math.sin(t);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
