/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, glow = false, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-all duration-300",
        onClick && "cursor-pointer hover:bg-white/10 hover:border-white/20",
        glow && "shadow-[0_0_30px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20",
        className
      )}
    >
      {/* Subtle scanner line effect */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
        <motion.div
          animate={{ y: ['-100%', '400%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="h-12 w-full bg-gradient-to-b from-cyan-400/40 via-cyan-400/10 to-transparent blur-md"
        />
      </div>
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
