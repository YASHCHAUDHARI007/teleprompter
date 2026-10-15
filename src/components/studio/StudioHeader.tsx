import React, { useState } from 'react';
import type { Script } from '../../types';
import {
  FileText,
  Camera,
  Maximize2,
  Minimize2,
  ExternalLink,
  Edit3,
  Check,
  Clock,
  Mic,
} from 'lucide-react';

interface StudioHeaderProps {
  currentScript: Script | null;
  onUpdateScriptTitle: (newTitle: string) => void;
  viewMode: 'studio' | 'editor';
  onChangeViewMode: (mode: 'studio' | 'editor') => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onLaunchFloatingWindow: () => void;
  isElectron: boolean;
  currentCameraLabel?: string;
  currentMicLabel?: string;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  currentScript,
  onUpdateScriptTitle,
  viewMode,
  onChangeViewMode,
  isFullscreen,
  onToggleFullscreen,
  onLaunchFloatingWindow,
  isElectron,
  currentCameraLabel,
  currentMicLabel,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(currentScript?.title || '');

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onUpdateScriptTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const formatSpeakingTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    if (mins === 0) return `${remainder}s`;
    return `${mins}m ${remainder > 0 ? `${remainder}s` : ''}`;
  };

  return (
    <header className="h-14 bg-[#0b0f17]/95 border-b border-slate-800/80 px-4 flex items-center justify-between z-30 select-none">
      {/* LEFT: Script title & stats */}
      <div className="flex items-center space-x-3 min-w-0">
        <div className="flex items-center space-x-2 min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="bg-slate-800 text-white text-sm font-semibold px-2.5 py-1 rounded-lg border border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1 text-emerald-400 hover:text-emerald-300"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                setTempTitle(currentScript?.title || '');
                setIsEditingTitle(true);
              }}
              className="flex items-center space-x-2 group cursor-pointer hover:bg-slate-800/60 px-2.5 py-1 rounded-lg transition"
              title="Click to rename script"
            >
              <h1 className="text-sm font-semibold text-slate-100 truncate max-w-[280px] sm:max-w-[420px]">
                {currentScript?.title || 'Untitled Script'}
              </h1>
              <Edit3 className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition" />
            </div>
          )}

          {/* Stats pill */}
          {currentScript && (
            <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/50">
              <span>{currentScript.wordCount} words</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center space-x-1 text-blue-300">
                <Clock className="w-3 h-3" />
                <span>~{formatSpeakingTime(currentScript.estimatedDurationSec)}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: View Modes & Studio Actions */}
      <div className="flex items-center space-x-2">
        {/* Active Devices Badges */}
        {currentCameraLabel && (
          <div className="hidden 2xl:flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-800/60 text-slate-300 border border-slate-700/40 max-w-[140px] truncate" title={currentCameraLabel}>
            <Camera className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="truncate">{currentCameraLabel}</span>
          </div>
        )}
        {currentMicLabel && (
          <div className="hidden 2xl:flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-800/60 text-slate-300 border border-slate-700/40 max-w-[140px] truncate" title={currentMicLabel}>
            <Mic className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{currentMicLabel}</span>
          </div>
        )}

        {/* Environment Badge */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/70 text-slate-300 border border-slate-700/50">
          <span className={`w-2 h-2 rounded-full ${isElectron ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-emerald-400'}`} />
          <span>{isElectron ? 'Desktop Studio' : 'Web Studio'}</span>
        </div>

        {/* View Mode Toggle: Studio vs Script Editor */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs">
          <button
            onClick={() => onChangeViewMode('studio')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              viewMode === 'studio'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
          <button
            onClick={() => onChangeViewMode('editor')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Script Editor</span>
          </button>
        </div>

        {/* Floating Window Overlay Trigger */}
        <button
          onClick={onLaunchFloatingWindow}
          title={isElectron ? 'Launch Always-on-Top Floating Prompter (Mode B)' : 'Open Prompter in Separate Popout Window'}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Floating Prompter</span>
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Studio Fullscreen'}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition border border-slate-700/50 cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
