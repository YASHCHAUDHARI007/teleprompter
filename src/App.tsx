import { useState, useEffect, useRef, useCallback } from 'react';
import type { Script, StudioSettings, RecordingHistoryItem } from './types';
import { storageService } from './services/storage';
import { useCameraAndAudio } from './hooks/useCameraAndAudio';
import { useVideoRecorder, type RecordedVideoData } from './hooks/useVideoRecorder';
import { StudioHeader } from './components/studio/StudioHeader';
import { StudioStage } from './components/studio/StudioStage';
import { RecordingControlsBar } from './components/studio/RecordingControlsBar';
import { ScriptEditorView } from './components/editor/ScriptEditorView';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { RecordingHistoryDrawer } from './components/recording/RecordingHistoryDrawer';
import { RecordingReviewModal } from './components/recording/RecordingReviewModal';
import { KeyboardShortcutsModal } from './components/studio/KeyboardShortcutsModal';
import { FloatingPrompterView } from './components/teleprompter/FloatingPrompterView';

function StudioApp() {
  // Application States
  const [scripts, setScripts] = useState<Script[]>([]);
  const [currentScript, setCurrentScript] = useState<Script | null>(null);
  const [settings, setSettings] = useState<StudioSettings>(storageService.getSettings());
  const [recordingHistory, setRecordingHistory] = useState<RecordingHistoryItem[]>([]);
  const [viewMode, setViewMode] = useState<'studio' | 'editor'>('studio');

  // Prompter Playback State
  const [isPrompterPlaying, setIsPrompterPlaying] = useState(false);

  // Modals & Panels State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentReviewTake, setCurrentReviewTake] = useState<RecordedVideoData | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isElectron = Boolean(window.promptStudioDesktop?.isElectron);

  // Initialize scripts and history from IndexedDB / Storage
  useEffect(() => {
    async function loadInitialData() {
      const loadedScripts = await storageService.getScripts();
      setScripts(loadedScripts);
      if (loadedScripts.length > 0) {
        setCurrentScript(loadedScripts[0]);
      }

      const history = await storageService.getRecordings();
      setRecordingHistory(history);
    }

    loadInitialData();
  }, []);

  // Update Settings handler
  const handleUpdateSettings = useCallback((newSettings: Partial<StudioSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      storageService.saveSettings(updated);
      return updated;
    });
  }, []);

  // Camera and Audio stream management
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
  });

  // Attach media stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Video Recorder Hook
  const handleRecordingComplete = useCallback(
    (recordingData: RecordedVideoData) => {
      setCurrentReviewTake(recordingData);
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
    audioFeedbackBeep: settings.audioFeedbackBeep,
  });

  // Trigger Start Recording workflow
  const handleStartRecording = useCallback(() => {
    if (!stream) {
      retryPermissions();
      return;
    }

    triggerStartRecording(stream, settings.countdownSec);

    if (settings.autoScrollOnRecord) {
      if (settings.countdownSec > 0) {
        setTimeout(() => {
          setIsPrompterPlaying(true);
        }, settings.countdownSec * 1000);
      } else {
        setIsPrompterPlaying(true);
      }
    }
  }, [retryPermissions, settings.autoScrollOnRecord, settings.countdownSec, stream, triggerStartRecording]);

  // Script Actions
  const handleSelectScript = (id: string) => {
    const found = scripts.find((s) => s.id === id);
    if (found) {
      setCurrentScript(found);
    }
  };

  const handleUpdateScript = async (updatedFields: Partial<Script>) => {
    if (!currentScript) return;
    const updated: Script = {
      ...currentScript,
      ...updatedFields,
      updatedAt: Date.now(),
    };
    setCurrentScript(updated);
    setScripts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    await storageService.saveScript(updated);
  };

  const handleNewScript = async () => {
    const newScript: Script = {
      id: `script_${Date.now()}`,
      title: 'New Script',
      content: 'Write or paste your presentation script here...',
      category: 'custom',
      wordCount: 8,
      estimatedDurationSec: 4,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [newScript, ...scripts];
    setScripts(updated);
    setCurrentScript(newScript);
    await storageService.saveScript(newScript);
    setViewMode('editor');
  };

  const handleDuplicateScript = async (script: Script) => {
    const duplicated: Script = {
      ...script,
      id: `script_${Date.now()}`,
      title: `${script.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [duplicated, ...scripts];
    setScripts(updated);
    setCurrentScript(duplicated);
    await storageService.saveScript(duplicated);
  };

  const handleDeleteScript = async (id: string) => {
    if (scripts.length <= 1) return;
    await storageService.deleteScript(id);
    const filtered = scripts.filter((s) => s.id !== id);
    setScripts(filtered);
    setCurrentScript(filtered[0] || null);
  };

  // Recording History Actions
  const handleSaveToHistory = async (rec: RecordedVideoData, savedPath?: string) => {
    const historyItem: RecordingHistoryItem = {
      id: `rec_${rec.timestamp}`,
      scriptId: currentScript?.id || 'unknown',
      scriptTitle: currentScript?.title || 'Take',
      durationSec: rec.durationSec,
      fileSizeBytes: rec.fileSizeBytes,
      mimeType: rec.mimeType,
      fileName: `PromptStudio_${currentScript?.title || 'Take'}_${Date.now()}.mp4`,
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

  // Floating window launch
  const handleLaunchFloatingWindow = () => {
    if (isElectron && window.promptStudioDesktop?.toggleFloatingOverlay) {
      window.promptStudioDesktop.toggleFloatingOverlay({
        scriptContent: currentScript?.content || '',
        settings,
      });
    } else {
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
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPrompterPlaying((p) => !p);
      }

      if (e.key === 'r' || e.key === 'R') {
        setIsPrompterPlaying(false);
      }

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

      if (e.key === 'f' || e.key === 'F') {
        handleUpdateSettings({ focusModeDim: !settings.focusModeDim });
      }

      if (e.key === 'm' || e.key === 'M') {
        handleUpdateSettings({ mirrorPrompter: !settings.mirrorPrompter });
      }

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
    <div className="flex flex-col h-screen w-screen bg-[#111214] text-[#F1F1F2] overflow-hidden font-sans select-none">
      {/* 1. Compact Top Application Toolbar (56px) */}
      <StudioHeader
        currentScript={currentScript}
        scripts={scripts}
        onSelectScript={handleSelectScript}
        onNewScript={handleNewScript}
        onUpdateScriptTitle={(title) => handleUpdateScript({ title })}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onLaunchFloatingWindow={handleLaunchFloatingWindow}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={recordingHistory.length}
        isElectron={isElectron}
        videoDevices={videoDevices}
        audioDevices={audioDevices}
        currentVideoDevice={currentVideoDevice}
        currentAudioDevice={currentAudioDevice}
        onSelectVideoDevice={switchVideoDevice}
        onSelectAudioDevice={switchAudioDevice}
        recorderState={recorderState}
        onTriggerRecord={handleStartRecording}
        onStopRecord={stopRecording}
      />

      {/* 2. Main Workspace */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {viewMode === 'studio' ? (
          <>
            {/* Live Camera Preview & Prompter Stage */}
            <StudioStage
              stream={stream}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              scriptContent={currentScript?.content || ''}
              currentScript={currentScript}
              onUpdateScript={handleUpdateScript}
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

            {/* Bottom Professional Recording Strip (56px) */}
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
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              audioLevel={audioLevel}
              elapsedSeconds={elapsedSeconds}
            />
          </>
        ) : (
          currentScript && (
            <ScriptEditorView
              script={currentScript}
              onUpdateScript={handleUpdateScript}
              onDuplicateScript={handleDuplicateScript}
              onDeleteScript={handleDeleteScript}
              onReturnToStudio={() => setViewMode('studio')}
              wordsPerMinute={settings.wordsPerMinute}
            />
          )
        )}
      </main>

      {/* Settings Inspector Drawer */}
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

      {/* Keyboard Shortcuts Sheet */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Recording Review & MP4 Export Modal */}
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

export function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const isFloatingMode = searchParams.get('mode') === 'floating';

  if (isFloatingMode) {
    return <FloatingPrompterView />;
  }

  return <StudioApp />;
}

export default App;
