/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Wifi, Cpu, Clock, MapPin } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Device } from '../types';
import { cn } from '../lib/utils';

interface DeviceCardProps {
  device: Device;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  return (
    <GlassCard className="group relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl bg-white/5",
            device.status === 'ONLINE' ? 'text-cyan-400' : 'text-white/20'
          )}>
            <Cpu size={20} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Device_Anchor</div>
            <h3 className="text-sm font-bold tracking-tight">{device.name}</h3>
          </div>
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded-full text-[8px] font-mono border",
          device.status === 'ONLINE' 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-500"
        )}>
          {device.status}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-white/40 flex items-center gap-1"><MapPin size={10} /> IP_ADDR</span>
          <span className="text-white/80">{device.ip}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-white/40 flex items-center gap-1"><Clock size={10} /> UPTIME</span>
          <span className="text-white/80">04:22:11</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-white/40 flex items-center gap-1"><Wifi size={10} /> SIGNAL</span>
          <span className="text-emerald-400">-42dBm</span>
        </div>
      </div>

      {/* Decorative Waveform */}
      <div className="mt-4 h-6 flex items-end gap-0.5 opacity-20">
        {[2, 4, 3, 5, 8, 4, 6, 3, 5, 4, 7, 3].map((h, i) => (
          <motion.div
            key={i}
            animate={{ height: [h * 3, (h + 2) * 3, h * 3] }}
            transition={{ duration: 1 + Math.random(), repeat: Infinity }}
            className="flex-1 bg-cyan-400 rounded-t-sm"
          />
        ))}
      </div>

      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </GlassCard>
  );
};
