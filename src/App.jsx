import React, { useEffect, useMemo, useRef, useState } from "react";

/*
 * Generative Geometric Art — single-file React component
 * ------------------------------------------------------
 * • HTML Canvas rendering at 2x pixel ratio for crisp export
 * • Multiple styles: Cubes, Concentric, Diamonds, Orbs, Bands
 * • Curated palettes inspired by modern geometric/AI paper covers
 * • Deterministic seeds + Randomize + PNG export
 * • Tailwind for minimal UI
 *
 * How to use:
 * 1) Drop into a React project (Tailwind optional).
 * 2) Click “Generate” to refresh; change Style/Palette/Seed.
 * 3) “Export PNG” downloads a 3:4 poster at 1200×1600.
 */

// ---------- Utilities: seeded PRNG ----------
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function sfc32(a, b, c, d) {
  return function () {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}
function makePRNG(seedStr) {
  const seed = xmur3(seedStr || "seed")();
  const seed2 = xmur3(seedStr + "$")();
  const seed3 = xmur3("@" + seedStr)();
  const seed4 = xmur3("#" + seedStr)();
  const rand = sfc32(seed, seed2, seed3, seed4);
  const rnd = () => rand();
  rnd.int = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
  rnd.pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  rnd.shuffle = (arr) => arr.map(v => [rnd(), v]).sort((a,b)=>a[0]-b[0]).map(p=>p[1]);
  return rnd;
}

// ---------- Palettes ----------
const PALETTES = [
  // colors[0] 作为背景参考色（多为深色/黑或很浅的白）
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

const STYLE_OPTIONS = [
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
];

const ASPECT_RATIOS = [
  { id: "square", label: "1:1", width: 1200, height: 1200 },
  { id: "landscape", label: "16:9", width: 1920, height: 1080 },
  { id: "portrait", label: "3:4", width: 1200, height: 1600 },
];

export default function GenerativeGeometricArt() {
  const [aspectRatio, setAspectRatio] = useState("portrait");
  const [style, setStyle] = useState("isoCubes");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [seed, setSeed] = useState(() => Math.random().toString(36).slice(2, 9));
  const [useGradient, setUseGradient] = useState(true);
  const [darkBg, setDarkBg] = useState(true);
  const [useVignette, setUseVignette] = useState(false);

  // Orb Trail 控制参数（仅在 orbTrail 样式下生效）
  const [orbCount, setOrbCount] = useState(7);
  const [orbRadiusPct, setOrbRadiusPct] = useState(0.14); // 相对最短边比例
  const [orbEndX, setOrbEndX] = useState(0.84); // 终点位置（0~1）
  const [orbEndY, setOrbEndY] = useState(0.84);
  const [orbTrailScale, setOrbTrailScale] = useState(0.9); // 轨迹长度倍率
  const [orbGamma, setOrbGamma] = useState(1.75); // 间距/速度指数
  const [orbCurvature, setOrbCurvature] = useState(0.0); // 弧线弯曲（-0.3~0.3）
  const [orbStartX, setOrbStartX] = useState(-0.12); // 起点位置（可为负表示画外）
  const [orbStartY, setOrbStartY] = useState(0.28);
  const [orbManualStart, setOrbManualStart] = useState(false); // 是否启用手动起点
  // Controls tabs
  const [controlTab, setControlTab] = useState('color'); // 'color' | 'style'

  // Corner Steps 控制参数（仅在 cornerSteps 样式下生效）
  const [csSteps, setCsSteps] = useState(8);
  const [csStepX, setCsStepX] = useState(0.11); // 相对宽度（默认 11%）
  const [csStepY, setCsStepY] = useState(0.08); // 相对高度（默认 8%）
  const [csIrregular, setCsIrregular] = useState(true);
  const [csIrregularAmt, setCsIrregularAmt] = useState(0.30); // 默认 30%

  // Iso Cubes 控制参数（仅在 isoCubes 样式下生效）
  const [isoCols, setIsoCols] = useState(6); // 列数（决定大小）
  const [isoShade, setIsoShade] = useState(0.22); // 明暗强度
  const [isoUniform, setIsoUniform] = useState(true); // 每个立方体使用统一色系
  const [isoColorVariety, setIsoColorVariety] = useState(3); // 网格中使用的基色种类

  const canvasRef = useRef(null);

  const currentAspect = ASPECT_RATIOS.find(ar => ar.id === aspectRatio);
  const [w, h] = [currentAspect.width, currentAspect.height];

  const palette = PALETTES[paletteIndex];
  const rnd = useMemo(() => makePRNG(`${style}-${palette.name}-${seed}-${useGradient}-${darkBg}-${aspectRatio}`), [style, paletteIndex, seed, useGradient, darkBg, aspectRatio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1) * 2 / 2);
    
    // Set canvas internal resolution (high quality for export)
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    
    // Calculate available preview area size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const previewWidth = containerRect.width - 32; // Account for padding
      const previewHeight = containerRect.height - 32;
      
      const canvasAspectRatio = w / h;
      const previewAspectRatio = previewWidth / previewHeight;
      
      let displayWidth, displayHeight;
      if (canvasAspectRatio > previewAspectRatio) {
        // Canvas is wider - fit to width, add top/bottom padding
        displayWidth = previewWidth;
        displayHeight = previewWidth / canvasAspectRatio;
      } else {
        // Canvas is taller - fit to height, add left/right padding  
        displayHeight = previewHeight;
        displayWidth = previewHeight * canvasAspectRatio;
      }
      
      // Set CSS display size
      canvas.style.width = Math.round(displayWidth) + "px";
      canvas.style.height = Math.round(displayHeight) + "px";
    };
    
    // Initial size calculation
    setTimeout(updateCanvasSize, 0);
    
    // Listen for window resize
    window.addEventListener('resize', updateCanvasSize);
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    const bg = darkBg ? palette.colors[0] : "#ffffff";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Choose a drawing routine
    const drawMap = {
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
    };
    drawMap[style](ctx, rnd, palette, { 
      w, h, useGradient, bg,
      orb: {
        count: orbCount,
        radiusPct: orbRadiusPct,
        endX: orbEndX,
        endY: orbEndY,
        trailScale: orbTrailScale,
        gamma: orbGamma,
        curvature: orbCurvature,
        startX: orbStartX,
        startY: orbStartY,
        manualStart: orbManualStart,
      },
      corner: {
        steps: csSteps,
        stepX: csStepX,
        stepY: csStepY,
        irregular: csIrregular,
        irregularAmt: csIrregularAmt,
      },
      iso: {
        cols: isoCols,
        shade: isoShade,
        uniform: isoUniform,
        variety: isoColorVariety,
      }
    });

    // Subtle vignette for depth
    if (useVignette) vignette(ctx, w, h, 0.18);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [w, h, style, paletteIndex, seed, useGradient, darkBg, rnd, palette, useVignette, orbCount, orbRadiusPct, orbEndX, orbEndY, orbTrailScale, orbGamma, orbCurvature, orbStartX, orbStartY, orbManualStart, csSteps, csStepX, csStepY, csIrregular, csIrregularAmt, isoCols, isoShade, isoUniform, isoColorVariety]);

  function regenerate() {
    setSeed(Math.random().toString(36).slice(2, 9));
  }

  function exportPNG() {
    const link = document.createElement("a");
    link.download = `geo-${style}-${aspectRatio}-${seed}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Generative Geometric Art
          </h1>
          <p className="text-gray-400 mt-2">Create beautiful algorithmic art with customizable patterns and colors</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Canvas Area - Left */}
          <div className="space-y-4 xl:col-span-2">
            {/* Quick Controls Toolbar */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-3 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Quick Controls</h2>
              </div>
              <div className="p-3 space-y-3">
                {/* Styles */}
                <div>
                  <div className="text-xs text-gray-300 mb-2">Style</div>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border ${
                          style === s.id ? 'bg-blue-500/40 border-blue-400 text-white' : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect + Toggles */}
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex gap-2">
                    {ASPECT_RATIOS.map((ar) => (
                      <button key={ar.id} onClick={() => setAspectRatio(ar.id)}
                        className={`px-3 py-1 rounded-full text-xs border ${
                          aspectRatio===ar.id ? 'bg-blue-500/40 border-blue-400 text-white' : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                        }`}
                      >{ar.label}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <span>Dark</span>
                      <ToggleSwitch checked={darkBg} onChange={setDarkBg} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <span>Gradient</span>
                      <ToggleSwitch checked={useGradient} onChange={setUseGradient} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <span>Vignette</span>
                      <ToggleSwitch checked={useVignette} onChange={setUseVignette} />
                    </div>
                  </div>
                </div>

                {/* Seed */}
                <div>
                  <div className="text-xs text-gray-300 mb-2">Seed</div>
                  <div className="flex gap-2 items-center">
                    <input
                      className="flex-1 px-2 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
                      value={seed}
                      onChange={(e)=>setSeed(e.target.value)}
                      placeholder="Enter seed..."
                    />
                    <button onClick={regenerate} className="px-2 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-colors">🔄</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-3 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Generated Artwork</h2>
              </div>
              <div className="p-4">
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden shadow-2xl bg-black/30 flex items-center justify-center max-w-4xl mx-auto">
                  <canvas ref={canvasRef} className="block" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={regenerate}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                🎲 Generate New
              </button>
              <button 
                onClick={exportPNG}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                📥 Export PNG
              </button>
            </div>
          </div>

          {/* Controls Panel - Right */}
          <div className="space-y-4 xl:col-span-1 xl:max-w-sm w-full xl:sticky xl:top-4 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto pr-1">
            {/* Tabs */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl overflow-hidden">
              <div className="flex">
                <button
                  className={`flex-1 px-4 py-2 text-sm font-medium border-b ${controlTab==='color' ? 'bg-blue-500/30 text-white border-blue-400' : 'text-gray-300 border-white/10 hover:bg-white/5'}`}
                  onClick={()=>setControlTab('color')}
                >颜色设置</button>
                <button
                  className={`flex-1 px-4 py-2 text-sm font-medium border-b ${controlTab==='style' ? 'bg-blue-500/30 text-white border-blue-400' : 'text-gray-300 border-white/10 hover:bg-white/5'}`}
                  onClick={()=>setControlTab('style')}
                >风格设置</button>
              </div>
            </div>
            
            {controlTab === 'color' && (
              <ControlPanel title="🎨 颜色设置">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {PALETTES.map((p, i) => (
                    <button
                      key={p.name}
                      onClick={() => setPaletteIndex(i)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 border-2 ${
                        i === paletteIndex 
                          ? 'border-blue-400 bg-blue-500/20 shadow-lg' 
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xs font-medium text-white mb-2">{p.name}</div>
                      <div className="flex gap-1">
                        {p.colors.slice(0, 6).map((c, j) => (
                          <div key={j} className="w-5 h-5 rounded-md border border-white/20" style={{ background: c }} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </ControlPanel>
            )}

            {/* Style-specific controls */}
            {controlTab === 'style' && style === 'orbTrail' && (
              <ControlPanel title="🟣 Orb Trail Controls">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-300">手动起点</span>
                    <ToggleSwitch checked={orbManualStart} onChange={setOrbManualStart} />
                  </div>
                  {/* Count */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>数量</span>
                      <span>{orbCount}</span>
                    </div>
                    <input type="range" min={3} max={12} step={1}
                      value={orbCount}
                      onChange={(e)=>setOrbCount(parseInt(e.target.value))}
                      className="w-full accent-blue-500" />
                  </div>

                  {/* Radius */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>半径（相对）</span>
                      <span>{(orbRadiusPct*100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min={0.06} max={0.25} step={0.005}
                      value={orbRadiusPct}
                      onChange={(e)=>setOrbRadiusPct(parseFloat(e.target.value))}
                      className="w-full accent-blue-500" />
                  </div>

                  {/* Speed (gamma) */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>速度/间距（指数）</span>
                      <span>{orbGamma.toFixed(2)}</span>
                    </div>
                    <input type="range" min={1.0} max={3.0} step={0.05}
                      value={orbGamma}
                      onChange={(e)=>setOrbGamma(parseFloat(e.target.value))}
                      className="w-full accent-blue-500" />
                  </div>

                  {/* End position */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1"><span>终点X</span><span>{(orbEndX*100).toFixed(0)}%</span></div>
                      <input type="range" min={0.60} max={0.95} step={0.01}
                        value={orbEndX}
                        onChange={(e)=>setOrbEndX(parseFloat(e.target.value))}
                        className="w-full accent-blue-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1"><span>终点Y</span><span>{(orbEndY*100).toFixed(0)}%</span></div>
                      <input type="range" min={0.60} max={0.95} step={0.01}
                        value={orbEndY}
                        onChange={(e)=>setOrbEndY(parseFloat(e.target.value))}
                        className="w-full accent-blue-500" />
                    </div>
                  </div>

                  {/* Start position */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1"><span>起点X</span><span>{(orbStartX*100).toFixed(0)}%</span></div>
                      <input type="range" min={-0.30} max={0.60} step={0.01}
                        value={orbStartX}
                        onChange={(e)=>setOrbStartX(parseFloat(e.target.value))}
                        disabled={!orbManualStart}
                        className={`w-full ${!orbManualStart ? 'opacity-50' : ''} accent-blue-500`} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1"><span>起点Y</span><span>{(orbStartY*100).toFixed(0)}%</span></div>
                      <input type="range" min={-0.30} max={0.60} step={0.01}
                        value={orbStartY}
                        onChange={(e)=>setOrbStartY(parseFloat(e.target.value))}
                        disabled={!orbManualStart}
                        className={`w-full ${!orbManualStart ? 'opacity-50' : ''} accent-blue-500`} />
                    </div>
                  </div>

                  {/* Trail length scale */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>轨迹长度</span>
                      <span>{orbTrailScale.toFixed(2)}</span>
                    </div>
                    <input type="range" min={0.5} max={1.4} step={0.01}
                      value={orbTrailScale}
                      onChange={(e)=>setOrbTrailScale(parseFloat(e.target.value))}
                      disabled={orbManualStart}
                      className={`w-full ${orbManualStart ? 'opacity-50' : ''} accent-blue-500`} />
                  </div>

                  {/* Curvature */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>弯曲</span>
                      <span>{orbCurvature.toFixed(2)}</span>
                    </div>
                    <input type="range" min={-0.30} max={0.30} step={0.01}
                      value={orbCurvature}
                      onChange={(e)=>setOrbCurvature(parseFloat(e.target.value))}
                      className="w-full accent-blue-500" />
                  </div>
                </div>
              </ControlPanel>
            )}
            {controlTab === 'style' && style === 'cornerSteps' && (
              <ControlPanel title="🟫 Corner Steps Controls">
                <div className="space-y-4">
                  {/* Steps */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>阶梯数量</span>
                      <span>{csSteps}</span>
                    </div>
                    <input type="range" min={3} max={20} step={1}
                      value={csSteps}
                      onChange={(e)=>setCsSteps(parseInt(e.target.value))}
                      className="w-full accent-blue-500" />
                  </div>

                  {/* Step X / Y */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1"><span>水平缩进</span><span>{Math.round(csStepX*100)}%</span></div>
                      <input type="range" min={0.02} max={0.30} step={0.005}
                        value={csStepX}
                        onChange={(e)=>setCsStepX(parseFloat(e.target.value))}
                        className="w-full accent-blue-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1"><span>垂直缩进</span><span>{Math.round(csStepY*100)}%</span></div>
                      <input type="range" min={0.02} max={0.30} step={0.005}
                        value={csStepY}
                        onChange={(e)=>setCsStepY(parseFloat(e.target.value))}
                        className="w-full accent-blue-500" />
                    </div>
                  </div>

                  {/* Irregular toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-300">不规则间距</span>
                    <ToggleSwitch checked={csIrregular} onChange={setCsIrregular} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>不规则程度</span>
                      <span>{Math.round(csIrregularAmt*100)}%</span>
                    </div>
                    <input type="range" min={0} max={0.6} step={0.01}
                      value={csIrregularAmt}
                      onChange={(e)=>setCsIrregularAmt(parseFloat(e.target.value))}
                      disabled={!csIrregular}
                      className={`w-full ${!csIrregular ? 'opacity-50' : ''} accent-blue-500`} />
                  </div>
                </div>
              </ControlPanel>
            )}
            {controlTab === 'style' && style === 'isoCubes' && (
              <ControlPanel title="🧊 Iso Cubes Controls">
                <div className="space-y-4">
                  {/* Columns / size */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>列数（决定大小）</span>
                      <span>{isoCols}</span>
                    </div>
                    <input type="range" min={3} max={14} step={1}
                      value={isoCols}
                      onChange={(e)=>setIsoCols(parseInt(e.target.value))}
                      className="w-full accent-blue-500" />
                  </div>

                  {/* Shade strength */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>明暗强度</span>
                      <span>{isoShade.toFixed(2)}</span>
                    </div>
                    <input type="range" min={0.05} max={0.5} step={0.01}
                      value={isoShade}
                      onChange={(e)=>setIsoShade(parseFloat(e.target.value))}
                      className="w-full accent-blue-500" />
                  </div>

                  {/* Color variety */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>基色种类</span>
                      <span>{isoColorVariety}</span>
                    </div>
                    <input type="range" min={1} max={8} step={1}
                      value={isoColorVariety}
                      onChange={(e)=>setIsoColorVariety(parseInt(e.target.value))}
                      className="w-full accent-blue-500" />
                  </div>

                  {/* Uniform color per cube */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-300">每个立方体统一色系</span>
                    <ToggleSwitch checked={isoUniform} onChange={setIsoUniform} />
                  </div>
                  <div className="text-xs text-gray-400">开启时，每个立方体的三面来自同一基色的明暗变化；关闭时可另行扩展（当前仍按统一色系渲染）。</div>
                </div>
              </ControlPanel>
            )}
            {controlTab === 'style' && style !== 'orbTrail' && style !== 'cornerSteps' && style !== 'isoCubes' && (
              <ControlPanel title="当前风格暂无高级参数" defaultOpen={true}>
                <div className="text-xs text-gray-300">切换到 Orb Trail、Corner Steps 或 Iso Cubes 以查看可调控参数。</div>
              </ControlPanel>
            )}

            

          </div>
        </div>
      </div>
    </div>
  );
}

// UI Components
function ControlPanel({ title, children, defaultOpen = true }) {
  return (
    <details open={defaultOpen} className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl overflow-hidden">
      <summary className="cursor-pointer bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-3 border-b border-white/10 list-none flex items-center justify-between">
        <h3 className="text-base font-semibold text-white select-none">{title}</h3>
        <span className="text-white/70 text-xs ml-3">⌄</span>
      </summary>
      <div className="p-4">
        {children}
      </div>
    </details>
  );
}

function ToggleButton({ active, onClick, children }) {
  return (
    <button 
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border-2 ${
        active 
          ? "border-blue-400 bg-blue-500/30 text-white shadow-lg" 
          : "border-white/20 bg-white/5 text-gray-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-blue-500' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ---------- Drawing Routines ----------
function withShadow(ctx, cb, alpha = 0, enabled = false) {
  ctx.save();
  if (enabled) {
    ctx.shadowColor = `rgba(0,0,0,${alpha})`;
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
  }
  cb();
  ctx.restore();
}

function vignette(ctx, w, h, alpha = 0.18) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function makeGradient(ctx, x0, y0, x1, y1, colors) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const step = 1 / (colors.length - 1);
  colors.forEach((c, i) => g.addColorStop(i * step, c));
  return g;
}

function pickColors(rnd, palette, n) {
  // 更克制：从非背景色里挑选有限个主色，顺序稳定
  const pool = palette.colors.slice(1);
  const picked = rnd.shuffle(pool).slice(0, n);
  return picked;
}

// 1) Cubes: isometric parallelogram grid - clean geometric style
function drawCubes(ctx, rnd, palette, { w, h, useGradient }) {
  const margin = Math.round(Math.min(w, h) * 0.06);
  const cols = 6; // 更具模式感的固定列数
  const rows = Math.round((h - margin * 2) / ((w - margin * 2) / cols));
  const cellW = (w - margin * 2) / cols;
  const cellH = (h - margin * 2) / rows;
  const skew = 0.33;
  const accents = pickColors(rnd, palette, 3); // 控制在 3 色

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = margin + c * cellW;
      const y = margin + r * cellH;
      const k = cellW * skew;
      const height = cellH;

      const base = accents[(r + c) % accents.length];
      const left = lighten(base, -0.1);
      const right = lighten(base, -0.2);
      const top = lighten(base, 0.06);

      // left face
      ctx.beginPath();
      ctx.moveTo(x, y + height * 0.5);
      ctx.lineTo(x + k, y);
      ctx.lineTo(x + k, y + height);
      ctx.closePath();
      ctx.fillStyle = useGradient ? makeGradient(ctx, x, y, x + k, y + height, [left, base]) : left;
      ctx.fill();

      // right face
      ctx.beginPath();
      ctx.moveTo(x + cellW, y + height * 0.5);
      ctx.lineTo(x + cellW - k, y);
      ctx.lineTo(x + cellW - k, y + height);
      ctx.closePath();
      ctx.fillStyle = useGradient ? makeGradient(ctx, x + cellW - k, y, x + cellW, y + height, [right, base]) : right;
      ctx.fill();

      // top face
      ctx.beginPath();
      ctx.moveTo(x + k, y);
      ctx.lineTo(x + cellW - k, y);
      ctx.lineTo(x + cellW, y + height * 0.5);
      ctx.lineTo(x, y + height * 0.5);
      ctx.closePath();
      ctx.fillStyle = useGradient ? makeGradient(ctx, x, y, x + cellW, y + height * 0.5, [top, base]) : top;
      ctx.fill();
    }
  }
}

// 新风格：中央白色菱形 + 四向彩色楔形（类似参考图右中）
function drawKites(ctx, rnd, palette, { w, h, useGradient }) {
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

// 新风格：X Overlay（6个三角形设计）
function drawXOverlay(ctx, rnd, palette, { w, h }) {
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

// 新风格：角落阶梯矩形（类似参考图左中）
function drawCornerSteps(ctx, rnd, palette, { w, h, useGradient, corner }) {
  // 目标：完全覆盖画布，不留底色。方法：从全屏矩形开始，再逐步内缩。
  const steps = Math.max(3, Math.min(20, Math.round(corner?.steps ?? 8)));
  const colors = pickColors(rnd, palette, Math.min(steps, 6));

  // 先铺满一个底色矩形（非背景色），确保不露底。
  const base = colors[0] || palette.colors[1] || "#000";
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // 逐步从左上角向内“阶梯式”缩进，形成层叠。
  const stepX = w * Math.max(0.02, Math.min(0.3, corner?.stepX ?? 0.10)); // 每阶在 X 方向缩进量
  const stepY = h * Math.max(0.02, Math.min(0.3, corner?.stepY ?? 0.12)); // 每阶在 Y 方向缩进量
  const irregular = !!corner?.irregular;
  const jitterAmt = Math.max(0, Math.min(0.6, corner?.irregularAmt ?? 0.25));

  let accX = 0, accY = 0;
  for (let i = 1; i < steps; i++) {
    // 基础缩进
    let dx = stepX;
    let dy = stepY;
    // 不规则扰动：在 [-amt, +amt] * step 范围内抖动
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

// 新风格：沿对角线的圆盘轨迹（可调控、圆半径固定）
function drawOrbTrail(ctx, rnd, palette, { w, h, orb }) {
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

// 2) Concentric: nested sharp rectangles with gradients
function drawConcentric(ctx, rnd, palette, { w, h, useGradient }) {
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

// 3) Diamonds: grid pattern of diamond shapes with geometric repetition
function drawDiamonds(ctx, rnd, palette, { w, h, useGradient, bg }) {
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

// 4) Orbs: overlapping circles with clean transparency effects
function drawOrbs(ctx, rnd, palette, { w, h, useGradient }) {
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

// 5) Bands: horizontal bands with random heights and soft blends
function drawBands(ctx, rnd, palette, { w, h, useGradient }) {
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

// 6) Grid: structured grid with varied geometric shapes
function drawGrid(ctx, rnd, palette, { w, h, useGradient }) {
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

// New: Sunburst radial wedges from center
function drawSunburst(ctx, rnd, palette, { w, h, useGradient }) {
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

// New: Diagonal stripes with varying width
function drawDiagStripes(ctx, rnd, palette, { w, h, useGradient }) {
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

// New: Concentric diamonds
function drawConcentricDiamonds(ctx, rnd, palette, { w, h, useGradient }) {
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

// New: Flow Ribbons (thick–thin–thick bezier ribbons)
function drawFlowRibbons(ctx, rnd, palette, { w, h, useGradient }) {
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

// 7) Waves: flowing wave patterns with layered transparency
function drawWaves(ctx, rnd, palette, { w, h, useGradient }) {
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

// ---------- Helpers ----------
// 新风格：斜视立方体（等距视角的三面体铺砖）
function drawChevron(ctx, rnd, palette, { w, h, useGradient }) {
  const cols = 6;
  const cellW = Math.ceil(w / cols);
  const skew = 0.35;
  const height = Math.round(cellW); // 以正方形为基础高度
  const rowStep = Math.round(height * 0.5); // 关键：行间半高重叠，消除空隙
  const rows = Math.ceil((h + height) / rowStep);

  // 侧面统一基色 + 明暗；顶面从调色盘选亮色
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

// 新风格：菱形编织效果（当前的拼接效果）
function drawRhombusWeave(ctx, rnd, palette, { w, h, useGradient }) {
  // 基础尺寸计算：使用60°菱形
  const cubeWidth = Math.min(w, h) / 6; // 增加立方体大小
  const rhombusWidth = cubeWidth;
  const rhombusHeight = cubeWidth * Math.sqrt(3) / 2; // 60°菱形的高度
  
  // 紧密拼接的六边形网格间距（消除间隙）
  const hexWidth = rhombusWidth;      // 水平间距等于菱形宽度
  const hexHeight = rhombusHeight;    // 垂直间距等于菱形高度
  
  // 网格行列数（扩展边界确保填满）
  const cols = Math.ceil(w / hexWidth) + 4;
  const rows = Math.ceil(h / hexHeight) + 4;
  
  // 选择基础颜色组（3-4种颜色）
  const baseColors = pickColors(rnd, palette, 4);
  
  // 绘制立方体网格
  for (let row = -2; row <= rows; row++) {
    for (let col = -2; col <= cols; col++) {
      // 六边形网格定位：奇数行偏移半个菱形宽度
      const xOffset = (row % 2) * (hexWidth * 0.5);
      const cx = col * hexWidth + xOffset;
      const cy = row * hexHeight;
      
      // 选择这个立方体的基础颜色
      const baseColor = baseColors[(row * cols + col + 1000) % baseColors.length];
      
      // 生成立方体的三个面的颜色（固定明暗关系）
      const topColor = lighten(baseColor, 0.2);    // 顶面最亮
      const leftColor = baseColor;                  // 左侧面中等
      const rightColor = lighten(baseColor, -0.3);  // 右侧面最暗
      
      drawCube(ctx, cx, cy, rhombusWidth, rhombusHeight, topColor, leftColor, rightColor, useGradient);
    }
  }
}

// 绘制单个立方体（由3个60°菱形组成，完全拼接）
function drawCube(ctx, centerX, centerY, rhombusW, rhombusH, topColor, leftColor, rightColor, useGradient) {
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
  
  // 左侧面菱形（向左下倾斜的60°菱形）
  ctx.beginPath();
  ctx.moveTo(centerX - halfW, centerY);           // 与顶面共享的左顶点
  ctx.lineTo(centerX, centerY + halfH);           // 与顶面共享的下顶点
  ctx.lineTo(centerX - halfW, centerY + rhombusH); // 左下顶点
  ctx.lineTo(centerX - rhombusW, centerY + halfH); // 最左顶点
  ctx.closePath();
  ctx.fillStyle = useGradient ?
    makeGradient(ctx, centerX - rhombusW, centerY, centerX, centerY + rhombusH,
                 [lighten(leftColor, 0.05), leftColor]) : leftColor;
  ctx.fill();
  
  // 右侧面菱形（向右下倾斜的60°菱形）
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + halfH);           // 与顶面共享的下顶点
  ctx.lineTo(centerX + halfW, centerY);           // 与顶面共享的右顶点
  ctx.lineTo(centerX + rhombusW, centerY + halfH); // 最右顶点
  ctx.lineTo(centerX + halfW, centerY + rhombusH); // 右下顶点
  ctx.closePath();
  ctx.fillStyle = useGradient ?
    makeGradient(ctx, centerX, centerY + halfH, centerX + rhombusW, centerY + rhombusH,
                 [rightColor, lighten(rightColor, -0.05)]) : rightColor;
  ctx.fill();
}

// 等距立方体（正立方体比例、无间距拼接）
function drawIsoCubes(ctx, rnd, palette, { w, h, useGradient, iso }) {
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


function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
}

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') {
    return { r: 0, g: 0, b: 0 }; // 返回黑色作为默认值
  }
  const s = hex.replace('#', '');
  const bigint = parseInt(s.length === 3 ? s.split('').map(c=>c+c).join('') : s, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function withAlpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function clamp01(v){ return Math.max(0, Math.min(1, v)); }
function lighten(hex, amt) {
  if (!hex || typeof hex !== 'string') {
    hex = '#000000'; // 使用黑色作为默认值
  }
  const { r, g, b } = hexToRgb(hex);
  const L = (x) => Math.round(255 * clamp01(x / 255 + amt));
  return `rgb(${L(r)}, ${L(g)}, ${L(b)})`;
}

// 通过三点确定圆（用于 orbTrail 的弧线轨迹）
function circleFrom3Points(x1, y1, x2, y2, x3, y3) {
  const d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
  if (Math.abs(d) < 1e-6) return null;
  const x1s = x1 * x1 + y1 * y1;
  const x2s = x2 * x2 + y2 * y2;
  const x3s = x3 * x3 + y3 * y3;
  const cx = (x1s * (y2 - y3) + x2s * (y3 - y1) + x3s * (y1 - y2)) / d;
  const cy = (x1s * (x3 - x2) + x2s * (x1 - x3) + x3s * (x2 - x1)) / d;
  const r = Math.hypot(cx - x1, cy - y1);
  return { cx, cy, r };
}
