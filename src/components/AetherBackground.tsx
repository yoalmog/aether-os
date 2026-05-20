/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';

const BACKGROUND_IMAGE = "/src/assets/images/cyberpunk_hologram_bg_1779270683386.png";

const THEME_COLORS: Record<string, string> = {
  'CYAN_FLUX': 'rgba(6, 182, 212, ',   // cyan-500
  'PURPLE_MESH': 'rgba(168, 85, 247, ', // purple-500
  'VOID_GOLD': 'rgba(234, 179, 8, ',    // yellow-500
  'DYNAMIC': 'rgba(236, 72, 153, ' // pink-500 (used as a fallback or active state if dynamic)
};

export const AetherBackground: React.FC = () => {
  const settings = useAppStore(state => state.settings);
  const currentEffect = useAppStore(state => state.currentEffect);

  // Generate deterministic but random-looking particles depending on effect name to slightly alter layout
  const particles = useMemo(() => {
    const seed = currentEffect.length;
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: ((i * 17 + seed * 10) % 100),
      y: ((i * 23 + seed * 5) % 100),
      duration: 15 + ((i * 3) % 15),
      size: 2 + ((i * 7) % 4)
    }));
  }, [currentEffect]);

  // If theme is dynamic, base it partly on hour of day
  let baseColor = THEME_COLORS[settings.theme] || THEME_COLORS['CYAN_FLUX'];
  if (settings.theme === 'DYNAMIC') {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) baseColor = THEME_COLORS['VOID_GOLD'];
    else if (hour >= 12 && hour < 18) baseColor = THEME_COLORS['CYAN_FLUX'];
    else baseColor = THEME_COLORS['PURPLE_MESH'];
  }

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-black transition-colors duration-1000">
      {/* Background Image */}
      <img
        src={BACKGROUND_IMAGE}
        alt="Cyberpunk Holographic Background"
        className="h-full w-full object-cover opacity-50 scale-110"
        referrerPolicy="no-referrer"
      />
      
      {/* Dynamic Animated Overlay Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      <div 
        className="absolute inset-0 opacity-20 transition-all duration-1000"
        style={{
          backgroundImage: `linear-gradient(${baseColor}0.1) 1px, transparent 1px), linear-gradient(90deg, ${baseColor}0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Drifting Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ y: `${p.y}vh`, x: `${p.x}vw`, opacity: 0 }}
            animate={{ 
              y: [`${p.y}vh`, `${(p.y - 20) % 100}vh`],
              opacity: [0, 0.4, 0]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="absolute rounded-full blur-[1px]"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: `${baseColor}0.6)`,
              boxShadow: `0 0 ${p.size * 2}px ${baseColor}1)`
            }}
          />
        ))}
      </div>

      {/* Scanning Lens Flare */}
      <div 
        className="absolute top-0 left-0 w-full h-[1px] blur-[2px] animate-scanline transition-colors duration-1000"
        style={{ backgroundColor: `${baseColor}0.5)` }}
      />
    </div>
  );
};
