import React, { useState } from 'react';
import type { StudioSettings, Script } from '../../types';
import type { RecorderState } from '../../hooks/useVideoRecorder';
import { TeleprompterOverlay } from '../teleprompter/TeleprompterOverlay';
import {
  RefreshCw,
  AlertCircle,
  VideoOff,
  Sliders,
  FileText,
  Volume2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface StudioStageProps {
  stream: MediaStream | null;
  settings: StudioSettings;
  onUpdateSettings: (partial: Partial<StudioSettings>) => void;
  scriptContent: string;
  currentScript: Script | null;
  onUpdateScript: (partial: Partial<Script>) => void;
  isPrompterPlaying: boolean;
  onTogglePrompterPlay: () => void;
  onRestartPrompter: () => void;
  onSpeedChange: (speed: number) => void;
  recorderState: RecorderState;
  elapsedSeconds: number;
  countdownRemaining: number;
  audioLevel: number;
  hasPermissions: boolean;
  permissionError: string | null;
  isInitializingMedia: boolean;
  onRetryPermissions: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const StudioStage: React.FC<StudioStageProps> = ({
  stream,
  settings,
  onUpdateSettings,
  scriptContent,
  currentScript,
  onUpdateScript,
  isPrompterPlaying,
  onTogglePrompterPlay,
  onRestartPrompter,
  onSpeedChange,
  recorderState,
  elapsedSeconds,
  countdownRemaining,
  audioLevel,
  hasPermissions,
  permissionError,
  isInitializingMedia,
  onRetryPermissions,
  videoRef,
}) => {
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<'prompter' | 'script'>('prompter');

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const insertCue = (cueText: string) => {
    if (!currentScript) return;
    const added = `\n[${cueText}]\n`;
    onUpdateScript({ content: currentScript.content + added });
  };

  const aspectClass =
    settings.aspectRatio === '4:3'
      ? 'aspect-[4/3] max-w-4xl'
      : settings.aspectRatio === 'fill'
      ? 'w-full h-full'
      : 'aspect-video max-w-5xl';

  return (
    <div className="flex-1 flex overflow-hidden bg-[#17181B] select-none">
      {/* 1. MAIN CAMERA PREVIEW & PROMPTER WORKSPACE (Visual Focus: 72% width) */}
      <div className="flex-1 relative flex items-center justify-center p-3 sm:p-5 overflow-hidden">
        {/* Stage Container */}
        <div
          className={`relative w-full ${aspectClass} bg-[#0D0E10] rounded-md border border-[#303238] overflow-hidden flex items-center justify-center`}
        >
          {/* Live Camera Video Feed */}
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                settings.mirrorPreview ? 'scale-x-[-1]' : ''
              }`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0D0E10] text-[#9699A1] p-6 text-center">
              {isInitializingMedia ? (
                <div className="flex flex-col items-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-[#8EA9FF] animate-spin" />
                  <p className="text-xs text-[#F1F1F2]">Connecting camera and microphone...</p>
                </div>
              ) : permissionError ? (
                <div className="max-w-sm bg-[#1D1F23] border border-[#FF5C57]/40 p-5 rounded-md flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF5C57]/15 flex items-center justify-center text-[#FF5C57]">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#F1F1F2]">Camera Access Required</h3>
                  <p className="text-xs text-[#9699A1] leading-relaxed text-center">
                    {permissionError}
                  </p>
                  <button
                    onClick={onRetryPermissions}
                    className="mt-1 px-4 py-1.5 rounded bg-[#8EA9FF] hover:bg-[#A6BCFF] text-[#111214] font-medium text-xs transition-colors cursor-pointer"
                  >
                    Grant Permissions
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <VideoOff className="w-7 h-7 text-[#646770]" />
                  <p className="text-xs text-[#9699A1]">Camera inactive</p>
                  <button
                    onClick={onRetryPermissions}
                    className="px-3 py-1 rounded bg-[#1D1F23] hover:bg-[#24262B] border border-[#303238] text-xs text-[#F1F1F2] cursor-pointer"
                  >
                    Start Camera
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Framing Guides Overlay */}
          {settings.framingGuide === 'ruleOfThirds' && (
            <div className="absolute inset-0 pointer-events-none z-15 grid grid-cols-3 grid-rows-3 opacity-25">
              <div className="border-r border-b border-[#8EA9FF]/40" />
              <div className="border-r border-b border-[#8EA9FF]/40" />
              <div className="border-b border-[#8EA9FF]/40" />
              <div className="border-r border-b border-[#8EA9FF]/40" />
              <div className="border-r border-b border-[#8EA9FF]/40" />
              <div className="border-b border-[#8EA9FF]/40" />
              <div className="border-r border-b border-[#8EA9FF]/40" />
              <div className="border-r border-b border-[#8EA9FF]/40" />
              <div />
            </div>
          )}

          {settings.framingGuide === 'centerCross' && (
            <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center opacity-25">
              <div className="w-px h-full bg-[#8EA9FF]/40" />
              <div className="absolute h-px w-full bg-[#8EA9FF]/40" />
              <div className="w-12 h-12 rounded-full border border-[#8EA9FF]/50" />
            </div>
          )}

          {/* Teleprompter Text Layer Directly Over Video */}
          <div className="absolute inset-0 z-20">
            <TeleprompterOverlay
              scriptContent={scriptContent}
              settings={settings}
              isPlaying={isPrompterPlaying}
              onTogglePlay={onTogglePrompterPlay}
              onRestart={onRestartPrompter}
              onSpeedChange={onSpeedChange}
            />
          </div>

          {/* On-Stage HUD: Status & Mic Meter */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
            {/* Recording State Pill */}
            <div className="flex items-center space-x-2 pointer-events-auto">
              {recorderState === 'recording' && (
                <div className="flex items-center space-x-2 bg-[#111214]/90 border border-[#FF5C57]/40 px-2.5 py-1 rounded text-xs text-[#F1F1F2]">
                  <span className="w-2 h-2 rounded-full bg-[#FF5C57] animate-rec-blink" />
                  <span className="font-semibold text-[#FF5C57] text-[11px] uppercase tracking-wider">REC</span>
                  <span className="font-mono text-xs">{formatTimer(elapsedSeconds)}</span>
                </div>
              )}

              {recorderState === 'paused' && (
                <div className="flex items-center space-x-2 bg-[#111214]/90 border border-[#E5A93C]/40 px-2.5 py-1 rounded text-xs text-[#F1F1F2]">
                  <span className="w-2 h-2 rounded-full bg-[#E5A93C]" />
                  <span className="font-semibold text-[#E5A93C] text-[11px] uppercase tracking-wider">PAUSED</span>
                  <span className="font-mono text-xs">{formatTimer(elapsedSeconds)}</span>
                </div>
              )}

              {recorderState === 'idle' && (
                <div className="flex items-center space-x-1.5 bg-[#111214]/80 border border-[#303238] px-2.5 py-1 rounded text-[11px] text-[#9699A1]">
                  <span className={`w-1.5 h-1.5 rounded-full ${hasPermissions && stream ? 'bg-[#30D158]' : 'bg-[#E5A93C]'}`} />
                  <span>{hasPermissions && stream ? `Live (${settings.resolution})` : 'Standby'}</span>
                </div>
              )}
            </div>

            {/* Mic Activity Bar */}
            <div className="flex items-center space-x-1.5 bg-[#111214]/80 border border-[#303238] px-2.5 py-1 rounded text-[11px] text-[#9699A1] pointer-events-auto">
              <Volume2 className={`w-3 h-3 ${audioLevel > 5 ? 'text-[#30D158]' : 'text-[#646770]'}`} />
              <div className="w-12 h-1.5 bg-[#1D1F23] rounded overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    audioLevel > 75 ? 'bg-[#E5A93C]' : audioLevel > 8 ? 'bg-[#30D158]' : 'bg-[#646770]'
                  }`}
                  style={{ width: `${Math.max(4, audioLevel)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Countdown Overlay */}
          {recorderState === 'countdown' && (
            <div className="absolute inset-0 z-40 bg-[#111214]/80 flex flex-col items-center justify-center select-none">
              <div className="text-8xl font-bold text-[#F1F1F2] tracking-tighter">
                {countdownRemaining}
              </div>
              <p className="mt-3 text-xs uppercase tracking-widest text-[#8EA9FF] font-medium">
                Focus On Camera Lens
              </p>
            </div>
          )}
        </div>

        {/* Toggle Inspector Button */}
        <button
          onClick={() => setIsInspectorOpen((prev) => !prev)}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-l bg-[#1D1F23] border-l border-y border-[#303238] text-[#9699A1] hover:text-[#F1F1F2] cursor-pointer hidden md:flex"
          title={isInspectorOpen ? 'Collapse side inspector' : 'Expand side inspector'}
        >
          {isInspectorOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2. COMPACT SECONDARY PROMPTER & SCRIPT INSPECTOR (28% width) */}
      {isInspectorOpen && (
        <aside className="w-72 sm:w-80 bg-[#1D1F23] border-l border-[#303238] flex flex-col select-none shrink-0 z-20">
          {/* Inspector Tab Switcher */}
          <div className="h-10 px-3 border-b border-[#303238] flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setInspectorTab('prompter')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  inspectorTab === 'prompter'
                    ? 'bg-[#24262B] text-[#F1F1F2] font-medium'
                    : 'text-[#9699A1] hover:text-[#F1F1F2]'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Prompter</span>
              </button>

              <button
                onClick={() => setInspectorTab('script')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  inspectorTab === 'script'
                    ? 'bg-[#24262B] text-[#F1F1F2] font-medium'
                    : 'text-[#9699A1] hover:text-[#F1F1F2]'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Script</span>
              </button>
            </div>

            <span className="text-[10px] text-[#646770] uppercase tracking-wider font-mono">
              Inspector
            </span>
          </div>

          {/* Inspector Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-[#9699A1]">
            {inspectorTab === 'prompter' ? (
              <>
                {/* Scroll Speed */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#F1F1F2] font-medium">Scroll Speed</span>
                    <span className="font-mono text-[#8EA9FF]">{settings.scrollSpeed.toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          scrollSpeed: Math.max(0.5, +(settings.scrollSpeed - 0.2).toFixed(1)),
                        })
                      }
                      className="w-6 h-6 rounded bg-[#24262B] hover:bg-[#303238] border border-[#303238] text-[#F1F1F2] flex items-center justify-center cursor-pointer text-xs"
                      title="Decrease speed ([)"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="0.5"
                      max="10.0"
                      step="0.1"
                      value={settings.scrollSpeed}
                      onChange={(e) => onUpdateSettings({ scrollSpeed: parseFloat(e.target.value) })}
                      className="flex-1 h-1 bg-[#24262B] rounded appearance-none cursor-pointer accent-[#8EA9FF]"
                    />
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          scrollSpeed: Math.min(10, +(settings.scrollSpeed + 0.2).toFixed(1)),
                        })
                      }
                      className="w-6 h-6 rounded bg-[#24262B] hover:bg-[#303238] border border-[#303238] text-[#F1F1F2] flex items-center justify-center cursor-pointer text-xs"
                      title="Increase speed (])"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#F1F1F2] font-medium">Font Size</span>
                    <span className="font-mono text-[#8EA9FF]">{settings.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="64"
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#24262B] rounded appearance-none cursor-pointer accent-[#8EA9FF]"
                  />
                </div>

                {/* Column Width */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#F1F1F2] font-medium">Reading Width</span>
                    <span className="font-mono text-[#8EA9FF]">{settings.textWidthPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="100"
                    value={settings.textWidthPercent}
                    onChange={(e) => onUpdateSettings({ textWidthPercent: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#24262B] rounded appearance-none cursor-pointer accent-[#8EA9FF]"
                  />
                </div>

                {/* Eye-line Height Guide */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#F1F1F2] font-medium">Lens Eye-Line Position</span>
                    <span className="font-mono text-[#8EA9FF]">{settings.readingGuidePosition}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    value={settings.readingGuidePosition}
                    onChange={(e) => onUpdateSettings({ readingGuidePosition: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#24262B] rounded appearance-none cursor-pointer accent-[#8EA9FF]"
                  />
                </div>

                {/* Scrim Opacity (Backdrop Behind Text) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#F1F1F2] font-medium">Background Translucency</span>
                    <span className="font-mono text-[#8EA9FF]">
                      {Math.round(settings.overlayBgOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.85"
                    step="0.05"
                    value={settings.overlayBgOpacity}
                    onChange={(e) => onUpdateSettings({ overlayBgOpacity: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-[#24262B] rounded appearance-none cursor-pointer accent-[#8EA9FF]"
                  />
                </div>

                <div className="h-px bg-[#303238] my-3" />

                {/* Quick Toggle Controls */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded bg-[#17181B] border border-[#303238] cursor-pointer">
                    <span className="text-xs text-[#F1F1F2]">Focus Mode Dimmer (F)</span>
                    <input
                      type="checkbox"
                      checked={settings.focusModeDim}
                      onChange={(e) => onUpdateSettings({ focusModeDim: e.target.checked })}
                      className="accent-[#8EA9FF] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-[#17181B] border border-[#303238] cursor-pointer">
                    <span className="text-xs text-[#F1F1F2]">Mirror Teleprompter (M)</span>
                    <input
                      type="checkbox"
                      checked={settings.mirrorPrompter}
                      onChange={(e) => onUpdateSettings({ mirrorPrompter: e.target.checked })}
                      className="accent-[#8EA9FF] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-[#17181B] border border-[#303238] cursor-pointer">
                    <span className="text-xs text-[#F1F1F2]">Mirror Camera Preview</span>
                    <input
                      type="checkbox"
                      checked={settings.mirrorPreview}
                      onChange={(e) => onUpdateSettings({ mirrorPreview: e.target.checked })}
                      className="accent-[#8EA9FF] cursor-pointer"
                    />
                  </label>
                </div>

                {/* Framing Guide Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-[#F1F1F2] font-medium">Framing Guide</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['none', 'ruleOfThirds', 'centerCross'] as const).map((guide) => (
                      <button
                        key={guide}
                        onClick={() => onUpdateSettings({ framingGuide: guide })}
                        className={`py-1 text-[11px] rounded border transition-colors cursor-pointer ${
                          settings.framingGuide === guide
                            ? 'bg-[#24262B] border-[#8EA9FF] text-[#F1F1F2]'
                            : 'border-[#303238] text-[#9699A1] hover:text-[#F1F1F2]'
                        }`}
                      >
                        {guide === 'none' ? 'Clean' : guide === 'ruleOfThirds' ? 'Thirds' : 'Cross'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Script Quick Look & Cues */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[#F1F1F2]">
                      {currentScript?.wordCount || 0} words
                    </span>
                    <span className="font-mono text-[#8EA9FF]">
                      ~{Math.round((currentScript?.estimatedDurationSec || 0) / 60)}m speaking
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] text-[#F1F1F2] font-medium">Insert Stage Cue</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Pause 2s', 'Smile', 'Look at camera', 'Emphasize'].map((cue) => (
                        <button
                          key={cue}
                          onClick={() => insertCue(cue)}
                          className="px-2 py-0.5 rounded bg-[#24262B] border border-[#303238] hover:border-[#8EA9FF] text-[11px] text-[#8EA9FF] transition-colors cursor-pointer"
                        >
                          +{cue}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] text-[#F1F1F2] font-medium">Script Quick Edit</span>
                    <textarea
                      value={currentScript?.content || ''}
                      onChange={(e) => {
                        const words = e.target.value.trim() ? e.target.value.trim().split(/\s+/).length : 0;
                        const duration = Math.round((words / settings.wordsPerMinute) * 60);
                        onUpdateScript({
                          content: e.target.value,
                          wordCount: words,
                          estimatedDurationSec: duration,
                          updatedAt: Date.now(),
                        });
                      }}
                      rows={12}
                      placeholder="Script text..."
                      className="w-full bg-[#17181B] border border-[#303238] rounded p-2 text-xs text-[#F1F1F2] focus:border-[#8EA9FF] focus:outline-none resize-none leading-relaxed font-sans"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
