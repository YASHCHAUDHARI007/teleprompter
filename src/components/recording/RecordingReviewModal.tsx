import React, { useState } from 'react';
import type { RecordedVideoData } from '../../hooks/useVideoRecorder';
import type { Script, StudioSettings } from '../../types';
import { saveRecordingVideo, type SaveResult } from '../../services/fileSaver';
import {
  X,
  Folder,
  RotateCcw,
  CheckCircle,
  HardDrive,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface RecordingReviewModalProps {
  recording: RecordedVideoData | null;
  script: Script | null;
  settings: StudioSettings;
  onClose: () => void;
  onTakeAnother: () => void;
  onSaveToHistory: (rec: RecordedVideoData, savedPath?: string) => void;
  isElectron: boolean;
}

export const RecordingReviewModal: React.FC<RecordingReviewModalProps> = ({
  recording,
  script,
  settings,
  onClose,
  onTakeAnother,
  onSaveToHistory,
  isElectron,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveResult | null>(null);

  if (!recording) return null;

  const fileSizeMB = (recording.fileSizeBytes / (1024 * 1024)).toFixed(2);
  const mins = Math.floor(recording.durationSec / 60);
  const secs = recording.durationSec % 60;
  const formattedDuration = `${mins}:${String(secs).padStart(2, '0')}`;

  const handleSaveToDesktop = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const result = await saveRecordingVideo(
        recording.blob,
        undefined,
        script?.title
      );

      setSaveStatus(result);

      if (result.success) {
        onSaveToHistory(recording, result.filePath);
      }
    } catch (err: any) {
      setSaveStatus({
        success: false,
        method: 'browser-download',
        fileName: 'take.webm',
        error: err.message || 'Error saving file',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn select-none">
      <div className="max-w-3xl w-full bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#141d2e]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Recording Complete</h2>
              <p className="text-xs text-slate-400">
                Review your take and export directly to your Desktop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Preview Area */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative w-full max-h-[50vh] aspect-video bg-black rounded-2xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center">
            <video
              src={recording.blobUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>

          {/* Stats Badges */}
          <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 bg-slate-900/80 px-4 py-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Duration: <strong className="text-white font-mono">{formattedDuration}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>File Size: <strong className="text-white font-mono">{fileSizeMB} MB</strong></span>
            </div>
            <div className="text-slate-400">
              Format: <span className="text-blue-300 font-mono">WebM ({settings.resolution})</span>
            </div>
          </div>

          {/* Save Status Banner */}
          {saveStatus && (
            <div className="w-full mt-4">
              {saveStatus.success ? (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center space-x-3 text-emerald-200 text-xs">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-emerald-300">
                      Successfully saved!
                    </div>
                    <div className="text-slate-300 break-all mt-0.5">
                      {saveStatus.filePath || saveStatus.fileName}
                      {saveStatus.method === 'browser-download' && ' (Saved to your system Downloads folder)'}
                    </div>
                  </div>
                  {isElectron && saveStatus.filePath && (
                    <button
                      onClick={() => window.promptStudioDesktop?.openPathInFolder(saveStatus.filePath!)}
                      className="px-2.5 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-medium text-xs transition cursor-pointer flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Show in Finder</span>
                    </button>
                  )}
                </div>
              ) : saveStatus.userCancelled ? (
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 text-xs">
                  Save dialog was cancelled. You can click Save to Desktop anytime.
                </div>
              ) : (
                <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl flex items-center space-x-2 text-red-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{saveStatus.error || 'Failed to save recording.'}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onTakeAnother}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs sm:text-sm border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Record Another Take</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                disabled={isSaving}
                onClick={handleSaveToDesktop}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/30 border border-blue-400/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Folder className="w-4 h-4" />
                <span>
                  {isSaving
                    ? 'Saving Video...'
                    : isElectron
                    ? 'Save Directly to Desktop'
                    : 'Save Recording to Folder'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
