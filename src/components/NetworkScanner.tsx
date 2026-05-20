/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, Radio, RefreshCw, Lock, Unlock, SignalHigh, SignalMedium, SignalLow, ArrowDownUp } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

interface Network {
  ssid: string;
  rssi: number;
  secure: boolean;
  bssid: string;
  protocol: string;
  channel: number;
}

export const NetworkScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [sortStrongest, setSortStrongest] = useState(false);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [passwordPrompt, setPasswordPrompt] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  
  const addLog = useAppStore(state => state.addLog);
  const status = useAppStore(state => state.status);
  const sendCommand = useAppStore(state => state.sendCommand);
  const settings = useAppStore(state => state.settings);
  const updateSettings = useAppStore(state => state.updateSettings);

  const scanNetworks = () => {
    setScanning(true);
    setNetworks([]);
    addLog('WIFI_SCAN: Initiating 2.4GHz spectrum sweep...');
    
    setTimeout(() => {
      let mockNetworks: Network[] = [
        { ssid: 'HOLOSPIN_X', rssi: -35, secure: true, bssid: '00:1A:2B:3C:4D:5E', protocol: 'WPA2/WPA3', channel: 6 },
        { ssid: 'Matrix_Node_7', rssi: -62, secure: true, bssid: 'A1:B2:C3:D4:E5:F6', protocol: 'WPA2', channel: 11 },
        { ssid: 'Open_Guest_Net', rssi: -80, secure: false, bssid: '11:22:33:44:55:66', protocol: 'OPEN', channel: 1 },
        { ssid: 'Cyber_Link_5G', rssi: -45, secure: true, bssid: '55:66:77:88:99:00', protocol: 'WPA3', channel: 36 },
      ];
      setNetworks(mockNetworks);
      setScanning(false);
      addLog(`WIFI_SCAN: Complete. Found ${mockNetworks.length} networks.`);
    }, 2500);
  };

  const getSignalIcon = (rssi: number) => {
    if (rssi > -50) return <SignalHigh size={16} className="text-emerald-400" />;
    if (rssi > -70) return <SignalMedium size={16} className="text-yellow-400" />;
    return <SignalLow size={16} className="text-red-400" />;
  };

  const getSignalPercentage = (rssi: number) => {
    return Math.min(100, Math.max(0, 2 * (rssi + 100)));
  };

  const handleConnect = (ssid: string, secure: boolean) => {
    if (secure) {
      setPasswordPrompt(ssid);
      setPasswordInput('');
    } else {
      executeConnect(ssid, '');
    }
  };

  const executeConnect = (ssid: string, password: string) => {
    setPasswordPrompt(null);
    setConnectingTo(ssid);
    addLog(`WIFI_CONNECT: Attempting association with ${ssid}...`);
    sendCommand({ cmd: 'wifi_connect', ssid, password });
    
    setTimeout(() => {
      setConnectingTo(null);
      addLog(`WIFI_CONNECT: Successfully associated with ${ssid}.`);
    }, 3000);
  };

  useEffect(() => {
    if (status.wsStatus === 'CONNECTED') {
      scanNetworks();
    }
  }, [status.wsStatus]);

  const displayedNetworks = sortStrongest 
    ? [...networks].sort((a, b) => b.rssi - a.rssi)
    : networks;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 pb-28">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio size={20} className="text-cyan-400" />
          <h2 className="text-lg font-bold tracking-tighter uppercase">Spectrum Scanner</h2>
        </div>
        <button 
          onClick={scanNetworks}
          disabled={scanning}
          className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={14} className={scanning ? 'animate-spin text-cyan-400' : 'text-white/70'} />
        </button>
      </div>

      <GlassCard className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
            Local Connectivity Environment
          </div>
          <button 
            onClick={() => setSortStrongest(!sortStrongest)}
            className={cn(
              "p-1.5 rounded-lg border transition-colors flex items-center gap-1",
              sortStrongest ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
            )}
          >
            <ArrowDownUp size={12} />
            <span className="text-[8px] uppercase tracking-wider font-mono">Signal</span>
          </button>
        </div>
        
        {scanning ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
              <Wifi size={32} className="text-cyan-400 animate-bounce relative z-10" />
            </div>
            <div className="text-xs font-mono text-white/50 uppercase tracking-widest animate-pulse">
              Sweeping Frequencies...
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {displayedNetworks.length > 0 ? displayedNetworks.map((net, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                  key={net.bssid} 
                  className="flex flex-col p-3 bg-black/40 border border-white/5 rounded-lg hover:border-cyan-500/30 transition-colors group"
                >
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => handleConnect(net.ssid, net.secure)}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-full group-hover:bg-cyan-500/10 transition-colors">
                        {getSignalIcon(net.rssi)}
                      </div>
                      <div>
                        <div className="text-sm font-bold tracking-tight text-white/90 group-hover:text-cyan-400 transition-colors">
                          {net.ssid}
                        </div>
                        <div className="text-[9px] font-mono text-white/40 mt-1 flex gap-2">
                          <span>BSSID: {net.bssid}</span>
                          <span className="text-cyan-400/50">CH: {net.channel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono text-white/40 uppercase">{net.protocol}</span>
                        {net.secure ? <Lock size={12} className="text-white/30" /> : <Unlock size={12} className="text-orange-400" />}
                        <span className="text-[10px] font-mono text-white/60">{getSignalPercentage(net.rssi)}%</span>
                      </div>
                      <button className="text-[8px] font-mono uppercase bg-white/5 hover:bg-cyan-500/20 text-white/50 hover:text-cyan-400 border border-white/10 border-transparent px-2 py-0.5 rounded transition-all">
                        {connectingTo === net.ssid ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Password Prompt */}
                  {passwordPrompt === net.ssid && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-white/10 flex gap-2"
                    >
                      <input 
                        type="password" 
                        placeholder="Network Password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-mono text-white focus:outline-none focus:border-cyan-500/50"
                      />
                      <button 
                        onClick={() => executeConnect(net.ssid, passwordInput)}
                        className="px-3 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-lg text-[10px] font-mono hover:bg-cyan-500/40 transition-colors uppercase tracking-widest"
                      >
                        Join
                      </button>
                      <button 
                        onClick={() => setPasswordPrompt(null)}
                        className="px-3 bg-white/5 text-white/50 border border-white/10 rounded-lg text-[10px] font-mono hover:bg-white/10 transition-colors uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )) : (
                <div className="text-center py-8 text-xs font-mono text-white/30">
                  No networks detected. Initiate scan.
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </GlassCard>
      
      {/* Hotspot/AP Configuration */}
      <GlassCard className="p-4 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <Wifi size={14} className="text-cyan-400" />
          <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Hotspot / AP Configuration</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/80">Enable AP Soft-Hotspot</span>
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
              addLog(`WIFI_AP: Broad-spectrum AP signal command => SSID: ${hs.ssid}`);
              sendCommand({
                cmd: 'set_ap_mode',
                enabled: hs.enabled,
                ssid: hs.ssid,
                password: hs.password,
                encryption: hs.encryption
              });
            }}
            className="w-full py-2.5 rounded-xl text-[10px] font-mono tracking-widest text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 active:scale-95 transition-all uppercase"
          >
            APPLY HOTSPOT CONFIG
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-4 space-y-4">
        <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
          Network Topology
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/40 p-3 rounded-lg border border-white/5">
            <div className="text-[10px] font-mono text-cyan-400 uppercase mb-1">Local AP Mode</div>
            <div className="text-sm font-bold">192.168.4.1</div>
            <div className="text-[9px] font-mono text-white/40 mt-1">Subnet: 255.255.255.0</div>
          </div>
          <div className="bg-black/40 p-3 rounded-lg border border-white/5">
            <div className="text-[10px] font-mono text-emerald-400 uppercase mb-1">WebSocket Port</div>
            <div className="text-sm font-bold">PORT 81</div>
            <div className="text-[9px] font-mono text-white/40 mt-1">Protocol: ws://</div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};
