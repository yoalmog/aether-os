/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';

const STANDARD_EFFECTS_MAP: Record<string, {
  color: string;
  speed: number;
  particleDensity: number;
  distortion: number;
  glow: number;
}> = {
  'LOGO': { color: '#06b6d4', speed: 1.0, particleDensity: 150, distortion: 0.4, glow: 2.0 },
  'GIF': { color: '#ec4899', speed: 1.5, particleDensity: 100, distortion: 0.8, glow: 3.5 },
  'TEXT': { color: '#eab308', speed: 0.8, particleDensity: 120, distortion: 0.2, glow: 1.5 },
  'MATRIX': { color: '#10b981', speed: 2.0, particleDensity: 300, distortion: 0.1, glow: 4.0 },
  'SPECTRUM': { color: '#8b5cf6', speed: 1.8, particleDensity: 250, distortion: 1.0, glow: 5.0 },
  'TUNNEL': { color: '#3b82f6', speed: 2.5, particleDensity: 400, distortion: 0.5, glow: 3.0 },
  'SPIN': { color: '#f43f5e', speed: 3.5, particleDensity: 220, distortion: 0.9, glow: 6.0 },
  'AURORA': { color: '#f59e0b', speed: 1.2, particleDensity: 350, distortion: 1.2, glow: 2.5 },
  'CUBE': { color: '#6366f1', speed: 0.5, particleDensity: 80, distortion: 0.0, glow: 1.0 },
  'FIRE': { color: '#f43f5e', speed: 2.2, particleDensity: 280, distortion: 1.5, glow: 7.0 },
};

