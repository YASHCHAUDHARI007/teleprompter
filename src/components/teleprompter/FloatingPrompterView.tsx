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
    storageService.getScripts().then((scripts) => {
      if (scripts.length > 0) {
        setScript(scripts[0]);
      }
    });

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
      {/* Restrained Floating Toolbar */}
      <div className="h-9 px-3 bg-[#111214]/95 border-b border-[#303238] flex items-center justify-between text-xs text-[#9699A1]">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8EA9FF]" />
          <span className="font-semibold text-[#F1F1F2] truncate max-w-[180px]">
            {script?.title || 'Floating Prompter'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="px-2 py-0.5 rounded bg-[#1D1F23] hover:bg-[#24262B] border border-[#303238] text-[#F1F1F2] font-medium flex items-center space-x-1 cursor-pointer text-[11px]"
          >
            {isPlaying ? <Pause className="w-3 h-3 text-[#8EA9FF]" /> : <Play className="w-3 h-3 text-[#8EA9FF]" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => setIsPlaying(false)}
            className="p-1 rounded bg-[#1D1F23] hover:bg-[#24262B] border border-[#303238] text-[#9699A1] hover:text-[#F1F1F2] cursor-pointer"
            title="Restart"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            onClick={toggleClickThrough}
            className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${
              isClickThrough
                ? 'bg-[#E5A93C]/20 text-[#E5A93C] border-[#E5A93C]/40'
                : 'bg-[#1D1F23] text-[#9699A1] border-[#303238]'
            }`}
            title="Toggle Click-Through"
          >
            Click-Through: {isClickThrough ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => window.close()}
            className="p-1 rounded text-[#9699A1] hover:text-[#F1F1F2] hover:bg-[#24262B] cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Prompter Body */}
      <div className="flex-1 relative overflow-hidden bg-black/60">
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
