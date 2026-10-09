import React from 'react';
import type { StudioSettings, MediaDeviceInfoSimple } from '../../types';
import {
  X,
  Type,
  Eye,
  Camera,
  Video,
  Sliders,
  RotateCcw,
  Layers,
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
  isElectron,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#111827] border-l border-slate-800 shadow-2xl z-50 flex flex-col overflow-hidden animate-slideIn">
      {/* Header */}
      <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-[#141d2e]">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-white">Studio Settings</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Settings Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* SECTION 1: TELEPROMPTER TYPOGRAPHY */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Type className="w-4 h-4" />
            <span>Teleprompter Typography</span>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Font Size</span>
              <span className="font-mono text-blue-400">{settings.fontSize}px</span>
            </div>
            <input
              type="range"
              min="18"
              max="72"
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Text Width */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Reading Column Width</span>
              <span className="font-mono text-blue-400">{settings.textWidthPercent}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              value={settings.textWidthPercent}
              onChange={(e) => onUpdateSettings({ textWidthPercent: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Line Height */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Line Spacing</span>
              <span className="font-mono text-blue-400">{settings.lineHeight.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1.2"
              max="2.4"
              step="0.1"
              value={settings.lineHeight}
              onChange={(e) => onUpdateSettings({ lineHeight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Font Family */}
          <div>
            <label className="text-xs text-slate-300 block mb-1.5">Font Style</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Inter', label: 'Inter Sans' },
                { name: 'Outfit', label: 'Outfit' },
                { name: 'JetBrains Mono', label: 'Mono' },
              ].map((f) => (
                <button
                  key={f.name}
                  onClick={() => onUpdateSettings({ fontFamily: f.name })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    settings.fontFamily === f.name
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="text-xs text-slate-300 block mb-1.5">Text Alignment</label>
            <div className="grid grid-cols-3 gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdateSettings({ textAlign: align })}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium border transition cursor-pointer ${
                    settings.textAlign === align
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: EYE-LINE & READING GUIDES */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Eye className="w-4 h-4" />
            <span>Eye-Contact & Reading Guide</span>
          </div>

          {/* Guide Style */}
          <div>
            <label className="text-xs text-slate-300 block mb-1.5">Reading Guide Style</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['band', 'line', 'arrow', 'none'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => onUpdateSettings({ readingGuideStyle: g })}
                  className={`px-2 py-1.5 rounded-lg text-xs capitalize font-medium border transition cursor-pointer ${
                    settings.readingGuideStyle === g
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Eye Line Position */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Eye-Line Height (Distance from top)</span>
              <span className="font-mono text-blue-400">{settings.readingGuidePosition}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="55"
              value={settings.readingGuidePosition}
              onChange={(e) => onUpdateSettings({ readingGuidePosition: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Keep around 25-30% to read text directly adjacent to your laptop/monitor webcam.
            </p>
          </div>

          {/* Focus Mode Dim */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div>
              <div className="text-xs font-semibold text-slate-200">Focus Mode Dimmer</div>
              <div className="text-[11px] text-slate-400">Dims text outside active eye line</div>
            </div>
            <input
              type="checkbox"
              checked={settings.focusModeDim}
              onChange={(e) => onUpdateSettings({ focusModeDim: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
          </div>

          {/* Mirrored Prompter Text */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div>
              <div className="text-xs font-semibold text-slate-200">Mirror Prompter Text</div>
              <div className="text-[11px] text-slate-400">Horizontal flip for optical prompter glass</div>
            </div>
            <input
              type="checkbox"
              checked={settings.mirrorPrompter}
              onChange={(e) => onUpdateSettings({ mirrorPrompter: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
          </div>
        </div>

        {/* SECTION 3: OPACITY & SCRIM */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Layers className="w-4 h-4" />
            <span>Overlay Opacity & Contrast</span>
          </div>

          {/* Background Scrim Opacity */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Background Scrim Tint</span>
              <span className="font-mono text-blue-400">
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
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              0% is completely clear; 35% gives high contrast against bright camera backgrounds.
            </p>
          </div>

          {/* Text Opacity */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Text Opacity</span>
              <span className="font-mono text-blue-400">
                {Math.round(settings.textOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={settings.textOpacity}
              onChange={(e) => onUpdateSettings({ textOpacity: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* SECTION 4: CAMERA & MICROPHONE */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Camera className="w-4 h-4" />
            <span>Camera & Microphone Devices</span>
          </div>

          {/* Video Device Picker */}
          <div>
            <label className="text-xs text-slate-300 block mb-1">Webcam Input</label>
            <select
              value={currentVideoDevice}
              onChange={(e) => onSelectVideoDevice(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 text-xs rounded-xl p-2.5 border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              {videoDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Device Picker */}
          <div>
            <label className="text-xs text-slate-300 block mb-1">Microphone Input</label>
            <select
              value={currentAudioDevice}
              onChange={(e) => onSelectAudioDevice(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 text-xs rounded-xl p-2.5 border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              {audioDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="text-xs text-slate-300 block mb-1.5">Camera Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
              {(['16:9', '4:3', 'fill'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => onUpdateSettings({ aspectRatio: ratio })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    settings.aspectRatio === ratio
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Framing Guide */}
          <div>
            <label className="text-xs text-slate-300 block mb-1.5">Framing Overlay Guide</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'None' },
                { id: 'ruleOfThirds', label: '3rds Grid' },
                { id: 'centerCross', label: 'Crosshair' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onUpdateSettings({ framingGuide: item.id as any })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    settings.framingGuide === item.id
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mirror Preview */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div>
              <div className="text-xs font-semibold text-slate-200">Mirror Camera Preview</div>
              <div className="text-[11px] text-slate-400">Flips live preview for natural selfie framing</div>
            </div>
            <input
              type="checkbox"
              checked={settings.mirrorPreview}
              onChange={(e) => onUpdateSettings({ mirrorPreview: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
          </div>
        </div>

        {/* SECTION 5: RECORDING & EXPORT */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Video className="w-4 h-4" />
            <span>Recording Engine</span>
          </div>

          {/* Auto-scroll on record start */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div>
              <div className="text-xs font-semibold text-slate-200">Auto-Scroll On Record</div>
              <div className="text-[11px] text-slate-400">Begins scrolling automatically after countdown</div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoScrollOnRecord}
              onChange={(e) => onUpdateSettings({ autoScrollOnRecord: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
          </div>

          {/* Audio Beeps */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div>
              <div className="text-xs font-semibold text-slate-200">Audio Countdown Cues</div>
              <div className="text-[11px] text-slate-400">Beeps during pre-recording countdown</div>
            </div>
            <input
              type="checkbox"
              checked={settings.audioFeedbackBeep}
              onChange={(e) => onUpdateSettings({ audioFeedbackBeep: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
          </div>

          {/* Export Mode Info */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div className="text-slate-300 font-medium">Export Destination</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isElectron
                ? 'Desktop Mode: Direct export to ~/Desktop/PromptStudio_Recordings with native confirmation'
                : 'Web Mode: File System Access API picker with direct folder saving and instant downloads'}
            </div>
          </div>

          {/* Reset to defaults button */}
          <div className="pt-2">
            <button
              onClick={() => onUpdateSettings(DEFAULT_SETTINGS)}
              className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Settings to Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
