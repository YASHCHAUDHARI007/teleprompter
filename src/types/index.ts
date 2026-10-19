export interface Script {
  id: string;
  title: string;
  content: string;
  category: 'presentation' | 'youtube' | 'talking-head' | 'pitch' | 'custom';
  wordCount: number;
  estimatedDurationSec: number;
  createdAt: number;
  updatedAt: number;
}

export type ReadingGuideStyle = 'line' | 'band' | 'arrow' | 'none';
export type TextAlignment = 'left' | 'center' | 'right';
export type AspectRatio = '16:9' | '4:3' | 'fill';
export type VideoResolution = '1080p' | '720p' | '4k';
export type RecordingMode = 'clean-camera' | 'composited-overlay';
export type FramingGuide = 'ruleOfThirds' | 'centerCross' | 'none';

export interface StudioSettings {
  // Teleprompter typography & layout
  fontSize: number; // in pixels (18 to 72)
  scrollSpeed: number; // 0.5 to 10.0
  lineHeight: number; // 1.2 to 2.4
  textWidthPercent: number; // 35% to 100%
  fontFamily: string; // 'Inter', 'Geist', 'system-ui'
  textColor: string; // hex
  textAlign: TextAlignment;
  textOpacity: number; // 0.4 to 1.0
  overlayBgOpacity: number; // 0.0 to 0.9 (scrim darkness)
  mirrorPrompter: boolean; // flip horizontally for optical beam-splitter mirrors

  // Reading Guide
  readingGuideStyle: ReadingGuideStyle;
  readingGuidePosition: number; // percentage from top (15% to 65%)
  focusModeDim: boolean; // dim text outside reading line

  // Camera & Audio
  selectedVideoDeviceId: string;
  selectedAudioDeviceId: string;
  aspectRatio: AspectRatio;
  resolution: VideoResolution;
  mirrorPreview: boolean; // preview mirrored for natural eye-contact
  mirrorRecordedVideo: boolean; // separate option to mirror recorded file
  framingGuide: FramingGuide;

  // Recording
  countdownSec: 0 | 3 | 5 | 10;
  autoScrollOnRecord: boolean;
  autoStopPrompterOnRecordEnd: boolean;
  recordingMode: RecordingMode;
  defaultSaveDirectoryName: string;
  audioFeedbackBeep: boolean;

  // Words per minute benchmark for speaking estimate
  wordsPerMinute: number; // default 135
}

export interface RecordingHistoryItem {
  id: string;
  scriptId: string;
  scriptTitle: string;
  durationSec: number;
  fileSizeBytes: number;
  mimeType: string;
  fileName: string;
  blob?: Blob;
  blobUrl?: string;
  timestamp: number;
  savedToDiskPath?: string;
}

export interface MediaDeviceInfoSimple {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface ElectronDesktopAPI {
  isElectron: boolean;
  convertAndSaveMp4: (options: {
    buffer: Uint8Array;
    fileName: string;
    targetPath?: string;
    subfolder?: string;
  }) => Promise<{ success: boolean; filePath?: string; fileName?: string; size?: number; error?: string }>;
  saveVideoToDesktop: (options: {
    buffer: Uint8Array;
    fileName: string;
    subfolder?: string;
  }) => Promise<{ success: boolean; filePath?: string; fileName?: string; size?: number; error?: string }>;
  showSaveDialog: (defaultFileName?: string) => Promise<{ canceled: boolean; filePath?: string }>;
  readFileBuffer: (filePath: string) => Promise<{ success: boolean; buffer?: ArrayBuffer | Uint8Array; error?: string }>;
  chooseDirectory: () => Promise<{ success: boolean; dirPath?: string; canceled?: boolean }>;
  getDesktopPath: () => Promise<string>;
  openPathInFolder: (filePath: string) => Promise<boolean>;
  toggleFloatingOverlay: (options: {
    scriptContent: string;
    settings: StudioSettings;
  }) => Promise<boolean>;
  setClickThrough: (enabled: boolean) => Promise<void>;
  setAlwaysOnTop: (enabled: boolean) => Promise<void>;
  syncPrompterState?: (state: { isPlaying: boolean; scrollProgress: number; speed: number }) => void;
  onPrompterCommand?: (callback: (command: string, payload?: any) => void) => () => void;
}

declare global {
  interface Window {
    promptStudioDesktop?: ElectronDesktopAPI;
  }
}
