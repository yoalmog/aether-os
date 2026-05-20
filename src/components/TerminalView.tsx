/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal as TerminalIcon, ShieldCheck, Send } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const SYSTEM_COMMANDS = [
  'HELP',
  'CONNECT',
  'DISCONNECT',
  'REBOOT',
  'GET_STATUS',
  'START_OTA',
  'PLAY_EFFECT',
  'SET_BRIGHTNESS',
  'CLEAR'
];

const SUGGESTIONS_MAP: Record<string, string[]> = {
  'PLAY_EFFECT': ['LOGO', 'MATRIX', 'SPECTRUM', 'TUNNEL', 'SPIN', 'AURORA', 'CUBE', 'FIRE'],
  'SET_BRIGHTNESS': ['64', '128', '192', '255'],
  'CONNECT': ['192.168.4.1', '192.168.1.100'],
  'START_OTA': ['firmware.bin', 'v2_firmware.bin'],
};

interface TerminalViewProps {
  logs: string[];
}

export const TerminalView: React.FC<TerminalViewProps> = ({ logs }) => {
  const [command, setCommand] = useState('');
  const sendCommand = useAppStore(state => state.sendCommand);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      sendCommand(command);
      setCommand('');
    }
  };

  const getSuggestions = () => {
    const trimmed = command.toUpperCase();
    if (!command.trim()) {
      return { type: 'commands', prefix: '', list: SYSTEM_COMMANDS.slice(0, 5) };
    }
    const parts = trimmed.split(/\s+/);
    
    if (parts.length === 1) {
      const p = parts[0];
      const list = SYSTEM_COMMANDS.filter(cmd => cmd.startsWith(p) && cmd !== p);
      if (list.length > 0) {
        return { type: 'commands', prefix: '', list };
      }
      if (SYSTEM_COMMANDS.includes(p) && SUGGESTIONS_MAP[p]) {
        return { type: 'arguments', prefix: p, list: SUGGESTIONS_MAP[p] };
      }
    } else {
      const baseCmd = parts[0];
      const argPrefix = parts.slice(1).join(' ');
      const possibleArgs = SUGGESTIONS_MAP[baseCmd];
      if (possibleArgs) {
        const list = possibleArgs.filter(arg => arg.startsWith(argPrefix) && arg !== argPrefix);
        if (list.length > 0) {
          return { type: 'arguments', prefix: baseCmd, list };
        }
      }
    }
    return { type: 'empty', prefix: '', list: [] };
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const currentVal = command.trim();
      if (!currentVal) return;

      const upperVal = currentVal.toUpperCase();
      const parts = upperVal.split(/\s+/);
      
      if (parts.length === 1) {
        const matchedCmd = SYSTEM_COMMANDS.find(cmd => cmd.startsWith(upperVal));
        if (matchedCmd) {
          const needsSpace = ['PLAY_EFFECT', 'SET_BRIGHTNESS', 'START_OTA', 'CONNECT'].includes(matchedCmd);
          setCommand(matchedCmd + (needsSpace ? ' ' : ''));
        }
      } else if (parts.length >= 2) {
        const baseCmd = parts[0];
        const argPrefix = parts.slice(1).join(' ');
        const possibleArgs = SUGGESTIONS_MAP[baseCmd];
        if (possibleArgs) {
          const matchedArg = possibleArgs.find(arg => arg.startsWith(argPrefix));
          if (matchedArg) {
            setCommand(`${baseCmd} ${matchedArg}`);
          }
        }
      }
    }
  };

  const handleSuggestionClick = (type: string, prefix: string, value: string) => {
    if (type === 'commands') {
      const needsSpace = ['PLAY_EFFECT', 'SET_BRIGHTNESS', 'START_OTA', 'CONNECT'].includes(value);
      setCommand(value + (needsSpace ? ' ' : ''));
    } else {
      setCommand(`${prefix} ${value}`);
    }
  };

  const suggestionsObj = getSuggestions();

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-cyan-400" />
          <h2 className="text-xs font-mono tracking-widest text-cyan-400 uppercase">System_Logs</h2>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-cyan-400/10 rounded-md border border-cyan-400/20">
          <ShieldCheck size={12} className="text-cyan-400" />
          <span className="text-[8px] font-mono text-cyan-400 uppercase">Secured_Shell</span>
        </div>
      </div>
      
      <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-4 font-mono text-[10px] overflow-y-auto backdrop-blur-xl">
        <div className="space-y-1.5">
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -25, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="group flex gap-2"
            >
              <span className="text-white/20 select-none">{(logs.length - i).toString().padStart(2, '0')}</span>
              <span className={cn(
                "break-all",
                log.includes('ERROR') ? 'text-red-400' : 
                log.includes('LINK') ? 'text-emerald-400' :
                log.includes('TX_CMD') ? 'text-cyan-400' :
                log.includes('NEURAL') ? 'text-purple-400' : 'text-white/60'
              )}>
                {log}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Helper System Suggestions */}
      <div className="space-y-1.5">
        {suggestionsObj.list.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="text-[8px] font-mono text-cyan-400/30 uppercase tracking-widest leading-none">
              {suggestionsObj.type === 'arguments' ? `SUGGEST_ARG [${suggestionsObj.prefix}]:` : 'SUGGEST_CMD:'}
            </span>
            {suggestionsObj.list.slice(0, 5).map(match => (
              <button
                key={match}
                type="button"
                onClick={() => handleSuggestionClick(suggestionsObj.type, suggestionsObj.prefix || '', match)}
                className="px-2 py-0.5 rounded bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 text-[8px] font-mono text-cyan-400 transition-colors leading-none"
              >
                {match}
              </button>
            ))}
            <span className="text-[8px] font-mono text-white/25 leading-none">Press [TAB]</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 px-1 text-[8px] font-mono text-white/20 select-none">
            <span>SYS_CMDS:</span>
            {SYSTEM_COMMANDS.slice(0, 6).map(cmd => (
              <span key={cmd} className="hover:text-cyan-400/80 cursor-pointer transition-colors" onClick={() => handleSuggestionClick('commands', '', cmd)}>{cmd}</span>
            ))}
            <span>... [TAB]_COMPLETION</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative group">
          <input 
            type="text" 
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ENTER_SYSTEM_COMMAND..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

// Internal utility since we might not have the common lib imported everywhere in small components
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');
