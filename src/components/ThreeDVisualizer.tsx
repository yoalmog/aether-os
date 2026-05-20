/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { HolographicCore } from './HolographicCore';
import { CameraGestureControl } from './CameraGestureControl';
import { Settings, Sliders, Hand } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const STANDARD_EFFECTS = ['LOGO', 'GIF', 'TEXT', 'MATRIX', 'SPECTRUM', 'TUNNEL', 'SPIN', 'AURORA', 'CUBE', 'FIRE'];

export const ThreeDVisualizer: React.FC = () => {
  const [showControls, setShowControls] = useState(false);
  const [useGestures, setUseGestures] = useState(false);
  const settings = useAppStore(state => state.settings);
  const updateSettings = useAppStore(state => state.updateSettings);
  const currentEffect = useAppStore(state => state.currentEffect);
  const setEffect = useAppStore(state => state.setEffect);

  const customEffect = settings.customEffects?.[0] || {
    id: 'CUSTOM_PULSED', name: 'NEURAL_PULSE', color: '#06b6d4', speed: 1.0, particleDensity: 200, distortion: 0.5, glow: 2.0
  };

  const handleCustomChange = (key: string, value: number) => {
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

  return (
    <div className="h-[400px] w-full relative group">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={40} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color={customEffect.color} />
        
        <HolographicCore />
        
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
      
      {/* Decorative Overlays */}
      <div className="absolute inset-x-0 bottom-4 flex justify-between px-6 pointer-events-none">
        <div className="text-[8px] font-mono text-cyan-400/40 uppercase tracking-[0.3em]">
          rendering_engine: three_js_gpu
        </div>
        <div className="text-[8px] font-mono text-cyan-400/40 uppercase tracking-[0.3em]">
          active_projections: 04
        </div>
      </div>

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
                <span>{customEffect.particleDensity ?? 200}</span>
              </div>
              <input 
                type="range" min="50" max="600" step="10" 
                value={customEffect.particleDensity ?? 200}
                onChange={(e) => handleCustomChange('particleDensity', parseInt(e.target.value))}
                className="w-full accent-pink-400 bg-white/10 h-1 rounded-full cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono text-yellow-400">
                <span>GLOW / BLOOM</span>
                <span>{(customEffect.glow ?? 2.0).toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.5" max="10.0" step="0.5" 
                value={customEffect.glow ?? 2.0}
                onChange={(e) => handleCustomChange('glow', parseFloat(e.target.value))}
                className="w-full accent-yellow-400 bg-white/10 h-1 rounded-full cursor-pointer"
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
    </div>
  );
};
