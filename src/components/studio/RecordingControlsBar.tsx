import React from 'react';
import type { StudioSettings } from '../../types';
import type { RecorderState } from '../../hooks/useVideoRecorder';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Circle,
  Eye,
  FlipHorizontal,
  Keyboard,
  Clock,
  Sliders,
} from 'lucide-react';

interface RecordingControlsBarProps {
  settings: StudioSettings;
  onUpdateSettings: (partial: Partial<StudioSettings>) => void;
  isPrompterPlaying: boolean;
  onTogglePrompter: () => void;
  onRestartPrompter: () => void;
  recorderState: RecorderState;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}

export const RecordingControlsBar: React.FC<RecordingControlsBarProps> = ({
  settings,
  onUpdateSettings,
  isPrompterPlaying,
  onTogglePrompter,
  onRestartPrompter,
  recorderState,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onOpenSettings,
  onOpenShortcuts,
}) => {
  const isRecording = recorderState === 'recording';
  const isPaused = recorderState === 'paused';
  const isCountdown = recorderState === 'countdown';

  return (
    <div className="w-full bg-[#0d131f]/90 backdrop-blur-xl border-t border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-4 z-40 select-none">
      {/* LEFT: Teleprompter Scrolling Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onRestartPrompter}
          title="Restart Prompter to Top (R)"
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm border border-slate-700/50 cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePrompter}
          title={isPrompterPlaying ? 'Pause Scrolling (Space)' : 'Play Scrolling (Space)'}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-md border cursor-pointer active:scale-95 ${
            isPrompterPlaying
              ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40'
              : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/40 shadow-blue-500/20'
          }`}
        >
          {isPrompterPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Scroll</span>
            </>
          )}
        </button>

        {/* Speed Slider */}
        <div className="hidden sm:flex items-center space-x-2 bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Speed:</span>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.1"
            value={settings.scrollSpeed}
            onChange={(e) => onUpdateSettings({ scrollSpeed: parseFloat(e.target.value) })}
            className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs font-mono font-semibold text-blue-400 w-8">
            {settings.scrollSpeed.toFixed(1)}x
          </span>
        </div>
      </div>

      {/* CENTER: Main Studio Recording Controls */}
      <div className="flex items-center space-x-3">
        {/* Countdown selector */}
        <div className="flex items-center bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
          {([0, 3, 5, 10] as const).map((sec) => (
            <button
              key={sec}
              onClick={() => onUpdateSettings({ countdownSec: sec })}
              disabled={isRecording || isPaused || isCountdown}
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                settings.countdownSec === sec
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>

        {/* Start / Pause / Stop Recording Buttons */}
        {!isRecording && !isPaused && !isCountdown && (
          <button
            onClick={onStartRecording}
            className="flex items-center space-x-2.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-red-600/30 border border-red-400/30 cursor-pointer active:scale-95 transition-all"
          >
            <Circle className="w-4 h-4 fill-current text-white animate-pulse" />
            <span>Record Take</span>
          </button>
        )}

        {isCountdown && (
          <button
            onClick={onStopRecording}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm border border-slate-700 cursor-pointer"
          >
            Cancel
          </button>
        )}

        {(isRecording || isPaused) && (
          <div className="flex items-center space-x-2">
            {isRecording ? (
              <button
                onClick={onPauseRecording}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 font-medium text-sm transition cursor-pointer active:scale-95"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={onResumeRecording}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 font-medium text-sm transition cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>
            )}

            <button
              onClick={onStopRecording}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-600/30 border border-red-400/40 transition cursor-pointer active:scale-95"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Finish & Review</span>
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Quick Tools & Settings Drawer */}
      <div className="flex items-center space-x-2">
        {/* Toggle Mirror Prompter */}
        <button
          onClick={() => onUpdateSettings({ mirrorPrompter: !settings.mirrorPrompter })}
          title={`Mirror Prompter Text: ${settings.mirrorPrompter ? 'ON' : 'OFF'}`}
          className={`p-2.5 rounded-xl transition border cursor-pointer ${
            settings.mirrorPrompter
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700/50'
          }`}
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>

        {/* Toggle Focus Mode */}
        <button
          onClick={() => onUpdateSettings({ focusModeDim: !settings.focusModeDim })}
          title={`Focus Dimmer: ${settings.focusModeDim ? 'ON' : 'OFF'}`}
          className={`p-2.5 rounded-xl transition border cursor-pointer ${
            settings.focusModeDim
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700/50'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Keyboard Shortcuts Dialog */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts Cheat Sheet"
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition border border-slate-700/50 cursor-pointer"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Settings Panel Toggle */}
        <button
          onClick={onOpenSettings}
          title="Studio Settings"
          className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700/70 transition cursor-pointer shadow-sm"
        >
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
