import React from 'react';
import type { StudioSettings, MediaDeviceInfoSimple } from '../../types';
import {
  X,
  Type,
  Video,
  Sliders,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { DEFAULT_SETTINGS } from '../../services/defaultSettings';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StudioSettings;
  onUpdateSettings: (partial: Partial<StudioSettings>) => void;
  videoDevices: MediaDeviceInfoSimple[];
  audioDevices: MediaDeviceInfoSimple[];
  currentVideoDevice: string;
  currentAudioDevice: string;
  onSelectVideoDevice: (deviceId: string) => void;
  onSelectAudioDevice: (deviceId: string) => void;
  isElectron: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  videoDevices,
  audioDevices,
  currentVideoDevice,
  currentAudioDevice,
  onSelectVideoDevice,
  onSelectAudioDevice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#1D1F23] border-l border-[#303238] shadow-2xl z-50 flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="h-14 px-4 border-b border-[#303238] flex items-center justify-between bg-[#111214]">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-[#8EA9FF]" />
          <h2 className="text-xs font-semibold text-[#F1F1F2]">Preferences & Hardware</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#9699A1] hover:text-[#F1F1F2] hover:bg-[#24262B] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs text-[#9699A1]">
        {/* Hardware Devices */}
        <div className="space-y-3">
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-[#F1F1F2] uppercase tracking-wider">
            <Video className="w-3.5 h-3.5 text-[#8EA9FF]" />
            <span>Capture Devices</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#F1F1F2]">Camera Source</label>
            <select
              value={currentVideoDevice}
              onChange={(e) => onSelectVideoDevice(e.target.value)}
              className="w-full bg-[#17181B] border border-[#303238] rounded px-2.5 py-1.5 text-xs text-[#F1F1F2] focus:outline-none"
            >
              {videoDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || 'Default Webcam'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#F1F1F2]">Microphone Source</label>
            <select
              value={currentAudioDevice}
              onChange={(e) => onSelectAudioDevice(e.target.value)}
              className="w-full bg-[#17181B] border border-[#303238] rounded px-2.5 py-1.5 text-xs text-[#F1F1F2] focus:outline-none"
            >
              {audioDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || 'Default Microphone'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#F1F1F2]">Camera Framing Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-1">
              {(['16:9', '4:3', 'fill'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => onUpdateSettings({ aspectRatio: ratio })}
                  className={`py-1 text-xs rounded border transition-colors cursor-pointer ${
                    settings.aspectRatio === ratio
                      ? 'bg-[#24262B] border-[#8EA9FF] text-[#F1F1F2]'
                      : 'border-[#303238] text-[#9699A1] hover:text-[#F1F1F2]'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px bg-[#303238]" />

        {/* Teleprompter Defaults */}
        <div className="space-y-3">
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-[#F1F1F2] uppercase tracking-wider">
            <Type className="w-3.5 h-3.5 text-[#8EA9FF]" />
            <span>Teleprompter Typography</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#F1F1F2]">Font Family</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => onUpdateSettings({ fontFamily: e.target.value })}
              className="w-full bg-[#17181B] border border-[#303238] rounded px-2.5 py-1.5 text-xs text-[#F1F1F2] focus:outline-none"
            >
              <option value="Inter, sans-serif">Inter (Modern Clean)</option>
              <option value="-apple-system, BlinkMacSystemFont, sans-serif">SF Pro / System</option>
              <option value="Georgia, serif">Georgia (Editorial)</option>
              <option value="'JetBrains Mono', monospace">JetBrains Mono (Technical)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#F1F1F2] font-medium">Speaking Speed Benchmark</span>
              <span className="font-mono text-[#8EA9FF]">{settings.wordsPerMinute} WPM</span>
            </div>
            <input
              type="range"
              min="100"
              max="200"
              step="5"
              value={settings.wordsPerMinute}
              onChange={(e) => onUpdateSettings({ wordsPerMinute: parseInt(e.target.value) })}
              className="w-full h-1 bg-[#24262B] rounded appearance-none cursor-pointer accent-[#8EA9FF]"
            />
            <p className="text-[10px] text-[#646770]">Average conversational pace is 130–145 words per minute.</p>
          </div>
        </div>

        <div className="h-px bg-[#303238]" />

        {/* Recording Behavior */}
        <div className="space-y-3">
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-[#F1F1F2] uppercase tracking-wider">
            <Volume2 className="w-3.5 h-3.5 text-[#8EA9FF]" />
            <span>Recording Behavior</span>
          </div>

          <label className="flex items-center justify-between p-2 rounded bg-[#17181B] border border-[#303238] cursor-pointer">
            <span className="text-xs text-[#F1F1F2]">Auto-Scroll Teleprompter on Record</span>
            <input
              type="checkbox"
              checked={settings.autoScrollOnRecord}
              onChange={(e) => onUpdateSettings({ autoScrollOnRecord: e.target.checked })}
              className="accent-[#8EA9FF] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded bg-[#17181B] border border-[#303238] cursor-pointer">
            <span className="text-xs text-[#F1F1F2]">Audio Feedback Countdown Chimes</span>
            <input
              type="checkbox"
              checked={settings.audioFeedbackBeep}
              onChange={(e) => onUpdateSettings({ audioFeedbackBeep: e.target.checked })}
              className="accent-[#8EA9FF] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded bg-[#17181B] border border-[#303238] cursor-pointer">
            <span className="text-xs text-[#F1F1F2]">Mirror Recorded Output Video</span>
            <input
              type="checkbox"
              checked={settings.mirrorRecordedVideo}
              onChange={(e) => onUpdateSettings({ mirrorRecordedVideo: e.target.checked })}
              className="accent-[#8EA9FF] cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Footer Reset Button */}
      <div className="p-3 border-t border-[#303238] bg-[#111214] flex justify-end">
        <button
          onClick={() => onUpdateSettings(DEFAULT_SETTINGS)}
          className="flex items-center space-x-1 text-[11px] text-[#9699A1] hover:text-[#F1F1F2] cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
      </div>
    </div>
  );
};
