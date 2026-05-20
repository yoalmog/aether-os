/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Image, Layout, Type, Music, Zap, Layers, Sparkles, Activity, Box, Flame, 
  Plus, Trash2, SlidersHorizontal 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { GlassCard } from './GlassCard';
import { useAppStore } from '../store/useAppStore';
import { CustomEffect } from '../types';

const EFFECTS = [
  { id: 'LOGO', name: 'LOGO_POV', icon: Image, color: 'text-cyan-400' },
  { id: 'GIF', name: 'GIF_PLAY', icon: Layout, color: 'text-pink-400' },
  { id: 'TEXT', name: 'TEXT_SCROLL', icon: Type, color: 'text-yellow-400' },
  { id: 'MATRIX', name: 'CYBER_RAIN', icon: Zap, color: 'text-emerald-400' },
  { id: 'SPECTRUM', name: 'AUDIO_VIBE', icon: Music, color: 'text-purple-400' },
  { id: 'TUNNEL', name: 'WARP_DRIVE', icon: Layers, color: 'text-blue-400' },
  { id: 'SPIN', name: 'HYPER_SPIN', icon: Activity, color: 'text-red-400' },
  { id: 'AURORA', name: 'PLASMA_FLOW', icon: Sparkles, color: 'text-amber-400' },
  { id: 'CUBE', name: 'KINETIC_CUBE', icon: Box, color: 'text-indigo-400' },
  { id: 'FIRE', name: 'THERMAL_FLAME', icon: Flame, color: 'text-rose-400' },
];

interface EffectSelectorProps {
  currentEffect: string;
  onSelect: (id: string) => void;
}

