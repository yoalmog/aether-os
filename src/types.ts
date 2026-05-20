/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SensorData {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  color: string;
}

export interface ESP32Telemetry {
  rpm: number;
  temp: number;
  fps: number;
  wifi: number;
  effect: string;
  brightness: number;
}

export interface SystemStatus {
  cpu: number;
  memory: number;
  battery: number;
  network: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  uptime: string;
  wsStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  telemetry?: ESP32Telemetry;
}

export interface HardwareConfig {
  arm1Pin: number;
  arm2Pin: number;
  arm3Pin: number;
  arm4Pin: number;
  hallPin: number;
  sdMosi: number;
  sdMiso: number;
  sdSck: number;
  sdCs: number;
  ledCount: number;
  baudRate: number;
  armsCount?: number;
  stripesCount?: number;
  ledsPerStripe?: number;
}

export interface Device {
  id: string;
  name: string;
  ip: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeen: string;
}

export interface ManualNetworkConfig {
  ip: string;
  subnet: string;
  gateway: string;
  dns: string;
}

export interface HotspotConfig {
  enabled: boolean;
  ssid: string;
  password?: string;
  encryption: 'WPA2' | 'WPA3' | 'OPEN';
}

export interface CustomEffect {
  id: string;
  name: string;
  color: string;
  speed: number;
  particleDensity: number;
  distortion: number;
  glow: number;
}

export interface AppSettings {
  theme: 'CYAN_FLUX' | 'PURPLE_MESH' | 'VOID_GOLD' | 'DYNAMIC';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  esp32Url: string;
  brightness: number;
  hardware: HardwareConfig;
  customEffects?: CustomEffect[];
  networkConfig?: ManualNetworkConfig;
  hotspot?: HotspotConfig;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}
