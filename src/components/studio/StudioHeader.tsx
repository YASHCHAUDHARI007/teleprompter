import React, { useState, useRef, useEffect } from 'react';
import type { Script, MediaDeviceInfoSimple } from '../../types';
import type { RecorderState } from '../../hooks/useVideoRecorder';
import {
  Video,
  Mic,
  Sliders,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronDown,
  Plus,
  Check,
  Circle,
  FileText,
  Clock,
  Square,
  Radio,
} from 'lucide-react';

interface StudioHeaderProps {
  currentScript: Script | null;
  scripts: Script[];
  onSelectScript: (id: string) => void;
  onNewScript: () => void;
  onUpdateScriptTitle: (title: string) => void;
  viewMode: 'studio' | 'editor';
  onChangeViewMode: (mode: 'studio' | 'editor') => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onLaunchFloatingWindow: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  isElectron: boolean;
  videoDevices: MediaDeviceInfoSimple[];
  audioDevices: MediaDeviceInfoSimple[];
  currentVideoDevice: string;
  currentAudioDevice: string;
  onSelectVideoDevice: (deviceId: string) => void;
  onSelectAudioDevice: (deviceId: string) => void;
  recorderState: RecorderState;
  onTriggerRecord: () => void;
  onStopRecord: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  currentScript,
  scripts,
  onSelectScript,
  onNewScript,
  onUpdateScriptTitle,
  viewMode,
  onChangeViewMode,
  isFullscreen,
  onToggleFullscreen,
  onLaunchFloatingWindow,
  onOpenSettings,
  onOpenHistory,
  historyCount,
  videoDevices,
  audioDevices,
  currentVideoDevice,
  currentAudioDevice,
  onSelectVideoDevice,
  onSelectAudioDevice,
  recorderState,
  onTriggerRecord,
  onStopRecord,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(currentScript?.title || '');
  const [isScriptPickerOpen, setIsScriptPickerOpen] = useState(false);
  const [isCameraPickerOpen, setIsCameraPickerOpen] = useState(false);
  const [isMicPickerOpen, setIsMicPickerOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const scriptPickerRef = useRef<HTMLDivElement>(null);
  const cameraPickerRef = useRef<HTMLDivElement>(null);
  const micPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempTitle(currentScript?.title || '');
  }, [currentScript?.title]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (scriptPickerRef.current && !scriptPickerRef.current.contains(target)) {
        setIsScriptPickerOpen(false);
      }
      if (cameraPickerRef.current && !cameraPickerRef.current.contains(target)) {
        setIsCameraPickerOpen(false);
      }
      if (micPickerRef.current && !micPickerRef.current.contains(target)) {
        setIsMicPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && tempTitle !== currentScript?.title) {
      onUpdateScriptTitle(tempTitle.trim());
    } else {
      setTempTitle(currentScript?.title || 'Untitled Script');
    }
  };

  const currentVideoLabel =
    videoDevices.find((d) => d.deviceId === currentVideoDevice)?.label || 'Camera';
  const currentAudioLabel =
    audioDevices.find((d) => d.deviceId === currentAudioDevice)?.label || 'Microphone';

  const isRecording = recorderState === 'recording' || recorderState === 'paused';

  return (
    <header className="h-14 px-4 bg-[#111214] border-b border-[#303238] flex items-center justify-between select-none z-30 shrink-0">
      {/* LEFT: Wordmark + Script Title + Saved Status */}
      <div className="flex items-center space-x-3 min-w-0 max-w-[36%]">
        {/* App Wordmark */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-6 h-6 rounded bg-[#1D1F23] border border-[#303238] flex items-center justify-center text-[#8EA9FF]">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-xs tracking-tight text-[#F1F1F2]">
            PromptStudio
          </span>
        </div>

        <div className="h-3.5 w-px bg-[#303238] shrink-0" />

        {/* Script Selector & Inline Title */}
        <div className="relative min-w-0" ref={scriptPickerRef}>
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTempTitle(currentScript?.title || '');
                  setIsEditingTitle(false);
                }
              }}
              className="bg-[#1D1F23] border border-[#8EA9FF] rounded px-2 py-0.5 text-xs text-[#F1F1F2] focus:outline-none w-48 font-medium"
            />
          ) : (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setIsScriptPickerOpen((prev) => !prev)}
                className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#1D1F23] transition-colors text-xs font-medium text-[#F1F1F2] truncate max-w-[200px] cursor-pointer group"
                title="Select or switch script"
              >
                <span className="truncate">{currentScript?.title || 'Untitled Script'}</span>
                <ChevronDown className="w-3 h-3 text-[#9699A1] group-hover:text-[#F1F1F2] shrink-0" />
              </button>

              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-[11px] text-[#9699A1] hover:text-[#F1F1F2] px-1 py-0.5 rounded hover:bg-[#1D1F23] transition-colors cursor-pointer"
                title="Rename script"
              >
                Rename
              </button>
            </div>
          )}

          {/* Script Picker Dropdown Popover */}
          {isScriptPickerOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#1D1F23] border border-[#303238] rounded-md shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 border-b border-[#303238] flex items-center justify-between text-[11px] text-[#9699A1]">
                <span className="font-medium uppercase tracking-wider">Scripts ({scripts.length})</span>
                <button
                  onClick={() => {
                    setIsScriptPickerOpen(false);
                    onNewScript();
                  }}
                  className="flex items-center space-x-1 text-[#8EA9FF] hover:text-[#A6BCFF] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {scripts.map((script) => (
                  <button
                    key={script.id}
                    onClick={() => {
                      onSelectScript(script.id);
                      setIsScriptPickerOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#24262B] transition-colors cursor-pointer ${
                      script.id === currentScript?.id
                        ? 'text-[#8EA9FF] font-medium bg-[#24262B]/60'
                        : 'text-[#F1F1F2]'
                    }`}
                  >
                    <span className="truncate pr-2">{script.title}</span>
                    {script.id === currentScript?.id && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Saved status micro-dot */}
        <div className="hidden lg:flex items-center space-x-1 text-[11px] text-[#9699A1] shrink-0">
          <Circle className="w-1.5 h-1.5 fill-[#30D158] text-[#30D158]" />
          <span>Saved</span>
        </div>
      </div>

      {/* CENTER: Restrained Mode Selector (Studio / Script Editor / Overlay) */}
      <div className="flex items-center bg-[#17181B] border border-[#303238] rounded-md p-0.5 text-xs">
        <button
          onClick={() => onChangeViewMode('studio')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
            viewMode === 'studio'
              ? 'bg-[#1D1F23] text-[#F1F1F2] font-medium shadow-sm'
              : 'text-[#9699A1] hover:text-[#F1F1F2]'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Studio</span>
        </button>

        <button
          onClick={() => onChangeViewMode('editor')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
            viewMode === 'editor'
              ? 'bg-[#1D1F23] text-[#F1F1F2] font-medium shadow-sm'
              : 'text-[#9699A1] hover:text-[#F1F1F2]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Script Editor</span>
        </button>

        <button
          onClick={onLaunchFloatingWindow}
          className="flex items-center space-x-1.5 px-2.5 py-1 text-[#9699A1] hover:text-[#8EA9FF] transition-colors cursor-pointer"
          title="Open transparent floating teleprompter window over other desktop applications"
        >
          <ExternalLink className="w-3 h-3" />
          <span className="hidden sm:inline">Floating</span>
        </button>
      </div>

      {/* RIGHT: Camera / Mic Selectors + Inspector + Record Button */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Camera Selector Popover */}
        <div className="relative" ref={cameraPickerRef}>
          <button
            onClick={() => setIsCameraPickerOpen((prev) => !prev)}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded border border-[#303238] bg-[#17181B] hover:bg-[#1D1F23] text-xs text-[#9699A1] hover:text-[#F1F1F2] transition-colors cursor-pointer max-w-[130px]"
            title={`Active camera: ${currentVideoLabel}`}
          >
            <Video className="w-3.5 h-3.5 shrink-0 text-[#8EA9FF]" />
            <span className="truncate">{currentVideoLabel}</span>
            <ChevronDown className="w-3 h-3 shrink-0" />
          </button>

          {isCameraPickerOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#1D1F23] border border-[#303238] rounded-md shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 border-b border-[#303238] text-[11px] font-medium uppercase tracking-wider text-[#9699A1]">
                Select Camera
              </div>
              <div className="py-1">
                {videoDevices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => {
                      onSelectVideoDevice(device.deviceId);
                      setIsCameraPickerOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#24262B] transition-colors cursor-pointer ${
                      device.deviceId === currentVideoDevice
                        ? 'text-[#8EA9FF] font-medium bg-[#24262B]/60'
                        : 'text-[#F1F1F2]'
                    }`}
                  >
                    <span className="truncate pr-2">{device.label || 'Webcam'}</span>
                    {device.deviceId === currentVideoDevice && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Microphone Selector Popover */}
        <div className="relative" ref={micPickerRef}>
          <button
            onClick={() => setIsMicPickerOpen((prev) => !prev)}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded border border-[#303238] bg-[#17181B] hover:bg-[#1D1F23] text-xs text-[#9699A1] hover:text-[#F1F1F2] transition-colors cursor-pointer max-w-[130px]"
            title={`Active mic: ${currentAudioLabel}`}
          >
            <Mic className="w-3.5 h-3.5 shrink-0 text-[#8EA9FF]" />
            <span className="truncate">{currentAudioLabel}</span>
            <ChevronDown className="w-3 h-3 shrink-0" />
          </button>

          {isMicPickerOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#1D1F23] border border-[#303238] rounded-md shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 border-b border-[#303238] text-[11px] font-medium uppercase tracking-wider text-[#9699A1]">
                Select Microphone
              </div>
              <div className="py-1">
                {audioDevices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => {
                      onSelectAudioDevice(device.deviceId);
                      setIsMicPickerOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#24262B] transition-colors cursor-pointer ${
                      device.deviceId === currentAudioDevice
                        ? 'text-[#8EA9FF] font-medium bg-[#24262B]/60'
                        : 'text-[#F1F1F2]'
                    }`}
                  >
                    <span className="truncate pr-2">{device.label || 'Microphone'}</span>
                    {device.deviceId === currentAudioDevice && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Takes History Button */}
        <button
          onClick={onOpenHistory}
          className="relative p-2 rounded hover:bg-[#1D1F23] text-[#9699A1] hover:text-[#F1F1F2] transition-colors cursor-pointer"
          title="Past Takes History"
        >
          <Clock className="w-4 h-4" />
          {historyCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#8EA9FF]" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded hover:bg-[#1D1F23] text-[#9699A1] hover:text-[#F1F1F2] transition-colors cursor-pointer"
          title="Studio Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded hover:bg-[#1D1F23] text-[#9699A1] hover:text-[#F1F1F2] transition-colors cursor-pointer hidden md:flex"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Top Quick Record / Stop Button */}
        {isRecording ? (
          <button
            onClick={onStopRecord}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#FF5C57] hover:bg-[#E04B46] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Stop Take</span>
          </button>
        ) : (
          <button
            onClick={onTriggerRecord}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-[#FF5C57] hover:bg-[#E04B46] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Circle className="w-2.5 h-2.5 fill-white" />
            <span>Record</span>
          </button>
        )}
      </div>
    </header>
  );
};
