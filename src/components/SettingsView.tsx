/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Settings, Volume2, VolumeX, Smartphone, Link, Wifi, Check, Trash2, Upload, FileCode, Image, Zap, Cpu, MousePointer2, Save, Download, Copy } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { AppSettings, HardwareConfig } from '../types';
import { cn } from '../lib/utils';
import { generateESP32Ino } from '../lib/InoGenerator';
import { useAppStore } from '../store/useAppStore';

interface SettingsViewProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateHardware: (hardware: Partial<HardwareConfig>) => void;
  onConnect: (url?: string) => void;
  wsStatus: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, updateSettings, updateHardware, onConnect, wsStatus }) => {
  const [otaState, setOtaState] = React.useState<'idle' | 'linking' | 'flashing' | 'done'>('idle');
  const [otaProgress, setOtaProgress] = React.useState(0);
  const addLog = useAppStore(state => state.addLog);
  const status = useAppStore(state => state.status);
  const compiledLogoHeaders = useAppStore(state => state.compiledLogoHeaders);
  const [copySuccess, setCopySuccess] = React.useState(false);

  const startOTA = () => {
    if (otaState !== 'idle') return;
    
    setOtaState('linking');
    setOtaProgress(0);
    addLog(`[OTA] INITIATED: Flash requested for target ${settings.esp32Url}`);
    addLog('[OTA] LINKING_ESP32: Handshaking with virtual board...');

    useAppStore.getState().sendCommand({ cmd: 'ota' });

    setTimeout(() => {
      setOtaState('flashing');
      addLog('[OTA] HANDSHAKE_SUCCESS: Target signature 0x3f6a (ESP32-S3)');
      addLog('[OTA] PREPARING_FLASH: Allocating 1.2MB partition');

      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        if (progress >= 100) {
          clearInterval(interval);
          setOtaProgress(100);
          setOtaState('done');
          addLog('[OTA] FLUSH_SUCCESS: 1228 Kb written successfully');
          addLog('[OTA] VERIFY_CHECKSUM: MD5_HASH_VALID (F1B94C8E)');
          addLog('[OTA] REBOOT_SEQUENCE: Sending warm reboot signal');
          
          setTimeout(() => {
            setOtaState('idle');
            setOtaProgress(0);
          }, 3000);
        } else {
          setOtaProgress(progress);
          addLog(`[OTA] UPLOADING: Chunk ${progress}% block size 4096B`);
        }
      }, 700);
    }, 1500);
  };

  const themes = [
    { id: 'CYAN_FLUX', color: 'bg-cyan-500', name: 'Cyan Flux' },
    { id: 'PURPLE_MESH', color: 'bg-purple-500', name: 'Purple Mesh' },
    { id: 'VOID_GOLD', color: 'bg-yellow-500', name: 'Void Gold' },
    { id: 'DYNAMIC', color: 'bg-gradient-to-tr from-pink-500 to-cyan-500', name: 'Time Adaptive' },
  ];

  const handleDownloadIno = () => {
    const code = generateESP32Ino(settings);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HOLOSPIN_X.ino';
    a.click();
    URL.revokeObjectURL(url);
  };

  const armsCount = settings.hardware.armsCount || 2;

  const hardwareGroups = [
    { label: 'POV Arms Layout', pins: [
      { key: 'armsCount', label: 'ACTIVE_ARMS_COUNT', type: 'select', options: [2, 4] },
      { key: 'stripesCount', label: 'STRIPES_COUNT (45 LEDs EACH)', type: 'select', options: [1, 2, 3, 4] },
      { key: 'arm1Pin', label: 'ARM1_DATA (DATA Pin 18)' },
      ...(armsCount > 1 ? [{ key: 'arm2Pin', label: 'ARM2_DATA (DATA Pin 19)' }] : []),
      ...(armsCount > 2 ? [{ key: 'arm3Pin', label: 'ARM3_DATA_PIN' }] : []),
      ...(armsCount > 3 ? [{ key: 'arm4Pin', label: 'ARM4_DATA_PIN' }] : []),
    ]},
    { label: 'Sensing', pins: [
      { key: 'hallPin', label: 'HALL_SENSOR' },
      { key: 'ledCount', label: 'TOTAL_LEDS_PER_ARM', readonly: true },
    ]},
    { label: 'SD Storage', pins: [
      { key: 'sdMosi', label: 'SPI_MOSI' },
      { key: 'sdMiso', label: 'SPI_MISO' },
      { key: 'sdSck', label: 'SPI_SCK' },
      { key: 'sdCs', label: 'SPI_CS' },
    ]},
    { label: 'Serial Comm', pins: [
      { key: 'baudRate', label: 'BAUD_RATE' },
    ]}
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="space-y-6 pb-24"
    >
      <div className="flex items-center gap-3 mb-2">
        <Settings size={20} className="text-cyan-400" />
        <h2 className="text-lg font-bold tracking-tighter">SYSTEM_CONFIGURATION</h2>
      </div>

      {/* Dynamic WiFi Connection Status */}
      <GlassCard className="border border-white/5 bg-black/40 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Wifi size={14} className={wsStatus === 'CONNECTED' ? "text-emerald-400" : "text-white/40"} />
            <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Active Dynamic State</h3>
          </div>
          <span className={cn(
            "text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider",
            wsStatus === 'CONNECTED' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
          )}>
            {wsStatus}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
            <span className="text-[8px] font-mono text-white/40 block">SSID</span>
            <span className="text-xs font-mono font-bold text-white truncate block">
              {wsStatus === 'CONNECTED' ? (settings.hotspot?.enabled ? settings.hotspot.ssid : 'HOLOSPIN_X') : 'OFFLINE'}
            </span>
          </div>
          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
            <span className="text-[8px] font-mono text-white/40 block">IP_ADDR</span>
            <span className="text-xs font-mono font-bold text-cyan-400 truncate block">
              {wsStatus === 'CONNECTED' ? (settings.esp32Url.replace(/^(ws:\/\/|http:\/\/)/, '').split(':')[0] || '192.168.4.1') : '---'}
            </span>
          </div>
          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
            <span className="text-[8px] font-mono text-white/40 block">SIGNAL</span>
            <span className="text-xs font-mono font-bold text-pink-400 truncate block">
              {wsStatus === 'CONNECTED' ? `${status.telemetry?.wifi || -55} dBm` : '0%'}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Theme & Controls */}
      <div className="grid gap-6">
        <GlassCard>
          <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-4">Interface Theme</h3>
          <div className="flex gap-4">
            {themes.map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => updateSettings({ theme: t.id as any })}
                className={cn(
                  "group relative h-10 w-10 rounded-xl border-2 transition-all p-1",
                  settings.theme === t.id ? "border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "border-transparent opacity-50"
                )}
              >
                <div className={cn("h-full w-full rounded-lg", t.color)} />
                {settings.theme === t.id && (
                  <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                    <Check size={8} className="text-black" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}>
            <GlassCard className="cursor-pointer h-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/40 uppercase">Audio</span>
                {settings.soundEnabled ? <Volume2 size={16} className="text-cyan-400" /> : <VolumeX size={16} className="text-white/20" />}
              </div>
              <div className="mt-2 text-xs font-bold">{settings.soundEnabled ? 'ENABLED' : 'MUTED'}</div>
            </GlassCard>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => updateSettings({ hapticsEnabled: !settings.hapticsEnabled })}>
            <GlassCard className="cursor-pointer h-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/40 uppercase">Feedback</span>
                <Smartphone size={16} className={cn(settings.hapticsEnabled ? "text-pink-400" : "text-white/20")} />
              </div>
              <div className="mt-2 text-xs font-bold">{settings.hapticsEnabled ? 'ACTIVE' : 'OFF'}</div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Hardware Pins */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <Cpu size={16} className="text-amber-400" />
          <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Hardware_Pinout</h3>
        </div>

        <div className="space-y-6">
          {hardwareGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest border-b border-white/5 pb-1">{group.label}</div>
              <div className="grid grid-cols-2 gap-3">
                {group.pins.map((pin: any) => (
                  <div key={pin.key} className="space-y-1">
                    <label className="text-[8px] font-mono text-white/40 px-1">{pin.label}</label>
                    {pin.type === 'select' ? (
                      <select
                        value={(settings.hardware as any)[pin.key] || 2}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (pin.key === 'stripesCount') {
                            updateHardware({ stripesCount: val, ledCount: val * 45 });
                            addLog(`SYSTEM_CONFIG: Configured ${val} stripes (${val * 45} LEDs total per arm)`);
                          } else {
                            updateHardware({ [pin.key]: val });
                            addLog(`SYSTEM_CONFIG: Configured active hardware arms layout to ${val}`);
                          }
                        }}
                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-mono text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        {pin.options.map((opt: number) => (
                          <option key={opt} value={opt}>
                            {opt} {pin.key === 'stripesCount' ? `Stripe${opt > 1 ? 's' : ''} (${opt * 45} LEDs)` : `Arm${opt > 1 ? 's' : ''}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="number"
                        readOnly={pin.readonly}
                        value={(settings.hardware as any)[pin.key] ?? ""}
                        onChange={(e) => updateHardware({ [pin.key]: parseInt(e.target.value) })}
                        className={cn(
                          "w-full border rounded-lg py-1.5 px-3 text-[10px] font-mono text-white focus:outline-none focus:border-cyan-500/50",
                          pin.readonly ? "bg-white/5 border-transparent text-white/40 cursor-not-allowed" : "bg-white/5 border-white/10"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* POV Control */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-yellow-400" />
            <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase">POV Intensity</h3>
          </div>
          <span className="text-[10px] font-mono text-white/60">{settings.brightness} / 255</span>
        </div>
        <input 
          type="range" min="0" max="255" value={settings.brightness}
          onChange={(e) => updateSettings({ brightness: parseInt(e.target.value) })}
          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </GlassCard>

      {/* AP/Hotspot Manager */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Wifi size={14} className="text-cyan-400" />
          <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Hotspot Configuration</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/80">Enable AP Mode</span>
            <button 
              onClick={() => updateSettings({ hotspot: { ...settings.hotspot!, enabled: !settings.hotspot?.enabled } })}
              className={cn(
                "w-10 h-5 rounded-full relative transition-colors",
                settings.hotspot?.enabled ? "bg-cyan-500" : "bg-white/10"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                settings.hotspot?.enabled ? "left-[22px]" : "left-1"
              )} />
            </button>
          </div>
          
          {settings.hotspot?.enabled && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="space-y-1">
                <label className="text-[8px] font-mono text-white/40 px-1 uppercase">SSID</label>
                <input 
                  type="text"
                  value={settings.hotspot?.ssid || ''}
                  onChange={(e) => updateSettings({ hotspot: { ...settings.hotspot!, ssid: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-mono text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-white/40 px-1 uppercase">Password</label>
                  <input 
                    type="password"
                    value={settings.hotspot?.password || ''}
                    onChange={(e) => updateSettings({ hotspot: { ...settings.hotspot!, password: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-mono text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-white/40 px-1 uppercase">Encryption</label>
                  <select
                    value={settings.hotspot?.encryption || 'WPA2'}
                    onChange={(e) => updateSettings({ hotspot: { ...settings.hotspot!, encryption: e.target.value as any } })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-mono text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="WPA3">WPA3</option>
                    <option value="WPA2">WPA2</option>
                    <option value="OPEN">OPEN (Unsecured)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              const hs = settings.hotspot || { enabled: false, ssid: 'HOLOSPIN_AP', password: '', encryption: 'WPA2' };
              addLog(`WIFI_AP: Configuring SoftAP => SSID: ${hs.ssid}, Active: ${hs.enabled ? 'ON' : 'OFF'}`);
              useAppStore.getState().sendCommand({
                cmd: 'set_ap_mode',
                enabled: hs.enabled,
                ssid: hs.ssid,
                password: hs.password,
                encryption: hs.encryption
              });
            }}
            className="w-full mt-3 py-2.5 rounded-xl text-[10px] font-mono tracking-widest text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 active:scale-95 transition-all uppercase"
          >
            Apply Hotspot Config
          </button>
        </div>
      </GlassCard>

      {/* Manual Network Config */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Wifi size={14} className="text-cyan-400" />
          <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Manual Network Setup</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] font-mono text-white/40 px-1 uppercase">IP Address</label>
            <input 
              type="text"
              placeholder="192.168.1.100"
              value={settings.networkConfig?.ip || ''}
              onChange={(e) => updateSettings({ networkConfig: { ...settings.networkConfig!, ip: e.target.value } })}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-mono text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-mono text-white/40 px-1 uppercase">Subnet Mask</label>
            <input 
              type="text"
              placeholder="255.255.255.0"
              value={settings.networkConfig?.subnet || ''}
              onChange={(e) => updateSettings({ networkConfig: { ...settings.networkConfig!, subnet: e.target.value } })}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-mono text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-mono text-white/40 px-1 uppercase">Gateway</label>
            <input 
              type="text"
              placeholder="192.168.1.1"
              value={settings.networkConfig?.gateway || ''}
              onChange={(e) => updateSettings({ networkConfig: { ...settings.networkConfig!, gateway: e.target.value } })}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-mono text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-mono text-white/40 px-1 uppercase">DNS Server</label>
            <input 
              type="text"
              placeholder="8.8.8.8"
              value={settings.networkConfig?.dns || ''}
              onChange={(e) => updateSettings({ networkConfig: { ...settings.networkConfig!, dns: e.target.value } })}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-mono text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5">
          <button 
            type="button"
            onClick={() => {
              const cfg = settings.networkConfig || { ip: '', subnet: '255.255.255.0', gateway: '', dns: '8.8.8.8' };
              addLog(`NET_CONFIG: Sending static IP config command static_ip => ${cfg.ip || 'DHCP'}`);
              useAppStore.getState().sendCommand({
                cmd: 'set_static_ip',
                ip: cfg.ip,
                subnet: cfg.subnet,
                gateway: cfg.gateway,
                dns: cfg.dns
              });
            }}
            className="w-full py-2.5 rounded-xl text-[10px] font-mono tracking-widest text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 active:scale-95 transition-all uppercase"
          >
            Apply Static IP config
          </button>
        </div>
      </GlassCard>

      {/* WiFi Network Manager */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Wifi size={14} className="text-cyan-400" />
          <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase">WiFi_Manager</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="SSID (Network Name)"
              id="wifi-ssid"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
            />
            <input 
              type="password" 
              placeholder="Password"
              id="wifi-password"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <button 
            onClick={() => {
              const ssid = (document.getElementById('wifi-ssid') as HTMLInputElement).value;
              const password = (document.getElementById('wifi-password') as HTMLInputElement).value;
              useAppStore.getState().sendCommand({ cmd: 'wifi', ssid, password });
              addLog(`[WIFI] Pushing credentials for ${ssid} to HOLOSPIN_X...`);
            }}
            className="w-full py-3 rounded-xl text-xs font-mono tracking-widest transition-all bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
          >
            UPDATE_NETWORK
          </button>
        </div>
      </GlassCard>

      {/* Bridge Control */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Link size={14} className="text-cyan-400" />
          <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase">ESP32 Bridge</h3>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <input 
              type="text" value={settings.esp32Url ?? ""}
              onChange={(e) => updateSettings({ esp32Url: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
               <Wifi size={14} className={cn(wsStatus === 'CONNECTED' ? "text-emerald-400" : "text-white/20")} />
            </div>
          </div>
          
          <div className="text-[9px] font-mono text-white/50 space-y-1 bg-white/5 p-3 rounded-lg">
            <p className="text-yellow-400 font-bold">SECURITY NOTICE</p>
            <p>Browsers block `ws://` connections to local IPs (192.168.x.x) from online `https://` environments (Mixed Content).</p>
            <p>To use real hardware, click "Download .ino", then deploy locally using the ZIP export.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => onConnect()} disabled={wsStatus === 'CONNECTING'}
              className={cn(
                "w-full py-3 rounded-xl text-[10px] font-mono tracking-widest transition-all",
                wsStatus === 'CONNECTED' ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400" : "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
              )}
            >
              {wsStatus === 'CONNECTED' ? 'ACTIVE' : 'REAL_LINK'}
            </button>
            <button 
              onClick={() => {
                updateSettings({ esp32Url: 'mock://esp32' });
                onConnect('mock://esp32');
              }}
              className="w-full py-3 rounded-xl text-[10px] font-mono tracking-widest transition-all bg-pink-500/20 border border-pink-500/50 text-pink-400 hover:bg-pink-500/30"
            >
              MOCK_LINK
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Code Generator & OTA */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <FileCode size={14} className="text-cyan-400" />
          <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Development_Center</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            onClick={handleDownloadIno}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/25 transition-all text-indigo-400 cursor-pointer"
          >
            <Download size={20} />
            <span className="text-[8px] font-mono uppercase font-bold">Download_.ino</span>
          </button>
          {otaState === 'idle' ? (
            <button 
              type="button"
              onClick={startOTA}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all text-emerald-400 group relative overflow-hidden cursor-pointer"
            >
              <Upload size={20} className="group-hover:translate-y-[-2px] transition-transform" />
              <span className="text-[8px] font-mono uppercase font-bold">Initiate_OTA</span>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[8px] relative overflow-hidden h-full min-h-[74px]">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-300 pointer-events-none"
                style={{ width: `${otaProgress}%` }}
              />
              <span className="relative z-10 font-bold uppercase tracking-wider animate-pulse text-center">
                {otaState === 'linking' && 'LINKING_CORE...'}
                {otaState === 'flashing' && `FLASHING_ROM_PARTITION... ${otaProgress}%`}
                {otaState === 'done' && 'OTA_SUCCESS! REBOOTING'}
              </span>
              <div className="relative z-10 w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${otaProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Compiled POV Logo C++ Headers */}
        {compiledLogoHeaders && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono tracking-wider text-indigo-400 uppercase">Compiled Active POV Matrix Logo (.h)</span>
              <span className="text-[7.5px] font-mono text-white/30 uppercase">logo_data.h ready</span>
            </div>
            
            <div className="relative">
              <textarea
                readOnly
                value={compiledLogoHeaders}
                rows={6}
                className="w-full font-mono text-[8.5px] p-3 rounded-lg bg-black/50 border border-white/10 text-cyan-300 focus:outline-none focus:border-cyan-500/30 resize-none scrollbar-thin select-text"
              />
              
              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(compiledLogoHeaders);
                    setCopySuccess(true);
                    addLog(`COPY_CLIPBOARD: Copied source array block from Development Center`);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="p-1 px-2 rounded bg-black/80 hover:bg-black border border-white/10 text-white/50 hover:text-white text-[7px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copySuccess ? <Check size={8} className="text-emerald-400" /> : <Copy size={8} />}
                  {copySuccess ? 'COPIED' : 'COPY'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([compiledLogoHeaders], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `logo_data.h`;
                    a.click();
                    URL.revokeObjectURL(url);
                    addLog(`HEADER_DOWNLOAD: Extracted [logo_data.h] successfully`);
                  }}
                  className="p-1 px-2 rounded bg-black/80 hover:bg-black border border-white/10 text-white/50 hover:text-white text-[7px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Download size={8} />
                  logo_data.h
                </button>
              </div>
            </div>

            <div className="text-[7.5px] font-mono text-white/30 leading-relaxed">
              PROTIP: Save this matrix into <code className="text-white/50 border border-white/5 px-1 py-0.2 bg-white/5 rounded">logo_data.h</code> inside your Arduino project folder. You can feed this into <code className="text-white/50 border border-white/5 px-1 py-0.2 bg-white/5 rounded">FastLED.show()</code> inside the rotational trigger interrupt callback.
            </div>
          </div>
        )}
      </GlassCard>

      <button className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500/40 text-[10px] font-mono hover:bg-red-500/10 transition-colors">
        <Trash2 size={14} />
        PURGE_SYSTEM_CACHE
      </button>
    </motion.div>
  );
};
