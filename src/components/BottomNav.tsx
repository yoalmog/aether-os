/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Activity, Terminal, Settings, Image, HardDrive, Radio } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

const ITEMS: NavItem[] = [
  { id: 'dashboard', icon: <Home size={20} />, label: 'SYSTEM' },
  { id: 'converter', icon: <Image size={20} />, label: 'CONVERT' },
  { id: 'sd', icon: <HardDrive size={20} />, label: 'DRIVE' },
  { id: 'network', icon: <Radio size={20} />, label: 'RADAR' },
  { id: 'sensors', icon: <Activity size={20} />, label: 'METRICS' },
  { id: 'console', icon: <Terminal size={20} />, label: 'CONSOLE' },
  { id: 'settings', icon: <Settings size={20} />, label: 'LINK' },
];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-4 md:bottom-6 left-1/2 w-full max-w-[100vw] -translate-x-1/2 px-2 md:px-0 flex justify-center z-50">
      <div className="flex h-16 w-full md:w-[90%] max-w-2xl items-center justify-start md:justify-around overflow-x-auto no-scrollbar rounded-3xl border border-white/10 bg-[#020408]/60 backdrop-blur-2xl shadow-2xl px-2">
        {ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="group relative flex flex-col min-w-[64px] items-center justify-center py-2 px-1 transition-all duration-300 snap-center shrink-0"
            >
              <div className={cn(
                "transition-all duration-300",
                isActive ? "text-cyan-400 scale-110" : "text-white/40 group-hover:text-white/70"
              )}>
                {item.icon}
              </div>
              {isActive && (
                <motion.div
                  layoutId="navItemUnderline"
                  className="absolute -bottom-1 h-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                />
              )}
              <span className={cn(
                 "mt-1 text-[8px] font-mono tracking-wider uppercase whitespace-nowrap",
                 isActive ? "text-cyan-400/80" : "text-white/20"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
