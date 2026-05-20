/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Download, RefreshCw, Play, Pause, Cpu, 
  Check, Copy, FileImage, Sparkles, Image, ShieldAlert, Wifi 
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

interface PolarPixel {
  r: number;
  g: number;
  b: number;
  hex: string;
}

export const LogoConverter: React.FC = () => {
  const settings = useAppStore(state => state.settings);
  const updateHardware = useAppStore(state => state.updateHardware);
  const addLog = useAppStore(state => state.addLog);
  const setLogoPoints = useAppStore(state => state.setLogoPoints);
  const setEffect = useAppStore(state => state.setEffect);
  const setCompiledLogoHeaders = useAppStore(state => state.setCompiledLogoHeaders);

  // States
  const [selectedTemplate, setSelectedTemplate] = useState<string>('GOOGLE');
  const [stripesCount, setStripesCount] = useState<number>(settings.hardware.stripesCount || 3);
  const ledsCount = stripesCount * 45;
  const [sectorsCount, setSectorsCount] = useState<number>(90);
  const [samplingMethod, setSamplingMethod] = useState<'nearest' | 'bilinear'>('nearest');
  const [contrast, setContrast] = useState<number>(1.0);
  const [brightness, setBrightness] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1.5);
  const [codeFormat, setCodeFormat] = useState<'rgb888' | 'rgb565' | 'monochrome'>('rgb888');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  
  // Simulated WS Flashing state
  const [transmissionState, setTransmissionState] = useState<'idle' | 'transmitting' | 'done'>('idle');
  const [transmissionProgress, setTransmissionProgress] = useState<number>(0);

  // File Reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Canvases
  const cartesianCanvasRef = useRef<HTMLCanvasElement>(null);
  const polarPreviewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Polar data matrix [sector][led]
  const [polarGrid, setPolarGrid] = useState<PolarPixel[][]>([]);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  // Fallback template descriptors
  const TEMPLATES = [
    { id: 'GOOGLE', label: 'Google G Logo', desc: 'Concentric multi-segment brand' },
    { id: 'HEXAGON', label: 'Cyber Hexagon', desc: 'Futuristic vector crosshair' },
    { id: 'STAR', label: 'Radical Star', desc: '5-pointed glowing emblem' },
    { id: 'BIOHAZARD', label: 'Biohazard Warning', desc: 'High-contrast radial sign' }
  ];

  // Draw template onto source canvas
  const drawTemplate = (type: string, ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    
    // Background fills (pure black for transparency)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(cx, cy) * 0.85;

    ctx.translate(cx, cy);

    if (type === 'GOOGLE') {
      // Draw Google G Logo with paths
      ctx.lineWidth = maxR * 0.28;
      ctx.lineCap = 'butt';

      // Red sweep (top piece)
      ctx.strokeStyle = '#ea4335';
      ctx.beginPath();
      ctx.arc(0, 0, maxR - ctx.lineWidth/2, -Math.PI * 0.75, -Math.PI * 0.2);
      ctx.stroke();

      // Yellow sweep (bottom-left piece)
      ctx.strokeStyle = '#fbbc05';
      ctx.beginPath();
      ctx.arc(0, 0, maxR - ctx.lineWidth/2, -Math.PI * 1.25, -Math.PI * 0.75);
      ctx.stroke();

      // Green sweep (bottom piece)
      ctx.strokeStyle = '#34a853';
      ctx.beginPath();
      ctx.arc(0, 0, maxR - ctx.lineWidth/2, -Math.PI * 1.75, -Math.PI * 1.25);
      ctx.stroke();

      // Blue sweep (right piece and bar)
      ctx.strokeStyle = '#4285f4';
      ctx.beginPath();
      ctx.arc(0, 0, maxR - ctx.lineWidth/2, -Math.PI * 0.2, 0.4);
      ctx.stroke();

      // G Bar
      ctx.fillStyle = '#4285f4';
      ctx.fillRect(0, -ctx.lineWidth / 2, maxR, ctx.lineWidth);
    } 
    else if (type === 'HEXAGON') {
      // Draw standard double nested neon hexagons
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = Math.cos(angle) * maxR;
        const y = Math.sin(angle) * maxR;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Nested pink hexagon
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + Math.PI / 6;
        const x = Math.cos(angle) * (maxR * 0.6);
        const y = Math.sin(angle) * (maxR * 0.6);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Crosshairs
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-maxR * 1.1, 0);
      ctx.lineTo(maxR * 1.1, 0);
      ctx.moveTo(0, -maxR * 1.1);
      ctx.lineTo(0, maxR * 1.1);
      ctx.stroke();

      // Center ring
      ctx.fillStyle = '#00f2ff';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    } 
    else if (type === 'STAR') {
      // Draws a glowing sci-fi star shape
      ctx.fillStyle = '#eab308';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      
      const spikes = 5;
      const outerRadius = maxR;
      const innerRadius = maxR * 0.4;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      for (let i = 0; i < spikes; i++) {
        let x = Math.cos(rot) * outerRadius;
        let y = Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = Math.cos(rot) * innerRadius;
        y = Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      
      ctx.closePath();
      ctx.fill();
    } 
    else if (type === 'BIOHAZARD') {
      // Classic neon orange biohazard sign
      ctx.strokeStyle = '#f97316';
      ctx.fillStyle = '#f97316';
      ctx.lineWidth = 5;

      const offset = maxR * 0.28;
      const circleRad = maxR * 0.42;

      // Draw the three core lobes
      const lobeCoords = [
        { x: 0, y: -offset },
        { x: offset * Math.cos(Math.PI / 6), y: offset * Math.sin(Math.PI / 6) },
        { x: -offset * Math.cos(Math.PI / 6), y: offset * Math.sin(Math.PI / 6) }
      ];

      lobeCoords.forEach(coord => {
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, circleRad, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Internal voids
      ctx.fillStyle = '#000000';
      lobeCoords.forEach(coord => {
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, circleRad * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });

      // Central core ring
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, 0, circleRad * 0.9, 0, Math.PI * 2);
      ctx.stroke();

      // Sharp central details (cutouts)
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, -maxR);
      ctx.moveTo(0, 0); ctx.lineTo(maxR * Math.cos(Math.PI/6), maxR * Math.sin(Math.PI/6));
      ctx.moveTo(0, 0); ctx.lineTo(-maxR * Math.cos(Math.PI/6), maxR * Math.sin(Math.PI/6));
      ctx.stroke();

      // Center ring circle
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(0, 0, circleRad * 0.35, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, circleRad * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // Run the Cartesian to Polar pixel sampler conversion
  const performPolarRemap = () => {
    const sourceCanvas = cartesianCanvasRef.current;
    if (!sourceCanvas) return;
    
    const ctx = sourceCanvas.getContext('2d');
    if (!ctx) return;

    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    
    // Extract pixel buffer
    const imgData = ctx.getImageData(0, 0, w, h);
    const pixels = imgData.data;

    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(cx, cy);

    const tempGrid: PolarPixel[][] = [];
    const vectorDataPointsForStore: { x: number; y: number; z: number; color: string }[] = [];

    // Loop through each angular sector (angle theta)
    for (let s = 0; s < sectorsCount; s++) {
      const theta = (s / sectorsCount) * Math.PI * 2;
      const sectorRow: PolarPixel[] = [];

      // Loop through each radial step (LED from core to tip)
      for (let l = 0; l < ledsCount; l++) {
        const radiusFraction = l / ledsCount;
        const radius = radiusFraction * maxR;

        // Map polar to Cartesian coordinates
        const x = cx + radius * Math.cos(theta);
        const y = cy - radius * Math.sin(theta); // Flip Y to match standard cartesian

        let red = 0, green = 0, blue = 0, alpha = 0;

        if (samplingMethod === 'nearest') {
          // Nearest Neighbor clamp
          const px = Math.min(Math.max(Math.round(x), 0), w - 1);
          const py = Math.min(Math.max(Math.round(y), 0), h - 1);
          const idx = (py * w + px) * 4;
          
          red = pixels[idx];
          green = pixels[idx + 1];
          blue = pixels[idx + 2];
          alpha = pixels[idx + 3];
        } else {
          // Bilinear Interpolation
          const x0 = Math.floor(x);
          const x1 = Math.min(x0 + 1, w - 1);
          const y0 = Math.floor(y);
          const y1 = Math.min(y0 + 1, h - 1);

          const dx = x - x0;
          const dy = y - y0;

          const idx00 = (y0 * w + x0) * 4;
          const idx10 = (y0 * w + x1) * 4;
          const idx01 = (y1 * w + x0) * 4;
          const idx11 = (y1 * w + x1) * 4;

          // Interpolate red
          const r0 = pixels[idx00] * (1 - dx) + pixels[idx10] * dx;
          const r1 = pixels[idx01] * (1 - dx) + pixels[idx11] * dx;
          red = r0 * (1 - dy) + r1 * dy;

          // Interpolate green
          const g0 = pixels[idx00 + 1] * (1 - dx) + pixels[idx10 + 1] * dx;
          const g1 = pixels[idx01 + 1] * (1 - dx) + pixels[idx11 + 1] * dx;
          green = g0 * (1 - dy) + g1 * dy;

          // Interpolate blue
          const b0 = pixels[idx00 + 2] * (1 - dx) + pixels[idx10 + 2] * dx;
          const b1 = pixels[idx01 + 2] * (1 - dx) + pixels[idx11 + 2] * dx;
          blue = b0 * (1 - dy) + b1 * dy;

          // Interpolate alpha
          const a0 = pixels[idx00 + 3] * (1 - dx) + pixels[idx10 + 3] * dx;
          const a1 = pixels[idx01 + 3] * (1 - dx) + pixels[idx11 + 3] * dx;
          alpha = a0 * (1 - dx) + a1 * dx; // basic fallback
        }

        // Apply contrast & brightness processing
        let r_t = (red / 255.0 - 0.5) * contrast + 0.5 + (brightness - 1.0);
        let g_t = (green / 255.0 - 0.5) * contrast + 0.5 + (brightness - 1.0);
        let b_t = (blue / 255.0 - 0.5) * contrast + 0.5 + (brightness - 1.0);

        red = Math.min(Math.max(Math.round(r_t * 255), 0), 255);
        green = Math.min(Math.max(Math.round(g_t * 255), 0), 255);
        blue = Math.min(Math.max(Math.round(b_t * 255), 0), 255);

        // Standard LED fan black levels for non-active/transparent pixels
        if (alpha < 45 || (red === 0 && green === 0 && blue === 0)) {
          red = 0;
          green = 0;
          blue = 0;
        }

        const toHexByte = (val: number) => {
          const s = val.toString(16);
          return s.length === 1 ? '0' + s : s;
        };
        const hex = `#${toHexByte(red)}${toHexByte(green)}${toHexByte(blue)}`;

        sectorRow.push({ r: red, g: green, b: blue, hex });

        // Add to 3D Points if active pixel
        if (red > 0 || green > 0 || blue > 0) {
          // Normalize radius to bounds [-2.5, 2.5]
          const normRadius = radiusFraction * 2.3;
          vectorDataPointsForStore.push({
            x: normRadius * Math.cos(theta),
            y: normRadius * Math.sin(theta),
            z: (Math.random() - 0.5) * 0.1, // subtle scatter for sci-fi volume depth
            color: hex
          });
        }
      }
      tempGrid.push(sectorRow);
    }

    setPolarGrid(tempGrid);
    
    // Sync to state to allow 3D particles visualizer to intercept
    setLogoPoints(vectorDataPointsForStore);
  };

  // Draw templates or trigger conversion cycle when parameters change
  useEffect(() => {
    const canvas = cartesianCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (selectedTemplate === 'UPLOADED' && originalImage) {
      // Draw custom uploaded image centered with aspect fitting
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const ratio = Math.min(canvas.width / originalImage.width, canvas.height / originalImage.height) * 0.85;
      const nw = originalImage.width * ratio;
      const nh = originalImage.height * ratio;
      const x = (canvas.width - nw) / 2;
      const y = (canvas.height - nh) / 2;

      ctx.save();
      ctx.drawImage(originalImage, x, y, nw, nh);
      ctx.restore();
      performPolarRemap();
    } else if (selectedTemplate !== 'UPLOADED') {
      drawTemplate(selectedTemplate, ctx, canvas.width, canvas.height);
      performPolarRemap();
    }
  }, [selectedTemplate, ledsCount, sectorsCount, samplingMethod, contrast, brightness, originalImage, stripesCount]);

  // Polar simulation canvas loop (2D fan rot)
  useEffect(() => {
    const canvas = polarPreviewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let currentAngleOffset = 0;

    const render = () => {
      // To simulate persistence of vision phosphors, draw semi-transparent black overlay
      ctx.fillStyle = 'rgba(2, 4, 8, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxR = Math.min(cx, cy) * 0.9;

      if (polarGrid.length > 0) {
        // Render physical spinning LED arms
        const armCount = settings.hardware.armsCount || 2;
        const angleStep = (Math.PI * 2) / armCount;

        for (let a = 0; a < armCount; a++) {
          const thetaArm = currentAngleOffset + a * angleStep;
          
          // Get nearest polar column index matching current arm angle
          const normalizedAngle = ((thetaArm % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const colIdx = Math.floor((normalizedAngle / (Math.PI * 2)) * sectorsCount) % sectorsCount;
          
          const colData = polarGrid[colIdx];
          if (!colData) continue;

          // Draw the physical LEDs on this arm
          for (let l = 0; l < ledsCount; l++) {
            const fraction = l / ledsCount;
            const r = fraction * maxR;

            const xl = cx + r * Math.cos(thetaArm);
            const yl = cy - r * Math.sin(thetaArm);

            const pixel = colData[l];
            if (pixel && (pixel.r > 0 || pixel.g > 0 || pixel.b > 0)) {
              ctx.shadowColor = pixel.hex;
              ctx.shadowBlur = 10;
              ctx.fillStyle = pixel.hex;
              ctx.beginPath();
              ctx.arc(xl, yl, Math.max(maxR / ledsCount * 0.45, 1.2), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Draw HUD overlay ring showing rotation limits
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Waiting banner
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AWAITING_GEOMETRY_MATRIX...', cx, cy);
      }

      if (isRotating) {
        currentAngleOffset += 0.04 * rotationSpeed;
      }

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [polarGrid, isRotating, rotationSpeed, ledsCount, sectorsCount]);

  // Image Upload handler
  const handleImageFile = (file: File) => {
    if (!file) return;

    if (!file.type.match('image.*')) {
      addLog(`CONVERSION_ERROR: Rejected invalid MIME-type [${file.type}] file`);
      return;
    }

    addLog(`UPLOADING_LOGO: Captured binary stream [${file.name}], size: ${Math.round(file.size / 1024)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        setOriginalImage(img);
        setSelectedTemplate('UPLOADED');
        addLog(`UPLOADER_SUCCESS: Logo node size resolved [${img.width}x${img.height}]`);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Drag over drop events
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageFile(files[0]);
    }
  };

  const selectUploadFile = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageFile(files[0]);
    }
  };

  // Convert RGB888 to RGB565 (16-bit)
  const rgbTo565 = (r: number, g: number, b: number): number => {
    return ((Math.round(r * 31 / 255) & 0x1F) << 11) |
           ((Math.round(g * 63 / 255) & 0x3F) << 5) |
           (Math.round(b * 31 / 255) & 0x1F);
  };

  // Compile full C++ matrix code
  const generatedCode = useMemo(() => {
    if (polarGrid.length === 0) return '// Awaiting polar grid...';

    const cleanName = selectedTemplate === 'UPLOADED' ? 'CUSTOM_UPLOAD' : selectedTemplate;
    const arrayName = `HOLOSPIN_POV_${cleanName}`;
    
    let out = `/**\n * Aether OS - Polar Remapped POV Logo Vector Matrix\n * Parameters:\n * LEDS_PER_ARM: ${ledsCount}\n * SECTORS: ${sectorsCount}\n */\n\n`;
    
    if (codeFormat === 'rgb888') {
      out += `#define POV_SECTORS ${sectorsCount}\n`;
      out += `#define POV_LEDS_COUNT ${ledsCount}\n\n`;
      out += `const uint32_t ${arrayName}[POV_SECTORS][POV_LEDS_COUNT] PROGMEM = {\n`;
      for (let s = 0; s < sectorsCount; s++) {
        out += '  { ';
        out += polarGrid[s].map(p => `0x${p.hex.substring(1)}`).join(', ');
        out += ' }';
        if (s < sectorsCount - 1) out += ',\n';
        else out += '\n';
      }
      out += '};';
    } 
    else if (codeFormat === 'rgb565') {
      out += `#define POV_SECTORS ${sectorsCount}\n`;
      out += `#define POV_LEDS_COUNT ${ledsCount}\n\n`;
      out += `const uint16_t ${arrayName}[POV_SECTORS][POV_LEDS_COUNT] PROGMEM = {\n`;
      for (let s = 0; s < sectorsCount; s++) {
        out += '  { ';
        out += polarGrid[s].map(p => {
          const val = rgbTo565(p.r, p.g, p.b);
          return `0x${val.toString(16).toUpperCase().padStart(4, '0')}`;
        }).join(', ');
        out += ' }';
        if (s < sectorsCount - 1) out += ',\n';
        else out += '\n';
      }
      out += '};';
    } 
    else {
      // Monochrome Bitmap Packing
      out += `#define POV_SECTORS ${sectorsCount}\n`;
      out += `#define POV_LEDS_PADDING ${Math.ceil(ledsCount / 8) * 8}\n\n`;
      out += `const uint8_t ${arrayName}[POV_SECTORS][${Math.ceil(ledsCount / 8)}] PROGMEM = {\n`;
      for (let s = 0; s < sectorsCount; s++) {
        out += '  { ';
        const rowData = polarGrid[s];
        const bytes: string[] = [];
        for (let b = 0; b < ledsCount; b += 8) {
          let byteVal = 0;
          for (let bit = 0; bit < 8; bit++) {
            const ledIdx = b + bit;
            if (ledIdx < ledsCount) {
              const pixel = rowData[ledIdx];
              const isLit = pixel && (pixel.r > 20 || pixel.g > 20 || pixel.b > 20) ? 1 : 0;
              byteVal |= (isLit << (7 - bit));
            }
          }
          bytes.push(`0x${byteVal.toString(16).toUpperCase().padStart(2, '0')}`);
        }
        out += bytes.join(', ');
        out += ' }';
        if (s < sectorsCount - 1) out += ',\n';
        else out += '\n';
      }
      out += '};';
    }

    return out;
  }, [polarGrid, codeFormat, ledsCount, sectorsCount, selectedTemplate]);

  // Sync to global Development Center store
  useEffect(() => {
    setCompiledLogoHeaders(generatedCode);
  }, [generatedCode, setCompiledLogoHeaders]);

  // Copy matrix array copy snippet
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopySuccess(true);
    addLog(`COPY_CLIPBOARD: Copied source array block for [${selectedTemplate}]`);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Download .h file
  const handleDownloadHeader = () => {
    const cleanName = selectedTemplate === 'UPLOADED' ? 'custom_upload' : selectedTemplate.toLowerCase();
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pov_${cleanName}_logo.h`;
    a.click();
    URL.revokeObjectURL(url);
    addLog(`HEADER_DOWNLOAD: Extracted [pov_${cleanName}_logo.h] successfully`);
  };

  // Download binary format for SD Card
  const handleDownloadBin = () => {
    if (polarGrid.length === 0) return;
    const cleanName = selectedTemplate === 'UPLOADED' ? 'custom_upload' : selectedTemplate.toLowerCase();
    
    // Create Uint16Array of RGB565
    // length = sectorsCount * ledsCount
    const buffer = new Uint16Array(sectorsCount * ledsCount);
    let idx = 0;
    for (let s = 0; s < sectorsCount; s++) {
       for (let l = 0; l < ledsCount; l++) {
          const p = polarGrid[s][l];
          if (p) {
             // We need little-endian typically for Arduino reading directly into struct
             buffer[idx++] = rgbTo565(p.r, p.g, p.b);
          } else {
             buffer[idx++] = 0;
          }
       }
    }
    
    // Convert to Uint8Array for binary Blob
    const byteBuffer = new Uint8Array(buffer.buffer);
    const blob = new Blob([byteBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pov_${cleanName}.bin`;
    a.click();
    URL.revokeObjectURL(url);
    addLog(`BIN_DOWNLOAD: Extracted binary matrix [pov_${cleanName}.bin] for SD card`);
  };

  // ESP32 WebSocket simulated Flash
  const handleTransmitWSLogo = () => {
    if (transmissionState !== 'idle') return;

    setTransmissionState('transmitting');
    setTransmissionProgress(0);
    addLog(`[UPLINK] CONNECTED: Flashing logo variables to WebSocket client node at [${settings.esp32Url}]`);
    
    let offset = 0;
    const interval = setInterval(() => {
      offset += 10;
      if (offset >= 100) {
        clearInterval(interval);
        setTransmissionProgress(100);
        setTransmissionState('done');
        addLog(`[UPLINK] FLUSH_STABLE: Synchronized successfully [${sectorsCount}x${ledsCount}] byte streams.`);
        setEffect('LOGO'); // Auto kick to visualizer!
        
        setTimeout(() => {
          setTransmissionState('idle');
          setTransmissionProgress(0);
        }, 3000);
      } else {
        setTransmissionProgress(offset);
        addLog(`[UPLINK] TRANSMITTING: Packet sector block index [${Math.floor((offset/100) * sectorsCount)}/${sectorsCount}]`);
      }
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="space-y-6 pb-28"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-cyan-400 animate-pulse" />
          <h2 className="text-lg font-bold tracking-tighter">POV_LOGO_CONVERTER</h2>
        </div>
        <span className="text-[8px] font-mono border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
          Alpha_Remap_v2
        </span>
      </div>

      {/* Target config indicators */}
      <GlassCard className="p-3 bg-red-500/5 border-red-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-red-400" />
          <div className="text-[8.5px] font-mono text-red-300">
            AUTOSYNC: Hologram 3D Core follows active LOGO conversions.
          </div>
        </div>
        <div className="text-[7px] font-mono text-white/30 uppercase">Synced</div>
      </GlassCard>

      {/* Grid Zone standard setups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Template Selectors */}
        <GlassCard className="p-4 space-y-4">
          <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
            1. Select Shape Vector Source
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer",
                  selectedTemplate === t.id 
                    ? "bg-cyan-500/10 border-cyan-500/40 text-white" 
                    : "bg-white/5 border-white/5 hover:bg-white/10 text-white/60"
                )}
              >
                <div className="text-xs font-bold truncate">{t.label}</div>
                <div className="text-[8px] font-mono text-white/30 truncate mt-1">{t.desc}</div>
                
                {selectedTemplate === t.id && (
                  <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                )}
              </button>
            ))}
          </div>

          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={selectUploadFile}
            className={cn(
              "p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative",
              isDragging 
                ? "border-cyan-400 bg-cyan-400/10 text-cyan-300 scale-95" 
                : selectedTemplate === 'UPLOADED'
                  ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400"
                  : "border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 text-white/40"
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            {selectedTemplate === 'UPLOADED' ? (
              <>
                <FileImage size={24} className="text-emerald-400 animate-bounce" />
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-400">Custom Logo Synced</span>
                <span className="text-[7.5px] font-mono text-white/40">Click or drag new to overwrite</span>
              </>
            ) : (
              <>
                <Upload size={24} className="group-hover:translate-y-[-2px] transition-transform" />
                <span className="text-[10px] font-mono uppercase font-bold">Drag & Drop Logo Image</span>
                <span className="text-[7.5px] font-mono text-white/30">PNG / JPG / SVG transparent preferred</span>
              </>
            )}
          </div>
        </GlassCard>

        {/* Linear processing and Cartesian Source */}
        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
              Cartesian Matrix [256x256 Source]
            </span>
            <span className="text-[7.5px] font-mono text-cyan-400/60 uppercase">RAW_INPUT</span>
          </div>

          <div className="flex-1 flex items-center justify-center p-3">
            <div className="relative border border-white/10 p-1.5 rounded-2xl bg-black/50 overflow-hidden shadow-inner">
              <canvas 
                ref={cartesianCanvasRef} 
                width={200} 
                height={200}
                className="w-[160px] h-[160px] rounded-lg bg-black"
              />
              <div className="absolute top-3 left-3 bg-black/60 px-2 py-0.5 rounded border border-white/10 text-[6.5px] font-mono text-white/50">
                W: 200px / H: 200px
              </div>
            </div>
          </div>

          <div className="text-center text-[7.5px] font-mono text-white/30 truncate mt-1">
            Samples points mapped based on central pivot offset (100, 100)
          </div>
        </GlassCard>
      </div>

      {/* Polar remapping variables and simulation tuner */}
      <GlassCard className="p-4 space-y-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
            2. Polar Sampling & Filter Tuners
          </div>
          <span className="text-[7.5px] font-mono text-cyan-400/60">CONVERT_ENGINE_ONLINE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-mono">
          {/* LED Stripes Per Arm selection */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[8px] text-white/40">
              <span>LED STRIPES PER ARM</span>
              <span className="text-cyan-400 font-bold">{stripesCount} STRIPES ({ledsCount} LEDs)</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setStripesCount(num);
                    updateHardware({ ledCount: num * 45, stripesCount: num });
                    addLog(`HARDWARE_CONFIG: Configured ${num} stripes (${num * 45} LEDs total per arm)`);
                  }}
                  className={cn(
                    "py-2 rounded-lg border text-[9.5px] font-mono font-bold transition-all cursor-pointer",
                    stripesCount === num
                      ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                      : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {num}x
                </button>
              ))}
            </div>
          </div>

          {/* Connected POV Arms Layout selector */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[8px] text-white/40">
              <span>ACTIVE ARMS LAYOUT</span>
              <span className="text-pink-400 font-bold">{(settings.hardware.armsCount || 2)} ARMS</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[2, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    updateHardware({ armsCount: num });
                    addLog(`HARDWARE_CONFIG: Shifted active rotary arms layout to ${num} arms`);
                  }}
                  className={cn(
                    "py-1.5 rounded-lg border text-[9.5px] font-mono font-bold transition-all cursor-pointer",
                    (settings.hardware.armsCount || 2) === num
                      ? "bg-pink-500/20 border-pink-500/40 text-pink-400 font-semibold"
                      : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {num} Arms
                </button>
              ))}
            </div>
          </div>

          {/* Sectors Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[8px] text-white/40">
              <span>ANGULAR_SECTORS [360_ANGLES]</span>
              <span className="text-cyan-400 font-bold">{sectorsCount} STEPS</span>
            </div>
            <input 
              type="range" min="30" max="180" step="6" value={sectorsCount}
              onChange={(e) => setSectorsCount(parseInt(e.target.value))}
              className="w-full accent-cyan-400 bg-white/10 h-1.5 rounded-full cursor-pointer"
            />
          </div>

          {/* Interpolation Selection */}
          <div className="space-y-1.5">
            <div className="text-[8px] text-white/40">FILTER_ALGORITHM</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSamplingMethod('nearest')}
                className={cn(
                  "py-1.5 rounded-lg border text-[8.5px] uppercase font-bold tracking-wider",
                  samplingMethod === 'nearest' 
                    ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400" 
                    : "bg-white/5 border-white/5 text-white/40"
                )}
              >
                Nearest Neighbor
              </button>
              <button
                type="button"
                onClick={() => setSamplingMethod('bilinear')}
                className={cn(
                  "py-1.5 rounded-lg border text-[8.5px] uppercase font-bold tracking-wider",
                  samplingMethod === 'bilinear' 
                    ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400" 
                    : "bg-white/5 border-white/5 text-white/40"
                )}
              >
                Bilinear Interpolation
              </button>
            </div>
          </div>

          {/* Image enhancers */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] text-white/40">
                <span>Contrast</span>
                <span>{contrast.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.5" max="2.5" step="0.1" value={contrast}
                onChange={(e) => setContrast(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-white/10 h-1 rounded-full cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] text-white/40">
                <span>Brightness</span>
                <span>{brightness.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.5" max="2.0" step="0.1" value={brightness}
                onChange={(e) => setBrightness(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-white/10 h-1 rounded-full cursor-pointer"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Simulated Dynamic-Arm Spinning Hologram fan display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Spinner canvas */}
        <GlassCard className="col-span-2 p-4 flex flex-col justify-between relative group overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5">
              <RefreshCw className={cn("text-pink-500 h-3.5 w-3.5", isRotating && "animate-spin")} />
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                Polar Real-Time Simulation [{settings.hardware.armsCount || 2} Arms @ 1450 RPM]
              </span>
            </div>
            <div className="text-[7.5px] font-mono text-pink-400/60 uppercase">POV_TRAIL_ACTIVE</div>
          </div>

          <div className="flex-1 flex justify-center items-center py-6">
            <div className="relative flex items-center justify-center rounded-full bg-black/60 border border-white/10 p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
              <canvas 
                ref={polarPreviewCanvasRef} 
                width={256} 
                height={256}
                className="w-[220px] h-[220px] rounded-full bg-[#020408]"
              />
              
              {/* Radial speed lines */}
              <div className="absolute inset-0 border border-cyan-400/5 rounded-full pointer-events-none scale-90" />
              <div className="absolute inset-0 border border-cyan-400/5 rounded-full pointer-events-none scale-75" />
              <div className="absolute inset-0 border border-cyan-400/5 rounded-full pointer-events-none scale-50" />
            </div>
          </div>

          {/* Speed controls */}
          <div className="flex items-center justify-between border-t border-white/5 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRotating(!isRotating)}
                className={cn(
                  "p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer text-white/80 active:scale-95 transition-all"
                )}
                title={isRotating ? "Pause spin" : "Resume spin"}
              >
                {isRotating ? <Pause size={11} /> : <Play size={11} />}
              </button>
              <span className="text-[8.5px] font-mono text-white/40">SIM_MOTOR_TRIGGER</span>
            </div>

            <div className="flex items-center gap-2 w-[120px]">
              <span className="text-[8px] font-mono text-white/30">ROT_FREQ</span>
              <input 
                type="range" min="0.1" max="4.0" step="0.1" value={rotationSpeed}
                onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                className="w-full accent-pink-500 bg-white/10 h-0.5 rounded-full cursor-pointer"
              />
            </div>
          </div>
        </GlassCard>

        {/* Live ESP32 connection Flash control */}
        <GlassCard className="p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
              OTA Bridge Stream
            </div>
            
            <div className="space-y-1">
              <div className="text-[8px] font-mono text-white/40">TARGET_BRIDGE_IP</div>
              <div className="text-xs font-mono px-3 py-1.5 bg-black/40 border border-white/5 rounded-xl text-white/70 flex items-center justify-between">
                <span>{settings.esp32Url}</span>
                <Wifi size={10} className="text-emerald-400" />
              </div>
            </div>

            <p className="text-[9.5px] font-mono leading-relaxed text-white/40">
              Transmit the remapped matrix binary packets directly over FastLED's UDP port stream.
            </p>
          </div>

          <div className="space-y-2">
            {transmissionState === 'idle' ? (
              <button
                type="button"
                onClick={handleTransmitWSLogo}
                className="w-full py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 hover:border-cyan-500/60 text-cyan-400 font-mono text-[9px] uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Cpu size={14} />
                Sync_to_Hardware
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[8px] space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="uppercase text-center animate-pulse">
                    {transmissionState === 'transmitting' ? 'UPLINK_FLASHING...' : 'TRANSMIT_SUCCESS!'}
                  </span>
                  <span>{transmissionProgress}%</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-cyan-400 h-full rounded" 
                    style={{ width: `${transmissionProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Arduino array generation panel */}
      <GlassCard className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
            3. Compiled C++ Firmware Headers (.h Array)
          </div>
          
          <div className="flex gap-2">
            {[
              { id: 'rgb888', label: 'RGB888 Hex' },
              { id: 'rgb565', label: 'RGB565 16-Bit' },
              { id: 'monochrome', label: '1-Bit Monochrome' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCodeFormat(f.id as any)}
                className={cn(
                  "px-2 py-0.5 rounded text-[7.5px] font-mono font-bold uppercase cursor-pointer border",
                  codeFormat === f.id
                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                    : "bg-white/5 border-transparent text-white/30 hover:text-white/60"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            readOnly
            value={generatedCode}
            rows={8}
            className="w-full font-mono text-[9px] p-4 rounded-xl bg-black/60 border border-white/10 text-cyan-300 focus:outline-none focus:border-cyan-500/50 resize-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent select-text"
          />
          
          {/* Action corner */}
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 px-2.5 rounded-lg bg-black/70 hover:bg-black/90 border border-white/10 hover:border-white/20 text-white/50 hover:text-white text-[8px] font-mono flex items-center gap-1 transition-all"
            >
              {copySuccess ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
              {copySuccess ? 'COPIED' : 'COPY'}
            </button>
            
            <button
              type="button"
              onClick={handleDownloadHeader}
              className="p-1 px-2.5 rounded-lg bg-black/70 hover:bg-black/90 border border-white/10 hover:border-white/20 text-white/50 hover:text-white text-[8px] font-mono flex items-center gap-1 transition-all"
            >
              <Download size={10} />
              HEADER_.H
            </button>

            <button
              type="button"
              onClick={handleDownloadBin}
              className="p-1 px-2.5 rounded-lg bg-black/70 hover:bg-black/90 border border-white/10 hover:border-white/20 text-emerald-500 hover:text-emerald-400 text-[8px] font-mono flex items-center gap-1 transition-all font-bold"
            >
              <Download size={10} />
              SD_.BIN
            </button>
          </div>
        </div>

        <div className="text-[7.5px] font-mono text-white/30 leading-relaxed">
          PROTIP: Save this matrix into a separate header component called <code className="text-white/50 border border-white/5 px-1 py-0.2 bg-white/5 rounded">logo_data.h</code> inside your Arduino project folder. You can feed this into <code className="text-white/50 border border-white/5 px-1 py-0.2 bg-white/5 rounded">FastLED.show()</code> inside the rotational trigger interrupt callback.
        </div>
      </GlassCard>
    </motion.div>
  );
};