export const HolographicCore: React.FC = () => {
  const [hovered, setHovered] = useState(false);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const sphereRef = useRef<THREE.Mesh>(null);

  const hoverProgressRef = useRef(0);
  const pulseRef = useRef(0);

  const currentEffect = useAppStore(state => state.currentEffect);
  const settings = useAppStore(state => state.settings);
  const addLog = useAppStore(state => state.addLog);
  const logoPoints = useAppStore(state => state.logoPoints);

  // Determine current active config parameters
  const config = useMemo(() => {
    const custom = settings.customEffects?.find(e => e.id === currentEffect);
    if (custom) {
      return {
        color: custom.color,
        speed: custom.speed,
        particleDensity: custom.particleDensity,
        distortion: custom.distortion,
        glow: custom.glow
      };
    }
    const standard = STANDARD_EFFECTS_MAP[currentEffect];
    if (standard) return standard;
    
    return { color: '#06b6d4', speed: 1.0, particleDensity: 150, distortion: 0.4, glow: 2.0 };
  }, [currentEffect, settings.customEffects]);

  // Generate dynamic particles array based on selected preset color + density
  const [positions, colors] = useMemo(() => {
    if (currentEffect === 'LOGO' && logoPoints && logoPoints.length > 0) {
      const count = logoPoints.length;
      const pos = new Float32Array(count * 3);
      const cols = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const p = logoPoints[i];
        pos[i * 3] = p.x;
        pos[i * 3 + 1] = p.y;
        pos[i * 3 + 2] = p.z;

        const col = new THREE.Color(p.color);
        cols[i * 3] = col.r;
        cols[i * 3 + 1] = col.g;
        cols[i * 3 + 2] = col.b;
      }
      return [pos, cols];
    }

    const count = Math.min(Math.max(config.particleDensity, 10), 1000);
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    
    const coreColor = new THREE.Color(config.color);
    // contrast alternative tone for secondary blending
    const altColor = new THREE.Color(config.color === '#06b6d4' ? '#ec4899' : '#01f9ff');

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 0.8 + Math.random() * 1.8;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const mixRatio = Math.random();
      const blendedColor = new THREE.Color().lerpColors(coreColor, altColor, mixRatio * 0.4);
      cols[i * 3] = blendedColor.r;
      cols[i * 3 + 1] = blendedColor.g;
      cols[i * 3 + 2] = blendedColor.b;
    }
    return [pos, cols];
  }, [config.color, config.particleDensity, currentEffect, logoPoints]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Smooth responsive interpolation & decay physics
    hoverProgressRef.current += ((hovered ? 1 : 0) - hoverProgressRef.current) * 0.1;
    if (pulseRef.current > 0) {
      pulseRef.current *= 0.92;
      if (pulseRef.current < 0.01) pulseRef.current = 0;
    }

    const speedCorrection = config.speed * (1.0 + hoverProgressRef.current * 0.8 + pulseRef.current * 1.8);

    // Rotate Rings
    if (sphereRef.current) {
      const scaleBase = 1.0 + pulseRef.current * 0.4;
      sphereRef.current.scale.set(scaleBase, scaleBase, scaleBase);
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.5 * speedCorrection;
      ring1Ref.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.8 * speedCorrection;
      ring2Ref.current.rotation.y = Math.cos(t * 0.4) * 0.2;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = t * 1.2 * speedCorrection;
      ring3Ref.current.rotation.x = Math.sin(t * 0.5) * (0.5 + hoverProgressRef.current * 0.5);
    }

    // Animate and shift particle systems dynamically
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.3 * speedCorrection;
      particlesRef.current.rotation.x = t * 0.1 * speedCorrection;
      
      // Deflect the particles towards/away from pointer
      const pX = state.pointer.x * (hovered ? 1.5 : 0.15);
      const pY = state.pointer.y * (hovered ? 1.5 : 0.15);
      particlesRef.current.position.x += (pX - particlesRef.current.position.x) * 0.08;
      particlesRef.current.position.y += (pY - particlesRef.current.position.y) * 0.08;
      
      // Soft breathing effect
      const scale = 1.0 + Math.sin(t * (3.5 + hoverProgressRef.current * 3)) * (0.06 + hoverProgressRef.current * 0.15 + pulseRef.current * 0.3);
      particlesRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      {/* Central Pulsing Core */}
      <Float speed={hovered ? 6 : 2} rotationIntensity={hovered ? 3.0 : 1.2} floatIntensity={hovered ? 3.5 : 2}>
        <Sphere 
          ref={sphereRef}
          args={[0.6, 64, 64]}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
          }}
          onClick={(e) => {
            e.stopPropagation();
            pulseRef.current = 2.5; 
            const timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
            addLog(`[${timestamp}] CORE_TOUCH_PULSE: Direct tactile synaptic ripple at 2.5X on preset [${currentEffect}]`);
          }}
        >
          <MeshDistortMaterial
            color={hovered ? "#ffffff" : config.color}
            speed={config.speed * (hovered ? 4.5 : 2)}
            distort={config.distortion + (hovered ? 0.35 : 0) + (pulseRef.current * 0.15)}
            radius={1}
            emissive={config.color}
            emissiveIntensity={config.glow * (hovered ? 4.5 : 1) + (pulseRef.current * 10)}
            transparent
            opacity={0.6 + (hovered ? 0.25 : 0)}
          />
        </Sphere>
      </Float>

      {/* Dynamic Glowing Energy Particles */}
      <points ref={particlesRef} key={`${currentEffect}_${config.particleDensity}_${logoPoints?.length || 0}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={hovered ? 0.075 : 0.038}
          sizeAttenuation
          vertexColors
          transparent
          opacity={hovered ? 0.95 : 0.55}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Orbiting Rings inheriting color */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.5, 0.02, 16, 100]} />
        <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={config.glow * (hovered ? 6 : 2)} transparent opacity={hovered ? 0.75 : 0.35} />
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.8, 0.015, 16, 100]} />
        <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={config.glow * (hovered ? 4.5 : 1.5)} transparent opacity={hovered ? 0.65 : 0.25} />
      </mesh>

      <mesh ref={ring3Ref} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[2.2, 0.01, 16, 100]} />
        <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={config.glow * (hovered ? 3 : 1)} transparent opacity={hovered ? 0.5 : 0.15} />
      </mesh>

      {/* Grid Floor Effect (Atmospheric) */}
      <gridHelper args={[10, 20, config.color, '#020408']} position={[0, -3, 0]} />
    </group>
  );
};
