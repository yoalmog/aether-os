/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { CameraGestureControl } from './CameraGestureControl';
import { Sliders, Hand } from 'lucide-react';

const STANDARD_EFFECTS = ['LOGO', 'GIF', 'TEXT', 'MATRIX', 'SPECTRUM', 'TUNNEL', 'SPIN', 'AURORA', 'CUBE', 'FIRE'];

export const HologramVisualizer: React.FC = () => {
  const [showControls, setShowControls] = useState(false);
  const [useGestures, setUseGestures] = useState(false);
  
  const settings = useAppStore(state => state.settings);
  const updateSettings = useAppStore(state => state.updateSettings);
  const currentEffect = useAppStore(state => state.currentEffect);
  const setEffect = useAppStore(state => state.setEffect);

  const customEffect = settings.customEffects?.[0] || {
    id: 'CUSTOM_PULSED', name: 'NEURAL_PULSE', color: '#00f2ff', speed: 1.0, particleDensity: 50, distortion: 0.5, glow: 2.0
  };

  const handleCustomChange = (key: string, value: number | string) => {
    updateSettings({
      customEffects: [{ ...customEffect, [key]: value }]
    });
  };

  const cycleEffect = (dir: 1 | -1) => {
    const idx = STANDARD_EFFECTS.indexOf(currentEffect);
    if (idx === -1) {
      setEffect(STANDARD_EFFECTS[0]);
      return;
    }
    let nextIdx = idx + dir;
    if (nextIdx >= STANDARD_EFFECTS.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = STANDARD_EFFECTS.length - 1;
    setEffect(STANDARD_EFFECTS[nextIdx]);
  };

  // Generate particles based on density
  const particles = useMemo(() => {
    return Array.from({ length: Math.min(200, Math.max(10, customEffect.particleDensity)) }).map((_, i) => ({
      id: i,
      cx: 10 + Math.random() * 80,
      cy: 10 + Math.random() * 80,
      delay: Math.random() * 2,
    }));
  }, [customEffect.particleDensity]);

  return (
    <div className="relative flex aspect-square w-full items-center justify-center p-4 min-h-[300px] overflow-hidden group">
      {/* Background Glow */}
      <div 
        className="absolute inset-0 blur-3xl rounded-full opacity-10 transition-colors duration-500" 
        style={{ backgroundColor: customEffect.color }} 
      />
      
      {/* Orbiting Ring 1 (Slow) */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 20 / customEffect.speed, repeat: Infinity, ease: "linear" }}
        className="absolute w-[300px] h-[300px] border border-cyan-500/10 rounded-full" 
        style={{ borderColor: `${customEffect.color}20` }}
      />
      
      {/* Orbiting Ring 2 (Static/Subtle) */}
      <div className="absolute w-[220px] h-[220px] border rounded-full" style={{ borderColor: `${customEffect.color}40` }} />

      {/* Hexagonal Mesh SVG */}
      <motion.div 
        animate={{ rotateY: [0, 10, 0], rotateX: [0, -10, 0] }}
        transition={{ duration: 5 / customEffect.speed, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-48 h-48 flex items-center justify-center"
      >
        <svg className="w-full h-full opacity-50" viewBox="0 0 100 100" fill="none" style={{ color: customEffect.color }}>
          <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" stroke="currentColor" strokeWidth="0.5" />
          <path d="M50 10 L50 90 M10 30 L90 70 M90 30 L10 70" stroke="currentColor" strokeWidth="0.2" />
          
          {particles.map(p => (
            <motion.circle 
              key={p.id}
              animate={{ r: [1, 2, 1], opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 2 / customEffect.speed, repeat: Infinity, delay: p.delay }}
              cx={p.cx} cy={p.cy} r="1" fill="currentColor" 
            />
          ))}

          <motion.circle 
            animate={{ r: [2, 4, 2], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2 / customEffect.speed, repeat: Infinity }}
            cx="50" cy="50" r="3" fill="currentColor" 
            style={{ filter: `drop-shadow(0 0 ${15 * customEffect.glow}px ${customEffect.color})` }}
          />
        </svg>
        <div 
          className="absolute inset-0 blur-xl rounded-full opacity-30 transition-colors"
          style={{ backgroundColor: customEffect.color }}
        />
      </motion.div>

      {/* Interactive Controls Overlay */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
        <button 
          onClick={() => setShowControls(!showControls)}
          className="p-2 rounded-xl bg-black/50 border border-white/10 text-white/50 hover:text-cyan-400 hover:border-cyan-500/50 transition-all backdrop-blur-md self-end"
        >
          <Sliders size={14} />
        </button>

        {showControls && (
          <div className="p-3 bg-black/70 border border-white/10 rounded-xl backdrop-blur-md space-y-3 w-48 animate-in fade-in slide-in-from-top-2">
            <div className="text-[9px] font-mono text-white/50 uppercase tracking-widest border-b border-white/10 pb-2">
              Visual Adjustments
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono text-cyan-400">
                <span>SPEED</span>
                <span>{(customEffect.speed ?? 1.0).toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.1" max="4.0" step="0.1" 
                value={customEffect.speed ?? 1.0}
                onChange={(e) => handleCustomChange('speed', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-white/10 h-1 rounded-full cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono text-pink-400">
                <span>DENSITY</span>
                <span>{customEffect.particleDensity ?? 50}</span>
              </div>
              <input 
                type="range" min="10" max="200" step="10" 
                value={customEffect.particleDensity ?? 50}
                onChange={(e) => handleCustomChange('particleDensity', parseInt(e.target.value))}
                className="w-full accent-pink-400 bg-white/10 h-1 rounded-full cursor-pointer"
              />
            </div>

            <div className="space-y-1">
               <div className="flex justify-between text-[8px] font-mono text-yellow-400">
                 <span>COLOR</span>
               </div>
               <input 
                 type="color" 
                 value={customEffect.color ?? "#00f2ff"}
                 onChange={(e) => handleCustomChange('color', e.target.value)}
                 className="w-full h-6 rounded cursor-pointer bg-transparent border-0 p-0"
               />
            </div>

            <button 
              onClick={() => setUseGestures(!useGestures)}
              className={`w-full mt-2 p-2 rounded flex items-center justify-center gap-2 text-[8px] font-mono tracking-widest transition-colors ${
                useGestures ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10'
              }`}
            >
              <Hand size={12} />
              {useGestures ? 'KINETIC_TRACKING_ON' : 'ENABLE_GESTURES'}
            </button>
          </div>
        )}
      </div>

      {useGestures && (
        <CameraGestureControl 
          onGestureLeft={() => cycleEffect(-1)} 
          onGestureRight={() => cycleEffect(1)}
        />
      )}

      {/* Telemetry Labels (Static) */}
      <div className="absolute bottom-4 flex gap-4">
        <div className="px-2 py-0.5 bg-white/5 rounded border border-white/10 text-[8px] font-mono text-white/40 tracking-tight">ROT_X: 42°</div>
        <div className="px-2 py-0.5 bg-white/5 rounded border border-white/10 text-[8px] font-mono text-white/40 tracking-tight">ROT_Y: 118°</div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="text-[8px] font-mono tracking-[0.5em] text-cyan-400/50 uppercase mt-32">mesh_projection</div>
      </div>
    </div>
  );
};
