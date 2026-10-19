import React from 'react';
import type { StudioSettings } from '../../types';
import type { RecorderState } from '../../hooks/useVideoRecorder';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Circle,
  Volume2,
  HelpCircle,
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
  onOpenShortcuts: () => void;
  audioLevel?: number;
  elapsedSeconds?: number;
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
  onOpenShortcuts,
  audioLevel = 0,
  elapsedSeconds = 0,
}) => {
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isRecording = recorderState === 'recording';
  const isPaused = recorderState === 'paused';
  const isCountdown = recorderState === 'countdown';

  return (
    <footer className="h-14 px-4 bg-[#111214] border-t border-[#303238] flex items-center justify-between select-none z-30 shrink-0">
      {/* LEFT: Timer + Recording State + Countdown selector */}
      <div className="flex items-center space-x-3">
        {/* Monospace Duration Timer */}
        <div className="flex items-center space-x-2 bg-[#17181B] border border-[#303238] px-2.5 py-1 rounded">
          <span
            className={`w-2 h-2 rounded-full ${
              isRecording
                ? 'bg-[#FF5C57] animate-rec-blink'
                : isPaused
                ? 'bg-[#E5A93C]'
                : isCountdown
                ? 'bg-[#8EA9FF] animate-pulse'
                : 'bg-[#646770]'
            }`}
          />
          <span
            className={`font-mono text-xs font-medium tracking-tight ${
              isRecording ? 'text-[#FF5C57]' : 'text-[#F1F1F2]'
            }`}
          >
            {formatTimer(elapsedSeconds)}
          </span>
        </div>

        {/* Countdown Selector Segmented Control */}
        <div className="hidden sm:flex items-center space-x-1 bg-[#17181B] border border-[#303238] rounded p-0.5 text-[11px]">
          <span className="text-[#9699A1] px-1.5 font-medium">Delay:</span>
          {([0, 3, 5, 10] as const).map((sec) => (
            <button
              key={sec}
              onClick={() => onUpdateSettings({ countdownSec: sec })}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                settings.countdownSec === sec
                  ? 'bg-[#1D1F23] text-[#8EA9FF] font-semibold'
                  : 'text-[#9699A1] hover:text-[#F1F1F2]'
              }`}
            >
              {sec === 0 ? 'Off' : `${sec}s`}
            </button>
          ))}
        </div>
      </div>

      {/* CENTER: Recording & Teleprompter Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Main Recording Actions */}
        {!isRecording && !isPaused && !isCountdown && (
          <button
            onClick={onStartRecording}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-md bg-[#FF5C57] hover:bg-[#E04B46] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            title="Start video recording with teleprompter"
          >
            <Circle className="w-3 h-3 fill-white" />
            <span>Record Take</span>
          </button>
        )}

        {(isRecording || isPaused) && (
          <div className="flex items-center space-x-1.5">
            {isRecording ? (
              <button
                onClick={onPauseRecording}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-[#1D1F23] hover:bg-[#24262B] border border-[#303238] text-xs text-[#E5A93C] font-medium transition-colors cursor-pointer"
                title="Pause recording"
              >
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pause</span>
              </button>
            ) : (
              <button
                onClick={onResumeRecording}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-[#1D1F23] hover:bg-[#24262B] border border-[#303238] text-xs text-[#30D158] font-medium transition-colors cursor-pointer"
                title="Resume recording"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Resume</span>
              </button>
            )}

            <button
              onClick={onStopRecording}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#FF5C57] hover:bg-[#E04B46] text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Finish take and export MP4"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Finish</span>
            </button>
          </div>
        )}

        {isCountdown && (
          <button
            onClick={onStopRecording}
            className="px-3 py-1.5 rounded bg-[#24262B] text-xs text-[#F1F1F2] hover:bg-[#303238] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}

        <div className="h-4 w-px bg-[#303238]" />

        {/* Teleprompter Play/Pause Button */}
        <button
          onClick={onTogglePrompter}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors cursor-pointer ${
            isPrompterPlaying
              ? 'bg-[#1D1F23] border-[#8EA9FF]/40 text-[#8EA9FF]'
              : 'bg-[#17181B] border-[#303238] text-[#F1F1F2] hover:bg-[#1D1F23]'
          }`}
          title="Toggle teleprompter scroll (Space)"
        >
          {isPrompterPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPrompterPlaying ? 'Pause' : 'Scroll'}</span>
          <span className="hidden md:inline text-[10px] text-[#646770] font-mono">[Space]</span>
        </button>

        {/* Prompter Restart Button */}
        <button
          onClick={onRestartPrompter}
          className="p-1.5 rounded bg-[#17181B] hover:bg-[#1D1F23] border border-[#303238] text-[#9699A1] hover:text-[#F1F1F2] transition-colors cursor-pointer"
          title="Restart teleprompter from top (R)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Scroll Speed Stepper */}
        <div className="hidden md:flex items-center space-x-1 bg-[#17181B] border border-[#303238] rounded px-1.5 py-0.5 text-xs text-[#9699A1]">
          <span className="text-[11px] font-mono text-[#8EA9FF]">
            {settings.scrollSpeed.toFixed(1)}x
          </span>
          <button
            onClick={() =>
              onUpdateSettings({
                scrollSpeed: Math.max(0.5, +(settings.scrollSpeed - 0.2).toFixed(1)),
              })
            }
            className="px-1 text-[#9699A1] hover:text-[#F1F1F2] cursor-pointer"
            title="Decrease speed ([)"
          >
            -
          </button>
          <button
            onClick={() =>
              onUpdateSettings({
                scrollSpeed: Math.min(10, +(settings.scrollSpeed + 0.2).toFixed(1)),
              })
            }
            className="px-1 text-[#9699A1] hover:text-[#F1F1F2] cursor-pointer"
            title="Increase speed (])"
          >
            +
          </button>
        </div>
      </div>

      {/* RIGHT: Mic VU Meter + Shortcuts Helper */}
      <div className="flex items-center space-x-2">
        {/* VU Volume Meter */}
        <div
          className="hidden sm:flex items-center space-x-1.5 bg-[#17181B] border border-[#303238] px-2 py-1 rounded"
          title={`Microphone input level: ${audioLevel}%`}
        >
          <Volume2 className={`w-3 h-3 ${audioLevel > 5 ? 'text-[#30D158]' : 'text-[#646770]'}`} />
          <div className="w-14 h-1.5 bg-[#24262B] rounded overflow-hidden flex items-center">
            <div
              className={`h-full transition-all duration-75 ${
                audioLevel > 75 ? 'bg-[#E5A93C]' : audioLevel > 8 ? 'bg-[#30D158]' : 'bg-[#646770]'
              }`}
              style={{ width: `${Math.max(4, audioLevel)}%` }}
            />
          </div>
        </div>

        {/* Keyboard Shortcuts Dialog Button */}
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 rounded hover:bg-[#1D1F23] text-[#9699A1] hover:text-[#F1F1F2] transition-colors cursor-pointer"
          title="Keyboard Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
