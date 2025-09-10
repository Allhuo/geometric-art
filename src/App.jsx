import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  STYLE_OPTIONS,
  PALETTES,
  ASPECT_RATIOS,
  drawStyleMap,
  makePRNG,
  vignette
} from './styles/index.js';

/*
 * Generative Geometric Art — 重构版本
 * --------------------------------
 * • 模块化架构，风格分离到独立文件
 * • HTML Canvas rendering at 2x pixel ratio for crisp export
 * • Curated palettes inspired by modern geometric covers
 * • Deterministic seeds + Randomize + PNG export
 * • Tailwind for minimal UI
 */

export default function GenerativeGeometricArt() {
  const [aspectRatio, setAspectRatio] = useState("portrait");
  const [style, setStyle] = useState("isoCubes");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [seed, setSeed] = useState(() => Math.random().toString(36).slice(2, 9));
  const [useGradient, setUseGradient] = useState(true);
  const [darkBg, setDarkBg] = useState(true);
  const [useVignette, setUseVignette] = useState(false);

  // Orb Trail 控制参数
  const [orbCount, setOrbCount] = useState(7);
  const [orbRadiusPct, setOrbRadiusPct] = useState(0.14);
  const [orbEndX, setOrbEndX] = useState(0.84);
  const [orbEndY, setOrbEndY] = useState(0.84);
  const [orbTrailScale, setOrbTrailScale] = useState(0.9);
  const [orbGamma, setOrbGamma] = useState(1.75);
  const [orbCurvature, setOrbCurvature] = useState(0.0);
  const [orbStartX, setOrbStartX] = useState(-0.12);
  const [orbStartY, setOrbStartY] = useState(0.28);
  const [orbManualStart, setOrbManualStart] = useState(false);
  
  // Iso Cubes 控制参数
  const [isoCols, setIsoCols] = useState(6);
  const [isoShade, setIsoShade] = useState(0.22);
  const [isoUniform, setIsoUniform] = useState(true);
  const [isoColorVariety, setIsoColorVariety] = useState(3);

  // Controls tabs
  const [controlTab, setControlTab] = useState('color');

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
      const previewWidth = containerRect.width - 32;
      const previewHeight = containerRect.height - 32;
      
      const canvasAspectRatio = w / h;
      const previewAspectRatio = previewWidth / previewHeight;
      
      let displayWidth, displayHeight;
      if (canvasAspectRatio > previewAspectRatio) {
        displayWidth = previewWidth;
        displayHeight = previewWidth / canvasAspectRatio;
      } else {
        displayHeight = previewHeight;
        displayWidth = previewHeight * canvasAspectRatio;
      }
      
      canvas.style.width = Math.round(displayWidth) + "px";
      canvas.style.height = Math.round(displayHeight) + "px";
    };
    
    setTimeout(updateCanvasSize, 0);
    window.addEventListener('resize', updateCanvasSize);
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    const bg = darkBg ? palette.colors[0] : "#ffffff";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Draw the selected style
    const drawFunction = drawStyleMap[style];
    if (drawFunction) {
      drawFunction(ctx, rnd, palette, { 
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
        iso: {
          cols: isoCols,
          shade: isoShade,
          uniform: isoUniform,
          variety: isoColorVariety,
        }
      });
    }

    // Subtle vignette for depth
    if (useVignette) vignette(ctx, w, h, 0.18);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [w, h, style, paletteIndex, seed, useGradient, darkBg, rnd, palette, useVignette, orbCount, orbRadiusPct, orbEndX, orbEndY, orbTrailScale, orbGamma, orbCurvature, orbStartX, orbStartY, orbManualStart, isoCols, isoShade, isoUniform, isoColorVariety]);

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
            
            {/* Canvas */}
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
            {/* Color Controls */}
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

            {/* Style-specific controls */}
            {style === 'orbTrail' && (
              <ControlPanel title="🟣 Orb Trail Controls">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-300">手动起点</span>
                    <ToggleSwitch checked={orbManualStart} onChange={setOrbManualStart} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>数量</span><span>{orbCount}</span>
                    </div>
                    <input type="range" min={3} max={12} step={1} value={orbCount} onChange={(e)=>setOrbCount(parseInt(e.target.value))} className="w-full accent-blue-500" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>半径（相对）</span><span>{(orbRadiusPct*100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min={0.06} max={0.25} step={0.005} value={orbRadiusPct} onChange={(e)=>setOrbRadiusPct(parseFloat(e.target.value))} className="w-full accent-blue-500" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>速度/间距（指数）</span><span>{orbGamma.toFixed(2)}</span>
                    </div>
                    <input type="range" min={1.0} max={3.0} step={0.05} value={orbGamma} onChange={(e)=>setOrbGamma(parseFloat(e.target.value))} className="w-full accent-blue-500" />
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

            {style === 'isoCubes' && (
              <ControlPanel title="🧊 Iso Cubes Controls">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>列数（决定大小）</span><span>{isoCols}</span>
                    </div>
                    <input type="range" min={3} max={14} step={1} value={isoCols} onChange={(e)=>setIsoCols(parseInt(e.target.value))} className="w-full accent-blue-500" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>明暗强度</span><span>{isoShade.toFixed(2)}</span>
                    </div>
                    <input type="range" min={0.05} max={0.5} step={0.01} value={isoShade} onChange={(e)=>setIsoShade(parseFloat(e.target.value))} className="w-full accent-blue-500" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>基色种类</span><span>{isoColorVariety}</span>
                    </div>
                    <input type="range" min={1} max={8} step={1} value={isoColorVariety} onChange={(e)=>setIsoColorVariety(parseInt(e.target.value))} className="w-full accent-blue-500" />
                  </div>
                </div>
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