/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { SensorData, SystemStatus } from '../types';

export const useAetherSensors = () => {
  const [sensors, setSensors] = useState<SensorData[]>([
    { id: '1', name: 'CORE TEMP', value: 42, unit: '°C', timestamp: new Date().toISOString(), color: '#06b6d4' },
    { id: '2', name: 'NEURAL FLUX', value: 88, unit: 'Hz', timestamp: new Date().toISOString(), color: '#ec4899' },
    { id: '3', name: 'LINK BAND', value: 1.2, unit: 'Gbps', timestamp: new Date().toISOString(), color: '#eab308' },
  ]);

  const [status, setStatus] = useState<SystemStatus>({
    cpu: 24,
    memory: 62,
    battery: 98,
    network: 'ONLINE',
    uptime: '12:44:02',
    wsStatus: 'DISCONNECTED',
  });

  const connectToESP32 = (url: string) => {
    setStatus(prev => ({ ...prev, wsStatus: 'CONNECTING' }));
    
    // Simulate WebSocket connection for preview environment
    setTimeout(() => {
      setStatus(prev => ({ ...prev, wsStatus: 'CONNECTED' }));
      console.log(`Connected to ESP32 at ${url}`);
    }, 2000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSensors((prev) =>
        prev.map((s) => ({
          ...s,
          value: s.value + (Math.random() - 0.5) * 2,
          timestamp: new Date().toISOString(),
        }))
      );

      setStatus((prev) => ({
        ...prev,
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 5)),
        memory: Math.max(50, Math.min(80, prev.memory + (Math.random() - 0.5) * 2)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { sensors, status, connectToESP32 };
};
