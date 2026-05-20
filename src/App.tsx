/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Zap, Globe, Cpu, ChevronRight, Activity } from 'lucide-react';
import { AetherBackground } from './components/AetherBackground';
import { GlassCard } from './components/GlassCard';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { HologramVisualizer } from './components/HologramVisualizer';
import { SensorChart } from './components/SensorChart';
import { SettingsView } from './components/SettingsView';
import { TerminalView } from './components/TerminalView';
import { SDBrowser } from './components/SDBrowser';
import { NetworkScanner } from './components/NetworkScanner';
import { EffectSelector } from './components/EffectSelector';
import { DeviceCard } from './components/DeviceCard';
import { LogoConverter } from './components/LogoConverter';
import { AppSettings, HardwareConfig } from './types';
import { cn } from './lib/utils';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from './store/useAppStore';
import { ThreeDVisualizer } from './components/ThreeDVisualizer';
import { useESP32Manager } from './hooks/useESP32Manager';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { sensors, status, settings, devices, logs, currentEffect, updateSettings, updateHardware, addLog, setEffect } = useAppStore(useShallow((state) => ({
    sensors: state.sensors,
    status: state.status,
    settings: state.settings,
    devices: state.devices,
    logs: state.logs,
    currentEffect: state.currentEffect,
    updateSettings: state.updateSettings,
    updateHardware: state.updateHardware,
    addLog: state.addLog,
    setEffect: state.setEffect
  })));

  const { connect: connectToESP32 } = useESP32Manager();
  const [geminiStatus, setGeminiStatus] = useState("QUERYING_NEURAL_MESH...");
  
  // Simulation of sensor history for charts
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([]);

  const FALLBACK_MESSAGES = [
    "NEURAL_LINK_STABLE: Monitoring hologram integrity. All systems optimal.",
    "POV_SYNC_LOCKED: Rotation stability confirmed at 1450 RPM.",
    "GRID_STATUS_GREEN: Vector projections holding steady.",
    "AETHER_CORE_ACTIVE: Processing real-time telemetry stream.",
    "FLUX_CAPACITY_NOMINAL: All projection arms responding."
  ];

  useEffect(() => {
    let fallbackIdx = 0;
    const fetchGemini = async () => {
      try {
        const res = await fetch('/api/gemini/status', { method: 'POST' });
        const data = await res.json();
        
        if (res.status === 403 || data.error === 'API_KEY_LEAKED') {
          setGeminiStatus("SECURITY_ALERT: API_KEY_LEAKED. Update Secrets to restore neural mesh.");
        } else if (res.status === 429 || data.error === 'QUOTA_EXHAUSTED') {
          setGeminiStatus(data.fallback || FALLBACK_MESSAGES[fallbackIdx % FALLBACK_MESSAGES.length]);
          fallbackIdx++;
        } else if (res.status === 401) {
           setGeminiStatus("WAITING_FOR_UPLINK: Configure GEMINI_API_KEY in Secrets.");
        } else {
          setGeminiStatus(data.report || "LINK_ESTABLISHED");
          addLog(`NEURAL_SYNC_ESTABLISHED: ${data.report?.slice(0, 20)}...`);
        }
      } catch (e) {
        setGeminiStatus(FALLBACK_MESSAGES[fallbackIdx % FALLBACK_MESSAGES.length]);
        fallbackIdx++;
      }
    };
    fetchGemini();
    
    // Periodically pulse Gemini status - increased to 5 minutes for quota safety
    const interval = setInterval(fetchGemini, 300000);
    return () => clearInterval(interval);
  }, [addLog]);

  useEffect(() => {
    // Collect data points for the first sensor (e.g. Core Temp)
    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString(), value: sensors[0].value }];
        return newData.slice(-20); // Keep last 20 points
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [sensors]);

  return (
    <div className="relative min-h-screen w-full font-sans text-white selection:bg-cyan-500/30 overflow-x-hidden">
      <AetherBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-6 px-8 bg-white/5 border-b border-white/10 backdrop-blur-lg">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="rounded-xl border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
        >
          <Menu size={20} className="text-cyan-400" />
        </button>
        
        <div className="flex flex-col items-center flex-1">
          <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">CyberOS // Production Node</div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-light tracking-tight text-white">System Overview</span>
            <span className="text-[10px] font-mono text-white/20 mt-1">v4.2.0-STABLE</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/30">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></div>
          <span className="text-[8px] font-mono text-green-400 uppercase tracking-tighter">
            {status.wsStatus === 'CONNECTED' ? 'ESP_SYNC' : 'WS_READY'}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-6 pb-32 pt-24 max-w-lg">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* AI Status Card */}
              <GlassCard className="border-cyan-500/20 bg-cyan-500/5" glow>
                <div className="mb-2 flex items-center gap-2">
                  <Globe size={14} className="text-cyan-400" />
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">Neural Status</span>
                </div>
                <p className="text-xs font-mono leading-relaxed text-white/80 italic">
                  "{geminiStatus}"
                </p>
              </GlassCard>

              {/* Mode Selection */}
              <EffectSelector 
                currentEffect={currentEffect}
                onSelect={(id) => setEffect(id)}
              />

              {/* Connected Devices Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Active_Bridge_Nodes</h3>
                  <span className="text-[8px] font-mono text-emerald-400">{devices.length}_SECURED</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {devices.map(dev => (
                    <DeviceCard key={dev.id} device={dev} />
                  ))}
                </div>
              </div>

              {/* Real 3D Visualizer with HUD Overlays */}
              <div className="relative border border-white/5 rounded-3xl bg-black/40 overflow-hidden backdrop-blur-md">
                <ThreeDVisualizer />
                
                {/* Floating HUD Labels */}
                <div className="absolute top-0 left-0 space-y-4 pointer-events-none">
                  <motion.div 
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="p-2 border-l-2 border-cyan-400 bg-cyan-400/5 backdrop-blur-md"
                  >
                    <div className="text-[7px] font-mono text-cyan-400 uppercase">Vector_Stability</div>
                    <div className="text-[10px] font-bold">99.9%</div>
                  </motion.div>

                   <motion.div 
                    animate={{ x: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 5 }}
                    className="p-2 border-l-2 border-pink-400 bg-pink-400/5 backdrop-blur-md"
                  >
                    <div className="text-[7px] font-mono text-pink-400 uppercase">Flux_Cohesion</div>
                    <div className="text-[10px] font-bold">OPTIMAL</div>
                  </motion.div>
                </div>

                <div className="absolute top-0 right-0 space-y-4 text-right pointer-events-none">
                  <motion.div 
                    animate={{ x: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="p-2 border-r-2 border-yellow-400 bg-yellow-400/5 backdrop-blur-md"
                  >
                    <div className="text-[7px] font-mono text-yellow-400 uppercase">Grid_Sync</div>
                    <div className="text-[10px] font-bold">LOCKED</div>
                  </motion.div>
                </div>
              </div>

              {/* System Overview Grid */}
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <Activity size={16} className="text-pink-400" />
                    <span className="text-[10px] font-mono text-white/40">FAN_RPM</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{status.telemetry?.rpm || 0}</div>
                    <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ width: `${(status.telemetry?.rpm || 0) / 20}%` }}
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500" 
                      />
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="flex flex-col justify-between">
                   <div className="flex items-center justify-between mb-4">
                    <Zap size={16} className="text-yellow-400" />
                    <span className="text-[10px] font-mono text-white/40">ESP_BRIDGE</span>
                  </div>
                  <div>
                    <div className={cn(
                      "text-xs font-mono",
                      status.wsStatus === 'CONNECTED' ? "text-emerald-400" : "text-white/20"
                    )}>
                      {status.wsStatus === 'CONNECTED' ? 'SYMMETRIC_SYNC' : 'LINK_INACTIVE'}
                    </div>
                    <div className="mt-1 text-[10px] text-white/40 italic">
                      {status.wsStatus === 'CONNECTED' ? 'bridge_0xFA...92' : 'awaiting_init...'}
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Advanced Telemetry Mini Grid */}
              <div className="grid grid-cols-3 gap-4">
                 <div className="flex flex-col items-center p-3 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[7px] font-mono text-white/30 uppercase">Temp</span>
                    <span className="text-xs font-bold text-white/90">{status.telemetry?.temp || 0}°C</span>
                 </div>
                 <div className="flex flex-col items-center p-3 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[7px] font-mono text-white/30 uppercase">FPS</span>
                    <span className="text-xs font-bold text-cyan-400">{status.telemetry?.fps || 0}</span>
                 </div>
                 <div className="flex flex-col items-center p-3 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[7px] font-mono text-white/30 uppercase">WiFi</span>
                    <span className="text-xs font-bold text-white/90">{status.telemetry?.wifi || 0}dBm</span>
                 </div>
              </div>

              {/* Live Sensor Charts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase">Active Telemetry</h3>
                  <ChevronRight size={14} className="text-white/20" />
                </div>
                
                {sensors.map((sensor, idx) => (
                  <GlassCard key={sensor.id}>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-mono text-white/40 uppercase">{sensor.name}</span>
                       <span className="text-xs font-bold" style={{ color: sensor.color }}>
                         {sensor.value.toFixed(1)} {sensor.unit}
                       </span>
                    </div>
                    {idx === 0 && <SensorChart data={chartData} color={sensor.color} name={sensor.name} />}
                  </GlassCard>
                ))}
              </div>

              {/* Status Footer */}
              <div className="pt-4 flex flex-col items-center gap-2 opacity-30">
                <div className="text-[7px] font-mono tracking-widest text-white/40 uppercase">
                  ENCRYPTION: AES-256-GCM // AUTH: OAUTH2_TOKEN // ENGINE: THREE_JS
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-1">
                     <div className="h-0.5 w-0.5 bg-cyan-400 rounded-full" />
                     <span className="text-[7px] font-mono">TX: 4.8 KB/s</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <div className="h-0.5 w-0.5 bg-purple-400 rounded-full" />
                     <span className="text-[7px] font-mono">RX: 12.1 KB/s</span>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sensors' && (
             <motion.div
               key="sensors"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.05 }}
               className="flex flex-col items-center justify-center min-h-[50vh] text-center"
             >
               <Activity size={48} className="text-cyan-400 mb-4 opacity-20" />
               <h2 className="text-xl font-bold tracking-tighter">CORE_TELEMETRY</h2>
               <div className="grid gap-4 w-full mt-8">
                 {sensors.map(s => (
                   <GlassCard key={s.id} className="flex items-center justify-between">
                     <div className="text-left">
                       <div className="text-[10px] font-mono text-white/40">{s.name}</div>
                       <div className="text-sm font-bold">{s.value.toFixed(2)} {s.unit}</div>
                     </div>
                     <div className="h-8 w-24 bg-white/5 rounded-lg overflow-hidden border border-white/5">
                        <motion.div 
                          animate={{ x: [-100, 100] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="h-full w-4 bg-cyan-500/10 blur-sm" 
                        />
                     </div>
                   </GlassCard>
                 ))}
               </div>
             </motion.div>
          )}

          {activeTab === 'console' && (
            <motion.div
              key="console"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[60vh]"
            >
              <TerminalView logs={logs} />
            </motion.div>
          )}

          {activeTab === 'converter' && (
            <LogoConverter />
          )}

          {activeTab === 'sd' && (
            <SDBrowser />
          )}

          {activeTab === 'network' && (
            <NetworkScanner />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              settings={settings}
              updateSettings={updateSettings}
              updateHardware={updateHardware}
              wsStatus={status.wsStatus}
              onConnect={(url) => connectToESP32(url || settings.esp32Url)}
            />
          )}
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

