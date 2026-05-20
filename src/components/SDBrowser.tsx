/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HardDrive, UploadCloud, RefreshCw, FileImage, FileCode, CheckCircle, Trash2 } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';

export const SDBrowser: React.FC = () => {
    const status = useAppStore(state => state.status);
    const addLog = useAppStore(state => state.addLog);
    const setEffect = useAppStore(state => state.setEffect);
    
    const [files, setFiles] = useState([
        { name: 'logo_google.bin', size: '128KB', type: 'bin', active: true },
        { name: 'hex_mesh.bin', size: '128KB', type: 'bin', active: false },
        { name: 'config.json', size: '2KB', type: 'config', active: false }
    ]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(-1);

    const refreshDrive = () => {
        setIsRefreshing(true);
        addLog("SD_CARD: Dispatching root directory tree fetch...");
        setTimeout(() => {
            setIsRefreshing(false);
            addLog("SD_CARD: File manifest synced. 3 files discovered.");
        }, 800);
    };

    const activateFile = (name: string) => {
        setFiles(files.map(f => ({ ...f, active: f.name === name })));
        addLog(`POV_ENGINE: Stream buffer set to SD file [${name}]`);
        setEffect('LOGO'); // trigger holo refresh
    };

    const deleteFile = (name: string) => {
        setFiles(files.filter(f => f.name !== name));
        addLog(`SD_CARD: Unlinked and scrubbed sector for [${name}]`);
    };

    const handleUploadFirmware = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        addLog(`OTA_BRIDGE: Prepared multipart upload for [${file.name}]`);
        
        let p = 0;
        setUploadProgress(0);
        const interval = setInterval(() => {
            p += 15;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                addLog('OTA_BRIDGE: Firmware verified. ESP32 is restarting...');
                setTimeout(() => setUploadProgress(-1), 2000);
            }
            setUploadProgress(Math.min(100, p));
        }, 500);
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-28">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <HardDrive size={20} className="text-cyan-400" />
                    <h2 className="text-lg font-bold tracking-tighter">SD & OTA BRIDGE</h2>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                    <span className="text-[8px] font-mono text-white/50 uppercase tracking-widest">SPI_MOUNTED</span>
                </div>
            </div>

            <GlassCard className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                        SD Root Explorer (SPI_MISO)
                    </div>
                    <button onClick={refreshDrive} className="text-cyan-400 hover:text-cyan-300">
                        <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                    </button>
                </div>
                
                <div className="space-y-2">
                    {files.map(f => (
                        <div key={f.name} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${f.active ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                            <div className="flex items-center gap-3">
                                {f.type === 'bin' ? <FileImage size={14} className={f.active ? "text-cyan-400" : "text-white/40"} /> : <FileCode size={14} className="text-white/40" />}
                                <div>
                                    <div className={`text-xs font-mono font-bold ${f.active ? 'text-cyan-400' : 'text-white/80'}`}>{f.name}</div>
                                    <div className="text-[8px] font-mono text-white/40 mt-0.5">{f.size} • SECTOR_0x0A</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {f.active ? (
                                    <span className="text-[8px] font-mono bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded uppercase tracking-widest border border-cyan-500/40">In Buffer</span>
                                ) : (
                                    <>
                                        <button onClick={() => activateFile(f.name)} className="p-1.5 hover:bg-white/10 rounded border border-white/10 text-white/50 hover:text-cyan-400 transition-colors">
                                            <CheckCircle size={12} />
                                        </button>
                                        <button onClick={() => deleteFile(f.name)} className="p-1.5 hover:bg-white/10 rounded border border-white/10 text-white/50 hover:text-red-400 transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {files.length === 0 && (
                        <div className="p-6 text-center text-[10px] font-mono text-white/30 uppercase">SD Block Empty</div>
                    )}
                </div>
            </GlassCard>

            <GlassCard className="p-4 space-y-4">
                 <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
                    Over-The-Air (OTA) Flasher
                </div>

                <div className="relative border-2 border-dashed border-white/10 hover:border-cyan-500/40 bg-white/5 hover:bg-cyan-500/5 rounded-2xl p-6 transition-colors flex flex-col items-center justify-center text-center group cursor-pointer overflow-hidden">
                    <input type="file" onChange={handleUploadFirmware} accept=".bin" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    
                    {uploadProgress >= 0 ? (
                        <div className="w-full space-y-2 z-0 relative">
                            <div className="flex justify-between text-[10px] font-mono font-bold text-emerald-400 uppercase">
                                <span>FLASHING_ROM</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-emerald-500/20">
                                <motion.div animate={{ width: `${uploadProgress}%` }} className="h-full bg-emerald-500" />
                            </div>
                            {uploadProgress === 100 && (
                                <div className="text-[8px] font-mono text-white/40 pt-2 animate-pulse uppercase">Device Resetting...</div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-2 z-0 relative pointer-events-none">
                            <UploadCloud size={24} className="text-white/40 group-hover:text-cyan-400 transition-colors" />
                            <div className="text-xs font-bold uppercase tracking-wide">Upload Firmware.bin</div>
                            <div className="text-[8px] font-mono text-white/30">Select compiled ESP32 firmware binary</div>
                        </div>
                    )}
                </div>
            </GlassCard>
        </motion.div>
    );
};
