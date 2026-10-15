import { useState, useEffect, useRef, useCallback } from 'react';
import type { Script, StudioSettings, RecordingHistoryItem } from './types';
import { storageService } from './services/storage';
import { useCameraAndAudio } from './hooks/useCameraAndAudio';
import { useVideoRecorder, type RecordedVideoData } from './hooks/useVideoRecorder';
import { LeftSidebar } from './components/sidebar/LeftSidebar';
import { StudioHeader } from './components/studio/StudioHeader';
import { StudioStage } from './components/studio/StudioStage';
import { RecordingControlsBar } from './components/studio/RecordingControlsBar';
import { ScriptEditorView } from './components/editor/ScriptEditorView';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { RecordingReviewModal } from './components/recording/RecordingReviewModal';
import { RecordingHistoryDrawer } from './components/recording/RecordingHistoryDrawer';
import { KeyboardShortcutsModal } from './components/studio/KeyboardShortcutsModal';
import { FloatingPrompterView } from './components/teleprompter/FloatingPrompterView';

export function App() {
  // Check if running in floating popout window mode
  const isFloatingMode = new URLSearchParams(window.location.search).get('mode') === 'floating';
  if (isFloatingMode) {
    return <FloatingPrompterView />;
  }

  return <StudioApp />;
}

