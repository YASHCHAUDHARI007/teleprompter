import React, { useState, useEffect } from 'react';
import type { StudioSettings, Script } from '../../types';
import { TeleprompterOverlay } from './TeleprompterOverlay';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { storageService } from '../../services/storage';

export const FloatingPrompterView: React.FC = () => {
  const [settings, setSettings] = useState<StudioSettings>(storageService.getSettings());
  const [script, setScript] = useState<Script | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isClickThrough, setIsClickThrough] = useState<boolean>(false);

  useEffect(() => {
    // Load active script or from storage
    storageService.getScripts().then((scripts) => {
      if (scripts.length > 0) {
        setScript(scripts[0]);
      }
    });

    // Listen to IPC events from main window if in Electron
    if (window.promptStudioDesktop?.onPrompterCommand) {
      const cleanup = window.promptStudioDesktop.onPrompterCommand((cmd, payload) => {
        if (cmd === 'togglePlay') setIsPlaying((p) => !p);
        if (cmd === 'restart') setIsPlaying(false);
        if (cmd === 'updateScript' && payload) setScript(payload);
        if (cmd === 'updateSettings' && payload) setSettings(payload);
      });
      return cleanup;
    }
  }, []);

  const toggleClickThrough = async () => {
    const next = !isClickThrough;
    setIsClickThrough(next);
    if (window.promptStudioDesktop?.setClickThrough) {
      await window.promptStudioDesktop.setClickThrough(next);
    }
  };

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex flex-col select-none">
      {/* Floating Header Controls */}
      <div className="h-10 px-3 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-semibold text-white truncate max-w-[200px]">
            {script?.title || 'Floating Prompter'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="p-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center space-x-1 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => setIsPlaying(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Restart"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            onClick={toggleClickThrough}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium border cursor-pointer ${
              isClickThrough
                ? 'bg-amber-600/30 text-amber-300 border-amber-500'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle Click-Through Mode (clicks pass through to apps underneath)"
          >
            Click-Through: {isClickThrough ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => window.close()}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-red-900/40 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Prompter Body */}
      <div className="flex-1 relative overflow-hidden bg-black/60 backdrop-blur-md">
        <TeleprompterOverlay
          scriptContent={script?.content || ''}
          settings={settings}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onRestart={() => setIsPlaying(false)}
          onSpeedChange={(speed) => setSettings((s) => ({ ...s, scrollSpeed: speed }))}
          isFloatingWindow={true}
        />
      </div>
    </div>
  );
};
