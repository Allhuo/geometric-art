// X Overlay风格：6个三角形设计
export function drawXOverlay(ctx, rnd, palette, { w, h }) {
  const cx = w / 2, cy = h / 2;

  // 选择4种颜色用于4个主要三角形
  const availableColors = palette.colors.slice(1);
  const colors = [];
  for (let i = 0; i < 4; i++) {
    const colorIndex = i % availableColors.length;
    colors.push(availableColors[colorIndex] || '#FF6A00');
  }

  // 关键坐标点
  const leftMid = [0, cy];           // 左边中点
  const rightMid = [w, cy];          // 右边中点
  const topQuarter = [cx, h / 4];    // 上1/4处
  const bottomQuarter = [cx, 3 * h / 4]; // 下3/4处

  const tri = (pts, fill) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };

  // 绘制4个主要等腰三角形
  tri([[0, 0], leftMid, topQuarter], colors[0]);        // 左上
  tri([leftMid, [0, h], bottomQuarter], colors[1]);     // 左下
  tri([[w, 0], rightMid, topQuarter], colors[2]);       // 右上
  tri([rightMid, [w, h], bottomQuarter], colors[3]);    // 右下

  // 绘制顶部渐变三角形
  ctx.save();
  const topGradient = ctx.createLinearGradient(0, 0, w, 0);
  topGradient.addColorStop(0, colors[0]); // 左上色
  topGradient.addColorStop(1, colors[2]); // 右上色
  tri([[0, 0], [w, 0], topQuarter], topGradient);

  // 绘制底部渐变三角形
  const bottomGradient = ctx.createLinearGradient(0, h, w, h);
  bottomGradient.addColorStop(0, colors[1]); // 左下色
  bottomGradient.addColorStop(1, colors[3]); // 右下色
  tri([[0, h], [w, h], bottomQuarter], bottomGradient);
  
  ctx.restore();

  // 中心菱形区域自然留空，不需要额外绘制
}