export const EffectSelector: React.FC<EffectSelectorProps> = ({ currentEffect, onSelect }) => {
  const settings = useAppStore(state => state.settings);
  const updateSettings = useAppStore(state => state.updateSettings);
  const addLog = useAppStore(state => state.addLog);

  const customEffects = useMemo(() => settings.customEffects || [], [settings.customEffects]);

  // Combine standard and custom presets
  const allChoices = useMemo(() => {
    return [
      ...EFFECTS.map(eff => ({ ...eff, isCustom: false })),
      ...customEffects.map(eff => ({
        id: eff.id,
        name: eff.name,
        icon: Sparkles,
        color: 'text-pink-400',
        isCustom: true,
        raw: eff
      }))
    ];
  }, [customEffects]);

  const selectedCustomPreset = useMemo(() => {
    return customEffects.find(eff => eff.id === currentEffect);
  }, [currentEffect, customEffects]);

  const handleCreatePreset = () => {
    const list = settings.customEffects || [];
    const count = list.length + 1;
    const newPreset: CustomEffect = {
      id: `CUSTOM_${Date.now()}`,
      name: `MY_PRESET_${count}`,
      color: '#ec4899',
      speed: 1.5,
      particleDensity: 220,
      distortion: 0.6,
      glow: 4.0
    };

    updateSettings({
      customEffects: [...list, newPreset]
    });
    addLog(`CREATING_CUSTOM_PRESET: Initialized [${newPreset.name}] node`);
    onSelect(newPreset.id);
  };

  const handleUpdatePreset = (updatedFields: Partial<CustomEffect>) => {
    const list = settings.customEffects || [];
    const updatedList = list.map(item => 
      item.id === currentEffect ? { ...item, ...updatedFields } : item
    );
    updateSettings({
      customEffects: updatedList
    });
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const list = settings.customEffects || [];
    const filteredList = list.filter(item => item.id !== id);
    updateSettings({
      customEffects: filteredList
    });
    addLog(`DELETING_PRESET: Released custom preset node [${id}]`);

    if (currentEffect === id) {
      onSelect('LOGO');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-mono tracking-widest text-white/50 uppercase">Neural_Projection_Modes</h3>
        <span className="text-[8px] font-mono text-cyan-400/60">{allChoices.length}_AVAILABLE</span>
      </div>

      {/* Grid of modes */}
      <div className="grid grid-cols-2 gap-3 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {allChoices.map((eff) => (
          <GlassCard
            key={eff.id}
            onClick={() => onSelect(eff.id)}
            className={cn(
               "p-3.5 transition-all duration-300 relative group/card cursor-pointer",
               currentEffect === eff.id ? "bg-cyan-500/10 border-cyan-500/30 scale-[1.02]" : "hover:bg-white/5"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 w-full truncate">
                <div className={cn(
                  "p-2 rounded-lg bg-white/5 shrink-0",
                  currentEffect === eff.id ? eff.color : "text-white/40"
                )}>
                  <eff.icon size={15} />
                </div>
                <div className="text-left truncate w-full">
                  <div className="text-[7.5px] font-mono tracking-tighter text-white/30 truncate flex items-center gap-1">
                    {eff.id}
                    {eff.isCustom && (
                      <span className="text-[6px] px-1 py-0.2 rounded bg-pink-500/10 text-pink-400 font-bold border border-pink-500/20 uppercase">
                        CUST
                      </span>
                    )}
                  </div>
                  <div className={cn(
                    "text-xs font-bold tracking-tight truncate",
                    currentEffect === eff.id ? "text-white" : "text-white/60"
                  )}>{eff.name}</div>
                </div>
              </div>

              {eff.isCustom && (
                <button
                  type="button"
                  onClick={(e) => handleDeletePreset(eff.id, e)}
                  className="p-1 rounded bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 text-red-400 transition-all ml-1 z-10 opacity-0 group-hover/card:opacity-100"
                  title="Delete Preset"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>

            {currentEffect === eff.id && (
              <motion.div 
                layoutId="activeEffectGlow"
                className="absolute inset-0 border border-cyan-500/50 rounded-3xl pointer-events-none shadow-[inset_0_0_12px_rgba(34,211,238,0.2)]"
              />
            )}
          </GlassCard>
        ))}
      </div>

      {/* Create custom preset trigger */}
      <div className="pt-1 flex gap-2">
        <button
          type="button"
          onClick={handleCreatePreset}
          className="flex-1 py-2 px-3 rounded-xl border border-dashed border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 font-mono text-[9px] uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          Create_New_Preset
        </button>
      </div>

      {/* Parameters tuning sub-matrix */}
      {selectedCustomPreset && (
        <GlassCard className="p-4 border-pink-500/20 bg-pink-500/5 mt-2 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-pink-400" />
              <span className="text-[9px] font-mono tracking-widest text-pink-400 uppercase font-bold">Preset_Tuner_Matrix</span>
            </div>
            <span className="text-[7.5px] font-mono text-white/30 uppercase">UPLINK_STABLE</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 text-xs">
            {/* Name Input */}
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono text-white/40">
                <span>PRESET_NAME</span>
                <span className="text-pink-400/50">MUTABLE</span>
              </div>
              <input
                type="text"
                value={selectedCustomPreset.name ?? ""}
                onChange={(e) => handleUpdatePreset({ name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-pink-500/50 transition-colors uppercase"
              />
            </div>

            {/* Color Select Grid */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] font-mono text-white/40">
                <span>EMISSION_SPECTRUM</span>
                <span className="font-mono text-[8.5px]" style={{ color: selectedCustomPreset.color }}>{selectedCustomPreset.color}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {[
                  { color: '#06b6d4', label: 'CYAN' },
                  { color: '#ec4899', label: 'PINK' },
                  { color: '#eab308', label: 'GOLD' },
                  { color: '#10b981', label: 'EMERALD' },
                  { color: '#8b5cf6', label: 'VIBE' },
                  { color: '#3b82f6', label: 'COSMIC' },
                  { color: '#f43f5e', label: 'FLAME' }
                ].map(opt => (
                  <button
                    key={opt.color}
                    type="button"
                    onClick={() => handleUpdatePreset({ color: opt.color })}
                    className={cn(
                      "w-5 h-5 rounded-full border transition-all cursor-pointer relative shrink-0",
                      selectedCustomPreset.color === opt.color ? "border-white scale-110 shadow-[0_0_8px_currentColor]" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                    style={{ 
                      backgroundColor: opt.color,
                      color: opt.color 
                    }}
                    title={opt.label}
                  />
                ))}
                
                <input
                  type="text"
                  value={selectedCustomPreset.color ?? ""}
                  onChange={(e) => handleUpdatePreset({ color: e.target.value })}
                  maxLength={7}
                  placeholder="#000000"
                  className="ml-auto w-16 px-1.5 py-1 rounded bg-black/40 border border-white/10 text-white text-[9px] font-mono text-center focus:outline-none focus:border-pink-500/50"
                />
              </div>
            </div>

            {/* Speed slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono text-white/40">
                <span>ROTATION_SPEED_FACTOR</span>
                <span className="text-white/60 font-mono font-bold">{selectedCustomPreset.speed.toFixed(1)}X</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="4.0"
                step="0.1"
                value={selectedCustomPreset.speed ?? 1.0}
                onChange={(e) => handleUpdatePreset({ speed: parseFloat(e.target.value) })}
                className="w-full accent-pink-500 bg-white/10 h-0.5 rounded-full cursor-pointer"
              />
            </div>

            {/* Density slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono text-white/40">
                <span>PARTICLE_EMISSION_DENSITY</span>
                <span className="text-white/60 font-mono font-bold">{selectedCustomPreset.particleDensity} PARTS</span>
              </div>
              <input
                type="range"
                min="30"
                max="500"
                step="10"
                value={selectedCustomPreset.particleDensity ?? 50}
                onChange={(e) => handleUpdatePreset({ particleDensity: parseInt(e.target.value, 10) })}
                className="w-full accent-pink-500 bg-white/10 h-0.5 rounded-full cursor-pointer"
              />
            </div>

            {/* Distortion Level */}
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono text-white/40">
                <span>CORE_DISTORTION_FACTOR</span>
                <span className="text-white/60 font-mono font-bold">{selectedCustomPreset.distortion.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={selectedCustomPreset.distortion ?? 0.5}
                onChange={(e) => handleUpdatePreset({ distortion: parseFloat(e.target.value) })}
                className="w-full accent-pink-500 bg-white/10 h-0.5 rounded-full cursor-pointer"
              />
            </div>

            {/* Glow Intensity Level */}
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono text-white/40">
                <span>ATMOSPHERIC_EMISSIVE_GLOW</span>
                <span className="text-white/60 font-mono font-bold">{selectedCustomPreset.glow.toFixed(1)}X</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={selectedCustomPreset.glow ?? 1.0}
                onChange={(e) => handleUpdatePreset({ glow: parseFloat(e.target.value) })}
                className="w-full accent-pink-500 bg-white/10 h-0.5 rounded-full cursor-pointer"
              />
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

