/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Wifi, Battery, Server, Bell, HardDrive, ToggleLeft, ChevronDown, ChevronUp, Power, Radio, Cpu, Copy, Check } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const status = useAppStore(state => state.status);
  const settings = useAppStore(state => state.settings);
  const devices = useAppStore(state => state.devices);
  const logs = useAppStore(state => state.logs);
  const addLog = useAppStore(state => state.addLog);
  const toggleDeviceConnection = useAppStore(state => state.toggleDeviceConnection);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract IP from settings.esp32Url
  const ipAddress = settings.esp32Url.replace(/^(ws:\/\/|http:\/\/)/, '').split(':')[0] || '192.168.4.1';
  const isConnected = status.wsStatus === 'CONNECTED';
  const currentSSID = settings.hotspot?.enabled ? settings.hotspot.ssid : 'HOLOSPIN_X';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-full w-[85%] max-w-[320px] border-r border-white/10 bg-[#020408]/90 p-8 backdrop-blur-2xl rounded-r-[2rem]"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-cyan-500/50 bg-cyan-500/10 flex items-center justify-center p-2">
                  <User size={20} className="text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs font-mono text-white/50">OPERATOR_ID</div>
                  <div className="text-sm font-bold text-white">Y_ALMOG_01</div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] font-mono tracking-widest text-white/30 uppercase">System Stats</div>
              
              <div className="grid gap-3">
                <GlassCard className="p-3 border-none bg-white/5">
                  <div className="flex items-center gap-3">
                    <Wifi size={16} className={isConnected ? "text-emerald-400" : "text-white/30"} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-white/40 font-mono flex items-center justify-between">
                        <span>WIFI_LINK</span>
                        {isConnected && (
                          <span className="text-emerald-400 text-[8px] font-bold">CNCT</span>
                        )}
                      </div>
                      <div className="text-xs text-white font-mono truncate">
                        {isConnected ? currentSSID : "DISCONNECTED"}
                      </div>
                      {isConnected && (
                        <div className="text-[8px] font-mono text-white/50 mt-0.5 flex justify-between">
                          <span>{ipAddress}</span>
                          <span className="text-cyan-400">{status.telemetry?.wifi || -55} dBm</span>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-3 border-none bg-white/5">
                  <div className="flex items-center gap-3">
                    <Battery size={16} className="text-yellow-400" />
                    <div className="flex-1">
                      <div className="text-[10px] text-white/40">CORE_CELL</div>
                      <div className="text-xs text-white">98% OPTIMIZED</div>
                    </div>
                  </div>
                </GlassCard>
                
                <GlassCard className="p-3 border-none bg-white/5">
                  <div className="flex items-center gap-3">
                    <Server size={16} className="text-pink-400" />
                    <div className="flex-1">
                      <div className="text-[10px] text-white/40">NODE_STATUS</div>
                      <div className="text-xs text-white">3 ACTIVE_CLUSTERS</div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Linked Devices Section */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="text-[10px] font-mono tracking-widest text-white/30 uppercase flex items-center justify-between">
                  <span>Linked Devices</span>
                  <span className="text-[8.5px] text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-400/10">
                    {devices.filter(d => d.status === 'ONLINE').length}/{devices.length} ONLINE
                  </span>
                </div>
                <div className="space-y-2">
                  {devices.map(device => {
                    const isSelected = selectedDeviceId === device.id;
                    const isOnline = device.status === 'ONLINE';
                    return (
                      <div 
                        key={device.id}
                        className={cn(
                          "rounded-xl border transition-all duration-200 overflow-hidden",
                          isSelected 
                            ? "bg-white/10 border-white/20 p-3" 
                            : isOnline 
                              ? "bg-white/5 border-white/5 hover:border-cyan-500/30 p-2.5" 
                              : "bg-white/[0.02] border-transparent opacity-60 hover:opacity-100 p-2.5"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedDeviceId(isSelected ? null : device.id)}
                          className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
                        >
                          <div className="flex items-center gap-2 font-mono">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all duration-300",
                              isOnline ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse" : "bg-white/20"
                            )} />
                            <span className="text-[11px] font-bold tracking-tight text-white">{device.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "text-[8px] font-mono uppercase font-bold px-1 py-0.2 rounded",
                              isOnline ? "text-cyan-400 bg-cyan-400/10" : "text-white/30 bg-white/5"
                            )}>
                              {device.status}
                            </span>
                            {isSelected ? <ChevronUp size={10} className="text-white/40" /> : <ChevronDown size={10} className="text-white/40" />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, marginTop: 0 }}
                              animate={{ height: "auto", opacity: 1, marginTop: 8 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              transition={{ duration: 0.15 }}
                              className="space-y-2 overflow-hidden text-[9px] font-mono border-t border-white/5 pt-2"
                            >
                              {/* IP & Copy Action */}
                              <div className="flex justify-between items-center py-0.5">
                                <span className="text-white/40">NODE_IP:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-cyan-300 font-semibold">{device.ip}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(device.ip);
                                      setCopiedId(device.id);
                                      addLog(`COPY_CLIPBOARD: Copied IP ${device.ip} to clipboard`);
                                      setTimeout(() => setCopiedId(null), 2000);
                                    }}
                                    className="p-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {copiedId === device.id ? <Check size={8} className="text-emerald-400" /> : <Copy size={8} />}
                                  </button>
                                </div>
                              </div>

                              {/* Uplink Timeline */}
                              <div className="flex justify-between py-0.5">
                                <span className="text-white/40">LAST_CONNECT:</span>
                                <span className="text-white/80 shrink-0">{new Date(device.lastSeen).toLocaleTimeString()}</span>
                              </div>

                              {/* Hardware Node Signature */}
                              <div className="flex justify-between py-0.5">
                                <span className="text-white/40">HARDWARE_CHIP:</span>
                                <span className="text-emerald-400 font-bold">ESP32-S3 (Dual-Core)</span>
                              </div>

                              {/* Arms Config & LEDs */}
                              <div className="flex justify-between py-0.5">
                                <span className="text-white/40">ARM_DISP_LAYOUT:</span>
                                <span className="text-white/80">{settings.hardware.armsCount || 2} Arms</span>
                              </div>
                              <div className="flex justify-between py-0.5">
                                <span className="text-white/40">LED_RAD_RESOLUTION:</span>
                                <span className="text-pink-400">{settings.hardware.stripesCount || 3} Stripes ({settings.hardware.ledCount || 135} LEDs)</span>
                              </div>

                              {/* Simulated RSSI Signal */}
                              <div className="flex justify-between py-0.5">
                                <span className="text-white/40">SIGNAL_RSSI:</span>
                                <span className={cn(
                                  "font-bold",
                                  isOnline ? "text-cyan-400" : "text-white/30"
                                )}>
                                  {isOnline ? "-48 dBm (Strong)" : "Offline"}
                                </span>
                              </div>

                              {/* Styled Interactive Simulation Switch */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDeviceConnection(device.id);
                                }}
                                className={cn(
                                  "w-full mt-2.5 py-2 px-3 rounded-lg text-[8.5px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 border cursor-pointer",
                                  isOnline
                                    ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400 hover:border-red-500/40"
                                    : "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-cyan-400 hover:border-cyan-500/40"
                                )}
                              >
                                <Power size={9} />
                                {isOnline ? 'Simulate Disconnection' : 'Simulate Initialization'}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Realtime Event Log Section */}
              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[10px] font-mono tracking-widest text-white/30 uppercase">Live Activity Stream</span>
                  <span className="inline-flex h-1 w-1 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin font-mono text-[8.5px] leading-relaxed select-text">
                  {logs.slice(0, 5).map((log, index) => {
                    const isNodeLog = log.includes("NODE_CONNECTED") || log.includes("NODE_DISCONNECTED");
                    const isSystemOk = log.includes("CONNECTED") || log.includes("ONLINE") || log.includes("BOOT");
                    const isAlert = log.includes("DISCONNECTED") || log.includes("OFFLINE");
                    return (
                      <div 
                        key={index}
                        className={cn(
                          "py-1 px-1.5 rounded border-l-2 transition-all duration-300",
                          isNodeLog
                            ? "bg-cyan-500/[0.03] border-cyan-500/30 text-cyan-300"
                            : isSystemOk
                              ? "bg-emerald-500/[0.03] border-emerald-500/30 text-emerald-300"
                              : isAlert
                                ? "bg-red-500/[0.03] border-red-500/30 text-red-300 font-semibold"
                                : "bg-white/[0.01] border-white/5 text-white/50"
                        )}
                      >
                        {log}
                      </div>
                    );
                  })}
                  {logs.length === 0 && (
                    <div className="text-center text-white/20 py-2 italic">Waiting for telemetry logs...</div>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6">
               <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-mono hover:bg-white/10 transition-colors">
                 <Bell size={14} />
                 NOTIFICATIONS
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
