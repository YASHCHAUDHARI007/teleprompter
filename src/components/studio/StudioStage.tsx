import React, { useEffect } from 'react';
import type { StudioSettings } from '../../types';
import type { RecorderState } from '../../hooks/useVideoRecorder';
import { TeleprompterOverlay } from '../teleprompter/TeleprompterOverlay';
import { AlertCircle, RefreshCw, Volume2, VideoOff } from 'lucide-react';

interface StudioStageProps {
  stream: MediaStream | null;
  settings: StudioSettings;
  scriptContent: string;
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
  scriptContent,
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
  // Attach MediaStream to Video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('Video element play() was interrupted or blocked', err);
      });
    }
  }, [stream, videoRef]);

  // Format elapsed seconds as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Aspect ratio wrapper styles
  const getAspectRatioClasses = () => {
    switch (settings.aspectRatio) {
      case '4:3':
        return 'aspect-[4/3] max-w-[85vw] max-h-[85vh]';
      case '16:9':
        return 'aspect-[16/9] max-w-[92vw] max-h-[88vh]';
      case 'fill':
      default:
        return 'w-full h-full';
    }
  };

  return (
    <div className="relative flex-1 w-full h-full bg-[#070a0f] flex items-center justify-center overflow-hidden p-2 sm:p-4">
      {/* Video Container Frame */}
      <div
        className={`relative w-full h-full flex items-center justify-center bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 ${getAspectRatioClasses()}`}
      >
        {/* Live Camera Video Feed */}
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-transform duration-300 ${
              settings.mirrorPreview ? 'scale-x-[-1]' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-8 text-center space-y-4">
            {isInitializingMedia ? (
              <div className="flex flex-col items-center space-y-3">
                <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-slate-300 font-medium">Connecting camera and audio input...</p>
              </div>
            ) : permissionError ? (
              <div className="max-w-md bg-red-950/40 border border-red-500/40 p-6 rounded-xl flex flex-col items-center space-y-3 shadow-xl">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-red-200">Camera Access Required</h3>
                <p className="text-sm text-red-300/80 leading-relaxed text-center">{permissionError}</p>
                <button
                  onClick={onRetryPermissions}
                  className="mt-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Grant / Retry Permissions</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <VideoOff className="w-12 h-12 text-slate-600" />
                <p className="text-slate-400">Webcam stream inactive</p>
                <button
                  onClick={onRetryPermissions}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition cursor-pointer"
                >
                  Start Camera
                </button>
              </div>
            )}
          </div>
        )}

        {/* Framing Guides Overlay */}
        {settings.framingGuide === 'ruleOfThirds' && (
          <div className="absolute inset-0 pointer-events-none z-15 grid grid-cols-3 grid-rows-3 opacity-30">
            <div className="border-r border-b border-blue-400/40" />
            <div className="border-r border-b border-blue-400/40" />
            <div className="border-b border-blue-400/40" />
            <div className="border-r border-b border-blue-400/40" />
            <div className="border-r border-b border-blue-400/40" />
            <div className="border-b border-blue-400/40" />
            <div className="border-r border-blue-400/40" />
            <div className="border-r border-blue-400/40" />
            <div />
          </div>
        )}

        {settings.framingGuide === 'centerCross' && (
          <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center opacity-30">
            <div className="w-px h-full bg-blue-400/50" />
            <div className="absolute h-px w-full bg-blue-400/50" />
            <div className="w-16 h-16 rounded-full border border-blue-400/60" />
          </div>
        )}

        {/* Teleprompter Text Layer Overlaid On Video */}
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

        {/* Studio Heads-Up Display (HUD): Top Status Bar */}
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
          {/* Recording Status & Timer */}
          <div className="flex items-center space-x-3 pointer-events-auto">
            {recorderState === 'recording' && (
              <div className="flex items-center space-x-2 bg-red-950/80 backdrop-blur-md border border-red-500/50 px-3.5 py-1.5 rounded-full shadow-lg">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-record-dot shadow-[0_0_10px_#ef4444]" />
                <span className="text-xs font-bold tracking-wider uppercase text-red-200">REC</span>
                <span className="text-sm font-mono font-semibold text-white ml-1">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
            )}

            {recorderState === 'paused' && (
              <div className="flex items-center space-x-2 bg-amber-950/80 backdrop-blur-md border border-amber-500/50 px-3.5 py-1.5 rounded-full shadow-lg">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs font-bold tracking-wider uppercase text-amber-200">PAUSED</span>
                <span className="text-sm font-mono font-semibold text-white ml-1">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
            )}

            {recorderState === 'idle' && (
              <div className="flex items-center space-x-2 bg-slate-900/75 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 rounded-full shadow-sm text-xs font-medium text-slate-300">
                <span className={`w-2 h-2 rounded-full ${hasPermissions && stream ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{hasPermissions && stream ? `Camera Ready (${settings.resolution})` : 'Standby'}</span>
              </div>
            )}

            {settings.recordingMode === 'composited-overlay' && (
              <div className="hidden sm:flex items-center space-x-1 bg-blue-950/70 border border-blue-500/30 px-2.5 py-1 rounded-full text-[11px] font-medium text-blue-300">
                <span>Overlay Mode</span>
              </div>
            )}
          </div>

          {/* Mic VU Level Meter */}
          <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 rounded-full shadow-sm pointer-events-auto">
            <Volume2 className={`w-3.5 h-3.5 ${audioLevel > 5 ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex items-center p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  audioLevel > 75
                    ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                    : audioLevel > 8
                    ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                    : 'bg-slate-600'
                }`}
                style={{ width: `${Math.max(4, audioLevel)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400 w-6 text-right">
              {audioLevel}%
            </span>
          </div>
        </div>

        {/* Big Countdown Overlay */}
        {recorderState === 'countdown' && (
          <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center select-none animate-fadeIn">
            <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-white to-blue-600 drop-shadow-[0_0_35px_rgba(59,130,246,0.6)] animate-pulse">
              {countdownRemaining}
            </div>
            <p className="mt-4 text-xl font-semibold text-blue-200 tracking-wider uppercase">
              Get Ready • Focus On The Lens
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