function StudioApp() {
  // App state
  const [scripts, setScripts] = useState<Script[]>([]);
  const [currentScript, setCurrentScript] = useState<Script | null>(null);
  const [settings, setSettings] = useState<StudioSettings>(storageService.getSettings());
  const [recordingHistory, setRecordingHistory] = useState<RecordingHistoryItem[]>([]);
  const [viewMode, setViewMode] = useState<'studio' | 'editor'>('studio');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Teleprompter state
  const [isPrompterPlaying, setIsPrompterPlaying] = useState(false);

  // Video review modal state
  const [currentReviewTake, setCurrentReviewTake] = useState<RecordedVideoData | null>(null);

  // Detect Electron environment
  const isElectron = !!window.promptStudioDesktop?.isElectron;

  // Video element ref for stage
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Media (Webcam & Mic) Hook
  const {
    stream,
    videoDevices,
    audioDevices,
    currentVideoDevice,
    currentAudioDevice,
    audioLevel,
    hasPermissions,
    permissionError,
    isInitializing: isInitializingMedia,
    switchVideoDevice,
    switchAudioDevice,
    retryPermissions,
  } = useCameraAndAudio({
    videoDeviceId: settings.selectedVideoDeviceId,
    audioDeviceId: settings.selectedAudioDeviceId,
    aspectRatio: settings.aspectRatio,
  });

  // Video Recorder Hook
  const handleRecordingComplete = useCallback(
    (recordedData: RecordedVideoData) => {
      setCurrentReviewTake(recordedData);
      if (settings.autoStopPrompterOnRecordEnd) {
        setIsPrompterPlaying(false);
      }
    },
    [settings.autoStopPrompterOnRecordEnd]
  );

  const {
    recorderState,
    countdownRemaining,
    elapsedSeconds,
    triggerStartRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelCountdown,
  } = useVideoRecorder({
    onRecordingComplete: handleRecordingComplete,
    countdownSec: settings.countdownSec,
    audioFeedbackBeep: settings.audioFeedbackBeep,
  });

  // Load scripts and recordings on initial mount
  useEffect(() => {
    storageService.getScripts().then((loaded) => {
      setScripts(loaded);
      if (loaded.length > 0) {
        setCurrentScript(loaded[0]);
      }
    });

    storageService.getRecordings().then((loaded) => {
      setRecordingHistory(loaded);
    });
  }, []);

  // Update and persist settings
  const handleUpdateSettings = useCallback(
    (partial: Partial<StudioSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        storageService.saveSettings(next);
        return next;
      });
    },
    []
  );

  // Script management
  const handleSelectScript = (script: Script) => {
    setCurrentScript(script);
    setIsPrompterPlaying(false);
  };

  const handleNewScript = () => {
    const newScript: Script = {
      id: `script-${Date.now()}`,
      title: 'New Script',
      content: 'Write or paste your script content here...\n\n[Smile & look at camera]',
      category: 'custom',
      wordCount: 11,
      estimatedDurationSec: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    storageService.saveScript(newScript).then(() => {
      setScripts((prev) => [newScript, ...prev]);
      setCurrentScript(newScript);
      setViewMode('editor');
    });
  };

  const handleUpdateScript = (partial: Partial<Script>) => {
    if (!currentScript) return;
    const updated: Script = {
      ...currentScript,
      ...partial,
      updatedAt: Date.now(),
    };
    setCurrentScript(updated);
    setScripts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    storageService.saveScript(updated);
  };

  const handleDuplicateScript = (scriptToCopy: Script) => {
    const copy: Script = {
      ...scriptToCopy,
      id: `script-${Date.now()}`,
      title: `${scriptToCopy.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    storageService.saveScript(copy).then(() => {
      setScripts((prev) => [copy, ...prev]);
      setCurrentScript(copy);
    });
  };

  const handleDeleteScript = (id: string) => {
    storageService.deleteScript(id).then(() => {
      const remaining = scripts.filter((s) => s.id !== id);
      setScripts(remaining);
      if (currentScript?.id === id) {
        setCurrentScript(remaining[0] || null);
      }
    });
  };

  // Recording actions
  const handleStartRecording = () => {
    if (!stream) {
      alert('Camera stream is not active. Please grant camera and microphone permissions first.');
      return;
    }

    // Auto-scroll logic if enabled: start scrolling right after countdown finishes
    if (settings.autoScrollOnRecord) {
      setTimeout(() => {
        setIsPrompterPlaying(true);
      }, (settings.countdownSec || 0) * 1000);
    }

    triggerStartRecording(stream, settings.countdownSec);
  };

  const handleSaveToHistory = async (rec: RecordedVideoData, savedPath?: string) => {
    const historyItem: RecordingHistoryItem = {
      id: `rec-${rec.timestamp}`,
      scriptId: currentScript?.id || 'none',
      scriptTitle: currentScript?.title || 'Take',
      durationSec: rec.durationSec,
      fileSizeBytes: rec.fileSizeBytes,
      mimeType: rec.mimeType,
      fileName: `Take_${new Date(rec.timestamp).toISOString().replace(/[:.]/g, '-')}.webm`,
      blob: rec.blob,
      blobUrl: rec.blobUrl,
      timestamp: rec.timestamp,
      savedToDiskPath: savedPath,
    };

    await storageService.saveRecording(historyItem);
    setRecordingHistory((prev) => [historyItem, ...prev]);
  };

  const handleDeleteRecording = async (id: string) => {
    await storageService.deleteRecording(id);
    setRecordingHistory((prev) => prev.filter((r) => r.id !== id));
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Floating window launch (Mode B)
  const handleLaunchFloatingWindow = () => {
    if (isElectron && window.promptStudioDesktop?.toggleFloatingOverlay) {
      window.promptStudioDesktop.toggleFloatingOverlay({
        scriptContent: currentScript?.content || '',
        settings,
      });
    } else {
      // Browser popup fallback
      const width = 640;
      const height = 480;
      const left = window.screen.width / 2 - width / 2;
      const top = 100;
      window.open(
        `${window.location.origin}${window.location.pathname}?mode=floating`,
        'PromptStudioFloating',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no`
      );
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if typing in input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Space: Toggle Prompter Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPrompterPlaying((p) => !p);
      }

      // R: Restart Prompter to Top
      if (e.key === 'r' || e.key === 'R') {
        setIsPrompterPlaying(false);
      }

      // [ and ]: Decrease / Increase scroll speed
      if (e.key === '[') {
        handleUpdateSettings({
          scrollSpeed: Math.max(0.5, +(settings.scrollSpeed - 0.2).toFixed(1)),
        });
      }
      if (e.key === ']') {
        handleUpdateSettings({
          scrollSpeed: Math.min(10, +(settings.scrollSpeed + 0.2).toFixed(1)),
        });
      }

      // F: Toggle Focus Mode Dimmer
      if (e.key === 'f' || e.key === 'F') {
        handleUpdateSettings({ focusModeDim: !settings.focusModeDim });
      }

      // M: Toggle Mirror Prompter Text
      if (e.key === 'm' || e.key === 'M') {
        handleUpdateSettings({ mirrorPrompter: !settings.mirrorPrompter });
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsHistoryOpen(false);
        setIsShortcutsOpen(false);
        setCurrentReviewTake(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.scrollSpeed, settings.focusModeDim, settings.mirrorPrompter, handleUpdateSettings]);

  return (
    <div className="flex h-screen w-screen bg-[#0b0f17] text-slate-100 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <LeftSidebar
        scripts={scripts}
        currentScriptId={currentScript?.id || ''}
        onSelectScript={handleSelectScript}
        onNewScript={handleNewScript}
        onOpenSettings={() => setIsSettingsOpen(true)}
        recordingHistory={recordingHistory}
        onOpenHistory={() => setIsHistoryOpen(true)}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Studio Top Header */}
        <StudioHeader
          currentScript={currentScript}
          onUpdateScriptTitle={(title) => handleUpdateScript({ title })}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onLaunchFloatingWindow={handleLaunchFloatingWindow}
          isElectron={isElectron}
          currentCameraLabel={videoDevices.find((d) => d.deviceId === currentVideoDevice)?.label}
          currentMicLabel={audioDevices.find((d) => d.deviceId === currentAudioDevice)?.label}
        />

        {/* Workspace Central Body */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
          {viewMode === 'studio' ? (
            <>
              {/* Studio Camera & Prompter Stage */}
              <StudioStage
                stream={stream}
                settings={settings}
                scriptContent={currentScript?.content || ''}
                isPrompterPlaying={isPrompterPlaying}
                onTogglePrompterPlay={() => setIsPrompterPlaying((p) => !p)}
                onRestartPrompter={() => setIsPrompterPlaying(false)}
                onSpeedChange={(speed) => handleUpdateSettings({ scrollSpeed: speed })}
                recorderState={recorderState}
                elapsedSeconds={elapsedSeconds}
                countdownRemaining={countdownRemaining}
                audioLevel={audioLevel}
                hasPermissions={hasPermissions}
                permissionError={permissionError}
                isInitializingMedia={isInitializingMedia}
                onRetryPermissions={retryPermissions}
                videoRef={videoRef}
              />

              {/* Bottom Playback & Recording Controls */}
              <RecordingControlsBar
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                isPrompterPlaying={isPrompterPlaying}
                onTogglePrompter={() => setIsPrompterPlaying((p) => !p)}
                onRestartPrompter={() => setIsPrompterPlaying(false)}
                recorderState={recorderState}
                onStartRecording={handleStartRecording}
                onPauseRecording={pauseRecording}
                onResumeRecording={resumeRecording}
                onStopRecording={recorderState === 'countdown' ? cancelCountdown : stopRecording}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenShortcuts={() => setIsShortcutsOpen(true)}
              />
            </>
          ) : (
            currentScript && (
              <ScriptEditorView
                script={currentScript}
                onUpdateScript={handleUpdateScript}
                onDuplicateScript={handleDuplicateScript}
                onDeleteScript={handleDeleteScript}
                wordsPerMinute={settings.wordsPerMinute}
              />
            )
          )}
        </div>
      </div>

      {/* Settings Panel Drawer */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        videoDevices={videoDevices}
        audioDevices={audioDevices}
        currentVideoDevice={currentVideoDevice}
        currentAudioDevice={currentAudioDevice}
        onSelectVideoDevice={switchVideoDevice}
        onSelectAudioDevice={switchAudioDevice}
        isElectron={isElectron}
      />

      {/* Takes History Drawer */}
      <RecordingHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recordings={recordingHistory}
        onDeleteRecording={handleDeleteRecording}
        isElectron={isElectron}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Recording Review & Export Modal */}
      <RecordingReviewModal
        recording={currentReviewTake}
        script={currentScript}
        settings={settings}
        onClose={() => setCurrentReviewTake(null)}
        onTakeAnother={() => {
          setCurrentReviewTake(null);
          setIsPrompterPlaying(false);
        }}
        onSaveToHistory={handleSaveToHistory}
        isElectron={isElectron}
      />
    </div>
  );
}

export default App;
