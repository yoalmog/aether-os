/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { SensorData, SystemStatus, AppSettings, Device } from '../types';

interface AppState {
  // Data
  sensors: SensorData[];
  status: SystemStatus;
  settings: AppSettings;
  devices: Device[];
  logs: string[];
  currentEffect: string;
  logoPoints: { x: number; y: number; z: number; color: string }[];
  compiledLogoHeaders: string;
  
  // Actions
  updateSensors: (sensors: SensorData[]) => void;
  updateStatus: (status: Partial<SystemStatus>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateHardware: (hardware: Partial<AppState['settings']['hardware']>) => void;
  addLog: (message: string) => void;
  setEffect: (effect: string) => void;
  sendCommand: (cmd: any) => void;
  toggleDeviceConnection: (id: string) => void;
  setLogoPoints: (points: { x: number; y: number; z: number; color: string }[]) => void;
  setCompiledLogoHeaders: (compiledLogoHeaders: string) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'CYAN_FLUX',
  soundEnabled: true,
  hapticsEnabled: true,
  esp32Url: 'ws://192.168.4.1:81',
  brightness: 180,
  hardware: {
    arm1Pin: 18,
    arm2Pin: 19,
    arm3Pin: 14,
    arm4Pin: 27,
    hallPin: 34,
    sdMosi: 23,
    sdMiso: 12, // shift SD MISO to avoid pin 19 conflict
    sdSck: 5,   // shift SD SCK to avoid pin 18 conflict
    sdCs: 15,   // shift SD CS
    ledCount: 135,
    baudRate: 115200,
    armsCount: 2,
    stripesCount: 3,
    ledsPerStripe: 45
  },
  customEffects: [
    { id: 'CUSTOM_PULSED', name: 'NEURAL_PULSE', color: '#ff0055', speed: 1.8, particleDensity: 300, distortion: 0.9, glow: 6.0 }
  ],
  networkConfig: {
    ip: '',
    subnet: '255.255.255.0',
    gateway: '',
    dns: '8.8.8.8'
  },
  hotspot: {
    enabled: false,
    ssid: 'HOLOSPIN_AP',
    password: '',
    encryption: 'WPA2'
  }
};

const loadSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem('AETHER_SETTINGS');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        hardware: {
          ...DEFAULT_SETTINGS.hardware,
          ...(parsed.hardware || {})
        },
        customEffects: parsed.customEffects || DEFAULT_SETTINGS.customEffects
      };
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage:', e);
  }
  return DEFAULT_SETTINGS;
};

const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem('AETHER_SETTINGS', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
};

const generateDefaultLogoPoints = () => {
  const points: { x: number; y: number; z: number; color: string }[] = [];
  const rings = [0.5, 1.0, 1.5, 2.0, 2.5];
  rings.forEach((r, idx) => {
    const numPoints = Math.round(r * 24);
    const color = idx % 3 === 0 ? '#06b6d4' : idx % 3 === 1 ? '#ec4899' : '#eab308';
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      points.push({
        x: r * Math.cos(angle),
        y: r * Math.sin(angle),
        z: (Math.random() - 0.5) * 0.15,
        color
      });
    }
  });
  return points;
};

export const useAppStore = create<AppState>((set) => {
  const initialSettings = loadSettings();

  return {
    sensors: [
      { id: '1', name: 'CORE_TEMP', value: 42, unit: '°C', timestamp: new Date().toISOString(), color: '#06b6d4' },
      { id: '2', name: 'FLUX_RPM', value: 3200, unit: 'RPM', timestamp: new Date().toISOString(), color: '#ec4899' },
      { id: '3', name: 'SIGNAL_DB', value: -64, unit: 'dBm', timestamp: new Date().toISOString(), color: '#eab308' },
    ],
    devices: [
      { id: 'esp-01', name: 'HOLOSPIN_X_ALPHA', ip: '192.168.4.1', status: 'ONLINE', lastSeen: new Date().toISOString() },
      { id: 'esp-02', name: 'HOLOSPIN_X_BETA', ip: '192.168.4.15', status: 'OFFLINE', lastSeen: new Date(Date.now() - 3200000).toISOString() },
    ],
    status: {
      cpu: 24,
      memory: 62,
      battery: 98,
      network: 'ONLINE',
      uptime: '00:00:00',
      wsStatus: 'DISCONNECTED',
      telemetry: {
        rpm: 0,
        temp: 0,
        fps: 0,
        wifi: 0,
        effect: 'NONE',
        brightness: initialSettings.brightness,
      }
    },
    settings: initialSettings,
    logs: [`[${new Date().toLocaleTimeString()}] AETHER_BOOT_SEQUENCE_COMPLETE`],
    currentEffect: 'LOGO',
    logoPoints: generateDefaultLogoPoints(),
    compiledLogoHeaders: '',

    updateSensors: (sensors) => set({ sensors }),
    updateStatus: (newStatus) => set((state) => ({ status: { ...state.status, ...newStatus } })),
    updateSettings: (newSettings) => set((state) => {
      const updated = { ...state.settings, ...newSettings };
      saveSettings(updated);
      return { settings: updated };
    }),
    updateHardware: (newHardware) => set((state) => {
      const updatedHardware = { ...state.settings.hardware, ...newHardware };
      const updated = { ...state.settings, hardware: updatedHardware };
      saveSettings(updated);
      return { settings: updated };
    }),
    addLog: (message) => set((state) => ({ logs: [`[${new Date().toLocaleTimeString()}] ${message}`, ...state.logs].slice(0, 50) })),
    setEffect: (effect) => set((state) => {
      state.addLog(`SWITCHING_MODE: ${effect}`);
      return { currentEffect: effect };
    }),
    sendCommand: (cmd) => set((state) => {
      const display = typeof cmd === 'object' ? JSON.stringify(cmd) : cmd;
      state.addLog(`TX_CMD: ${display}`);
      
      // Dispatch a global event so the useESP32Manager can pick it up
      window.dispatchEvent(new CustomEvent('esp32_cmd', { detail: cmd }));
      return {};
    }),
    toggleDeviceConnection: (id) => set((state) => {
      const updatedDevices = state.devices.map(d => {
        if (d.id === id) {
          const nextStatus = d.status === 'ONLINE' ? 'OFFLINE' as const : 'ONLINE' as const;
          state.addLog(nextStatus === 'ONLINE' ? `NODE_CONNECTED: ${d.name}` : `NODE_DISCONNECTED: ${d.name}`);
          return { ...d, status: nextStatus };
        }
        return d;
      });
      return { devices: updatedDevices };
    }),
    setLogoPoints: (logoPoints) => set({ logoPoints }),
    setCompiledLogoHeaders: (compiledLogoHeaders) => set({ compiledLogoHeaders }),
  };
});
