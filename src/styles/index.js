// 风格索引文件 - 统一导出所有绘图风格

// 基础几何风格
import { drawConcentric, drawDiamonds, drawOrbs, drawBands } from './basic.js';

// 几何图案风格
import { drawGrid, drawSunburst, drawDiagStripes, drawConcentricDiamonds, drawKites } from './geometric.js';

// 流动风格
import { drawWaves, drawFlowRibbons } from './flows.js';

// 高级风格
import { drawCornerSteps, drawChevron, drawRhombusWeave } from './advanced.js';

// 特色风格
import { drawXOverlay } from './xOverlay.js';
import { drawIsoCubes } from './isoCubes.js';
import { drawOrbTrail } from './orbTrail.js';

// 机器学习风格
import { drawTransformerAttention, drawLatentSpace, drawGradientFlow } from './mlStyles.js';

// 透视风格
import { drawPerspectiveGrid } from './perspectiveGrid.js';

// 工具函数
export * from './utils.js';

// 风格配置
export const STYLE_OPTIONS = [
  { id: "concentric", label: "Concentric" },
  { id: "diamonds", label: "Diamonds" },
  { id: "orbs", label: "Orbs" },
  { id: "bands", label: "Bands" },
  { id: "grid", label: "Grid" },
  { id: "waves", label: "Waves" },
  { id: "kites", label: "Kites" },
  { id: "cornerSteps", label: "Corner Steps" },
  { id: "orbTrail", label: "Orb Trail" },
  { id: "chevron", label: "Chevron" },
  { id: "rhombusWeave", label: "Rhombus Weave" },
  { id: "isoCubes", label: "Iso Cubes" },
  { id: "xOverlay", label: "X Overlay" },
  { id: "flowRibbons", label: "Flow Ribbons" },
  { id: "sunburst", label: "Sunburst" },
  { id: "diagStripes", label: "Diag Stripes" },
  { id: "concentricDiamonds", label: "Concentric Diamonds" },
  { id: "transformerAttention", label: "Transformer Attention" },
  { id: "latentSpace", label: "Latent Space" },
  { id: "gradientFlow", label: "Gradient Flow" },
  { id: "perspectiveGrid", label: "Perspective Grid" },
];

// 风格绘制函数映射
export const drawStyleMap = {
  concentric: drawConcentric,
  diamonds: drawDiamonds,
  orbs: drawOrbs,
  bands: drawBands,
  grid: drawGrid,
  waves: drawWaves,
  kites: drawKites,
  cornerSteps: drawCornerSteps,
  orbTrail: drawOrbTrail,
  chevron: drawChevron,
  rhombusWeave: drawRhombusWeave,
  isoCubes: drawIsoCubes,
  xOverlay: drawXOverlay,
  flowRibbons: drawFlowRibbons,
  sunburst: drawSunburst,
  diagStripes: drawDiagStripes,
  concentricDiamonds: drawConcentricDiamonds,
  transformerAttention: drawTransformerAttention,
  latentSpace: drawLatentSpace,
  gradientFlow: drawGradientFlow,
  perspectiveGrid: drawPerspectiveGrid,
};

// 调色盘配置
export const PALETTES = [
  { name: "Deep Navy Pop", colors: ["#0A0B1A", "#1F3BFF", "#F43F5E", "#FF8A00", "#19E1FF", "#FFFFFF"] },
  { name: "ICLR Classic", colors: ["#0B1026", "#2B3AF6", "#EE3E7A", "#F7B500", "#FF6A00", "#FFFFFF"] },
  { name: "Sunset Blocks", colors: ["#0F0F10", "#2E3192", "#F2467D", "#FF6A00", "#FFB36B", "#FFFFFF"] },
  { name: "Pastel Steps", colors: ["#FFFFFF", "#EAC6D8", "#D9B8A8", "#B69E86", "#8FA5C2", "#E9C2B2"] },
  { name: "Electric", colors: ["#101010", "#0072F5", "#00E7F0", "#FF4ECD", "#FF8C00", "#F5F5F7"] },
  { name: "Citrus", colors: ["#10131B", "#2A6CF6", "#FF3366", "#FFB100", "#00D48A", "#FFFFFF"] },
  { name: "Bauhaus Primary", colors: ["#0D0D0D", "#0057FF", "#FF2B00", "#FFB400", "#00B050", "#FFFFFF"] },
  { name: "Midnight Neon", colors: ["#0B0B1E", "#00E5FF", "#6C63FF", "#FF3EA5", "#FFB800", "#FFFFFF"] },
  { name: "Vaporwave", colors: ["#0F1026", "#7A77FF", "#FF68C6", "#FFA54B", "#4DE6FF", "#FFFFFF"] },
  { name: "Nordic Calm", colors: ["#FFFFFF", "#CFE6FF", "#C9E4D8", "#F9D6D1", "#E5D6FF", "#A8B6C6"] },
  { name: "Retro Pop", colors: ["#111111", "#00C2A8", "#FF4E4E", "#FFC542", "#3D6BFF", "#FFFFFF"] },
  { name: "Aurora", colors: ["#0B1022", "#57D2FF", "#4DE38A", "#FFD166", "#C77DFF", "#FFFFFF"] },
  { name: "Desert Dusk", colors: ["#0E0C0A", "#F2994A", "#F2C94C", "#EB5757", "#6FCF97", "#FFFFFF"] },
  { name: "Moss Forest", colors: ["#0C0F0C", "#6EE7B7", "#34D399", "#93C5FD", "#FBBF24", "#FFFFFF"] },
  { name: "Mono Blues", colors: ["#070B1A", "#143DFF", "#386BFF", "#71A1FF", "#AFC6FF", "#FFFFFF"] },
];

export const ASPECT_RATIOS = [
  { id: "square", label: "1:1", width: 1200, height: 1200 },
  { id: "landscape", label: "16:9", width: 1920, height: 1080 },
  { id: "portrait", label: "3:4", width: 1200, height: 1600 },
];