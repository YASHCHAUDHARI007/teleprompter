import type { StudioSettings } from '../types';

export const DEFAULT_SETTINGS: StudioSettings = {
  // Teleprompter typography & layout
  fontSize: 34,
  scrollSpeed: 3.2,
  lineHeight: 1.6,
  textWidthPercent: 70,
  fontFamily: 'Inter',
  textColor: '#f8fafc',
  textAlign: 'center',
  textOpacity: 1.0,
  overlayBgOpacity: 0.35, // sleek translucent dark scrim
  mirrorPrompter: false,

  // Reading Guide
  readingGuideStyle: 'band',
  readingGuidePosition: 28, // 28% from top aligns right next to typical laptop/desktop webcam
  focusModeDim: false,

  // Camera & Audio
  selectedVideoDeviceId: '',
  selectedAudioDeviceId: '',
  aspectRatio: '16:9',
  resolution: '1080p',
  mirrorPreview: true, // natural mirror view for selfie camera
  mirrorRecordedVideo: false, // keep output video standard orientation
  framingGuide: 'none',

  // Recording
  countdownSec: 3,
  autoScrollOnRecord: true,
  autoStopPrompterOnRecordEnd: true,
  recordingMode: 'clean-camera',
  defaultSaveDirectoryName: 'Desktop/PromptStudio_Recordings',
  audioFeedbackBeep: true,

  // Word rate
  wordsPerMinute: 135,
};
