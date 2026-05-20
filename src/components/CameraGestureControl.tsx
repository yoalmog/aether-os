import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface CameraGestureControlProps {
  onGestureLeft: () => void;
  onGestureRight: () => void;
}

export const CameraGestureControl: React.FC<CameraGestureControlProps> = ({ onGestureLeft, onGestureRight }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const lastGestureRef = useRef<number>(0);
  const animationRef = useRef<number>(0);
  
  const [error, setError] = useState<string | null>(null);
  const addLog = useAppStore(state => state.addLog);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActive = true;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } });
        if (videoRef.current && isActive) {
          videoRef.current.srcObject = stream;
        }
        addLog('OPTICAL_SENSOR: Active - beginning kinetic tracking');
      } catch (err: any) {
        setError('Camera permission denied or unavailable');
        addLog('OPTICAL_SENSOR_ERR: ' + err.message);
      }
    };

    startCamera();

    return () => {
      isActive = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [addLog]);

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;

    let motionX = 0;
    let validPixels = 0;

    if (prevFrameRef.current) {
      const prev = prevFrameRef.current;
      // Simple threshold frame diffing
      for (let i = 0; i < pixels.length; i += 16) { // skip some pixels for speed
        const diffR = Math.abs(pixels[i] - prev[i]);
        const diffG = Math.abs(pixels[i+1] - prev[i+1]);
        const diffB = Math.abs(pixels[i+2] - prev[i+2]);
        if (diffR + diffG + diffB > 120) {
           const x = (i / 4) % canvas.width;
           motionX += x;
           validPixels++;
        }
      }

      if (validPixels > 50) {
        const avgX = motionX / validPixels;
        const now = Date.now();
        // Avoid double triggering
        if (now - lastGestureRef.current > 800) {
           if (avgX < canvas.width * 0.3) {
             // Motion on the right side of the screen (webcam is mirrored usually, but let's just use raw coords)
             onGestureRight();
             addLog('KINETIC_TRACKING: Swipe [RIGHT] detected');
             lastGestureRef.current = now;
           } else if (avgX > canvas.width * 0.7) {
             onGestureLeft();
             addLog('KINETIC_TRACKING: Swipe [LEFT] detected');
             lastGestureRef.current = now;
           }
        }
      }
    }

    prevFrameRef.current = new Uint8ClampedArray(pixels);
    animationRef.current = requestAnimationFrame(processFrame);
  };

  return (
    <div className="absolute top-4 left-4 z-40">
      <div className="p-2 bg-black/50 border border-white/10 rounded-xl backdrop-blur-md flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400">
          <Camera size={12} className="animate-pulse" />
          <span>OPTICAL_SENSOR</span>
        </div>
        
        {error ? (
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2 text-[8px] font-mono text-red-400 max-w-[120px] text-center">
            <AlertTriangle size={12} />
            {error}
          </div>
        ) : (
          <div className="relative w-24 h-16 rounded overflow-hidden border border-white/5 bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover opacity-30 transform scale-x-[-1]"
              onPlay={() => {
                 animationRef.current = requestAnimationFrame(processFrame);
              }}
            />
            {/* Overlay grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
            <canvas ref={canvasRef} width={320} height={240} className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
};
