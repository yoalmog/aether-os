/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store/useAppStore';

export const useESP32Manager = () => {
  const { status, settings, updateStatus, addLog, updateSensors, currentEffect } = useAppStore(useShallow((state) => ({
    status: state.status,
    settings: state.settings,
    updateStatus: state.updateStatus,
    addLog: state.addLog,
    updateSensors: state.updateSensors,
    currentEffect: state.currentEffect
  })));

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback((url?: string) => {
    const targetUrl = url || settings.esp32Url || 'ws://192.168.4.1:81';
    
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
       addLog('WS: Already connecting or connected');
       return;
    }

    updateStatus({ wsStatus: 'CONNECTING' });
    addLog(`WS_INIT: Attempting uplink to ${targetUrl}`);

    if (targetUrl === 'mock://esp32') {
      // Simulate connection
      setTimeout(() => {
        updateStatus({ wsStatus: 'CONNECTED' });
        addLog(`WS_ESTABLISHED: Simulated hardware link stable`);
        
        // Mock Telemetry Loop
        const mockInterval = setInterval(() => {
          if (status.wsStatus === 'DISCONNECTED') {
            clearInterval(mockInterval);
            return;
          }
          const telemetry = {
            rpm: 1450 + Math.random() * 50 - 25,
            temperature: 42 + Math.random() * 5,
            fps: 60,
            wifi: -55 + Math.random() * 10,
            effect: currentEffect
          };
          updateStatus({
            telemetry: {
              rpm: telemetry.rpm,
              temp: telemetry.temperature,
              fps: telemetry.fps,
              wifi: telemetry.wifi,
              effect: telemetry.effect,
              brightness: settings.brightness,
            }
          });
          updateSensors([
            { id: '1', name: 'CORE_TEMP', value: telemetry.temperature, unit: '°C', timestamp: new Date().toISOString(), color: '#06b6d4' },
            { id: '2', name: 'POV_RPM', value: Math.round(telemetry.rpm), unit: 'RPM', timestamp: new Date().toISOString(), color: '#ec4899' },
            { id: '3', name: 'WIFI_SIG', value: Math.round(telemetry.wifi), unit: 'dBm', timestamp: new Date().toISOString(), color: '#eab308' },
          ]);
        }, 1000);

        // Dummy ws ref for mock
        wsRef.current = {
          readyState: WebSocket.OPEN,
          send: (data: string) => { addLog(`MOCK_TX: ${data}`); },
          close: () => { 
            clearInterval(mockInterval);
            updateStatus({ wsStatus: 'DISCONNECTED' });
            addLog(`WS_DROPPED: Simulated connection closed.`);
            wsRef.current = null;
          }
        } as unknown as WebSocket;

      }, 1000);
      return;
    }

    try {
      const ws = new WebSocket(targetUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        updateStatus({ wsStatus: 'CONNECTED' });
        addLog(`WS_ESTABLISHED: Hardware link stable to ${targetUrl}`);
        
        // Sync current state to hardware
        ws.send(JSON.stringify({ cmd: 'effect', name: currentEffect }));
        ws.send(JSON.stringify({ cmd: 'brightness', value: settings.brightness }));
      };

      ws.onmessage = (event) => {
        try {
          const telemetry = JSON.parse(event.data);
          
          if (telemetry.rpm !== undefined) {
             updateStatus({
                telemetry: {
                  rpm: telemetry.rpm,
                  temp: telemetry.temperature || 0,
                  fps: telemetry.fps || 0,
                  wifi: telemetry.wifi || 0,
                  effect: telemetry.effect || 'NONE',
                  brightness: settings.brightness,
                }
             });

             updateSensors([
               { id: '1', name: 'CORE_TEMP', value: telemetry.temperature || 0, unit: '°C', timestamp: new Date().toISOString(), color: '#06b6d4' },
               { id: '2', name: 'POV_RPM', value: telemetry.rpm, unit: 'RPM', timestamp: new Date().toISOString(), color: '#ec4899' },
               { id: '3', name: 'WIFI_SIG', value: telemetry.wifi || 0, unit: 'dBm', timestamp: new Date().toISOString(), color: '#eab308' },
             ]);
          }
        } catch (e) {
          // not json, maybe plain text debug log
          console.log('WS msg:', event.data);
        }
      };

      ws.onclose = () => {
        updateStatus({ wsStatus: 'DISCONNECTED' });
        addLog(`WS_DROPPED: Connection to ${targetUrl} closed.`);
        
        // Auto reconnect logic
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = setTimeout(() => {
           if (status.wsStatus !== 'CONNECTING') {
              connect(targetUrl);
           }
        }, 5000);
      };

      ws.onerror = (error) => {
        addLog(`WS_ERROR: Socket failure. Is ESP32 online?`);
        ws.close();
      };
    } catch(e) {
      addLog(`WS_EXCEPTION: Failed to instantiate socket.`);
      updateStatus({ wsStatus: 'DISCONNECTED' });
    }
  }, [settings.esp32Url, settings.brightness, currentEffect, addLog, updateStatus, updateSensors, status.wsStatus]);

  const sendCommand = useCallback((cmdObj: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmdObj));
      addLog(`WS_TX: ${JSON.stringify(cmdObj)}`);
    } else {
      addLog(`WS_FAIL: Cannot send ${cmdObj.cmd}, socket disconnected.`);
    }
  }, [addLog]);

  useEffect(() => {
    const handleGlobalCmd = (e: Event) => {
      const customEvent = e as CustomEvent;
      sendCommand(customEvent.detail);
    };
    window.addEventListener('esp32_cmd', handleGlobalCmd);
    return () => window.removeEventListener('esp32_cmd', handleGlobalCmd);
  }, [sendCommand]);

  // Effect sync
  useEffect(() => {
     sendCommand({ cmd: 'effect', name: currentEffect });
  }, [currentEffect, sendCommand]);

  // Brightness sync
  useEffect(() => {
     sendCommand({ cmd: 'brightness', value: settings.brightness });
  }, [settings.brightness, sendCommand]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, []);

  return { connect, sendCommand };
};
