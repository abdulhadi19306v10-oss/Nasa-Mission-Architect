import React, { useState } from 'react';
import { X, Users, Check, Copy, Wifi, WifiOff, Lock, Unlock, Download, Upload } from 'lucide-react';
import { PeerInfo, ServerStatus } from '../../utils/multiplayerClient';
import { encodeDesignCode, decodeDesignCode } from '../../game/knowledge';
import { SpacecraftDesign } from '@sim/index';

export type TeamRole =
  | 'Mission Planner'
  | 'Spacecraft Engineer'
  | 'Science Lead'
  | 'Communications & Budget Lead';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode?: string;
  activeRole?: TeamRole;
  serverStatus?: ServerStatus;
  peers?: PeerInfo[];
  strictRoleLock?: boolean;
  onToggleStrictLock?: () => void;
  design?: SpacecraftDesign;
  onImportDesign?: (design: SpacecraftDesign) => void;
  onJoinRoom: (code: string, role: TeamRole) => void;
  onLeaveRoom: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  activeRole,
  serverStatus = 'offline',
  peers = [],
  strictRoleLock = false,
  onToggleStrictLock,
  design,
  onImportDesign,
  onJoinRoom,
  onLeaveRoom
}) => {
  const [inputCode, setInputCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<TeamRole>(activeRole || 'Mission Planner');
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const rolesList: { role: TeamRole; desc: string }[] = [
    {
      role: 'Mission Planner',
      desc: 'Owns Flight tab: scenario requirements, target orbit altitude/inclination & launch vehicle.'
    },
    {
      role: 'Spacecraft Engineer',
      desc: 'Owns Bus, Solar, Battery, ADCS & Thermal sizing to keep power positive & DoD safe.'
    },
    {
      role: 'Science Lead',
      desc: 'Owns Payload instruments, target science domains & multi-sensor synergy combos.'
    },
    {
      role: 'Communications & Budget Lead',
      desc: 'Owns Comms antennas, OBC storage, daily GB downlink capacity & financial budget caps.'
    }
  ];

  const handleCreate = () => {
    const generated = Math.random().toString(36).substring(2, 8).toUpperCase();
    onJoinRoom(generated, selectedRole);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    onJoinRoom(inputCode.trim().toUpperCase(), selectedRole);
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard?.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyDesignCode = () => {
    if (!design) return;
    const code = encodeDesignCode(design);
    navigator.clipboard?.writeText(code);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onImportDesign || !importInput.trim()) return;
    const decoded = decodeDesignCode(importInput);
    if (decoded) {
      onImportDesign(decoded);
      setImportInput('');
      setImportFeedback(`Imported "${decoded.name}"!`);
    } else {
      setImportFeedback('Invalid MA1 design code.');
    }
    setTimeout(() => setImportFeedback(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="game-frame max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white hud-heading">
                NASA Team Mission Control (4 Roles)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Negotiate competing science, mass &amp; budget trade-offs together
              </p>
            </div>
          </div>
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border shrink-0 ${
              serverStatus === 'connected'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                : 'bg-space-950 text-slate-400 border-slate-700'
            }`}
          >
            {serverStatus === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{serverStatus === 'connected' ? 'LIVE WS SYNC' : 'LOCAL PRACTICE'}</span>
          </div>
        </div>

        {/* Current Room Status */}
        {roomCode ? (
          <div className="p-4 rounded-xl bg-space-950 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">ACTIVE MISSION ROOM</span>
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Room Code'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-3xl font-extrabold font-mono text-emerald-400 tracking-wider">
                {roomCode}
              </div>
              {onToggleStrictLock && (
                <button
                  onClick={onToggleStrictLock}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                    strictRoleLock
                      ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                      : 'bg-space-900 border-slate-700 text-slate-300'
                  }`}
                >
                  {strictRoleLock ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{strictRoleLock ? 'Strict Role Lock ON' : 'Free Tab Switching'}</span>
                </button>
              )}
            </div>

            {peers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {peers.map((p) => (
                  <span
                    key={p.id}
                    className="px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-[10px]"
                  >
                    ● {p.role || 'Engineer'}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-2 border-t border-slate-800">
              <span className="text-slate-400">
                Your Station: <strong className="text-white">{activeRole}</strong>
              </span>
              <button onClick={onLeaveRoom} className="text-rose-400 hover:text-rose-300 underline">
                Leave Room
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleCreate}
              className="p-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all text-center space-y-1 shadow-lg shadow-cyan-500/20"
            >
              <div>Create Mission Room</div>
              <div className="text-[10px] opacity-80 font-normal">
                Sync live if `npm run server` runs, or solo role-play
              </div>
            </button>

            <form onSubmit={handleJoin} className="space-y-2">
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="ENTER 6-CHAR ROOM CODE"
                className="w-full px-3 py-2.5 rounded-xl bg-space-950 border border-slate-700 text-white font-mono text-xs uppercase placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!inputCode.trim()}
                className="w-full py-2 rounded-xl bg-space-850 hover:bg-space-800 disabled:opacity-50 text-cyan-400 border border-slate-700 font-mono text-xs font-bold transition-all"
              >
                Join Room as Selected Role
              </button>
            </form>
          </div>
        )}

        {/* Role Selector */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Choose Your NASA Engineering Role
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {rolesList.map((item) => {
              const isSelected = selectedRole === item.role;
              return (
                <div
                  key={item.role}
                  onClick={() => setSelectedRole(item.role)}
                  className={`cursor-pointer p-3 rounded-xl border transition-all space-y-1 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10'
                      : 'bg-space-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white font-mono">{item.role}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">{item.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shareable Spacecraft Blueprint Code */}
        {design && (
          <div className="pt-3 border-t border-slate-800 space-y-2 font-mono">
            <div className="text-xs text-slate-400 uppercase tracking-wider">
              Share / Import Spacecraft Design Code
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleCopyDesignCode}
                className="game-chip flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0b3d91]/70 border border-sky-400/50 text-sky-200 hover:border-white text-xs font-bold shrink-0"
              >
                {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{shareCopied ? 'Code Copied!' : `Copy "${design.name}" Code`}</span>
              </button>

              {onImportDesign && (
                <form onSubmit={handleImportSubmit} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={importInput}
                    onChange={(e) => setImportInput(e.target.value)}
                    placeholder="Paste MA1:... code to load teammate's build"
                    className="flex-1 px-3 py-2 rounded-xl bg-space-950 border border-slate-700 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={!importInput.trim()}
                    className="px-3 py-2 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-300 disabled:opacity-40 text-xs font-bold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Load</span>
                  </button>
                </form>
              )}
            </div>
            {importFeedback && <div className="text-[11px] text-emerald-400">{importFeedback}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
