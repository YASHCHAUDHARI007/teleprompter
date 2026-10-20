import React, { useState } from 'react';
import type { RecordedVideoData } from '../../hooks/useVideoRecorder';
import type { Script, StudioSettings } from '../../types';
import { saveRecordingVideo, generateRecordingFileName, type SaveResult } from '../../services/fileSaver';
import { type ConversionProgress } from '../../services/mp4Converter';
import {
  X,
  CheckCircle,
  HardDrive,
  Clock,
  RotateCcw,
  Film,
  Download,
  Folder,
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
  onClose,
  onTakeAnother,
  onSaveToHistory,
  isElectron,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveResult | null>(null);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);

  if (!recording) return null;

  const fileSizeMB = (recording.fileSizeBytes / (1024 * 1024)).toFixed(2);
  const mins = Math.floor(recording.durationSec / 60);
  const secs = recording.durationSec % 60;
  const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const defaultMp4Name = generateRecordingFileName('PromptStudio', script?.title);

  const handleSaveDefault = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    setConversionProgress({ ratio: 0.1, percent: 10, stage: 'Preparing MP4 export...' });

    try {
      const result = await saveRecordingVideo(
        recording.blob,
        defaultMp4Name,
        script?.title,
        {
          onProgress: (p) => setConversionProgress(p),
        }
      );

      setSaveStatus(result);

      if (result.success) {
        onSaveToHistory(recording, result.filePath);
      }
    } catch (err: any) {
      setSaveStatus({
        success: false,
        method: 'browser-download',
        fileName: defaultMp4Name,
        error: err.message || 'Error exporting MP4',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustom = async () => {
    if (isElectron && window.promptStudioDesktop?.showSaveDialog) {
      const { canceled, filePath } = await window.promptStudioDesktop.showSaveDialog(defaultMp4Name);
      if (canceled || !filePath) return;

      setIsSaving(true);
      setSaveStatus(null);

      try {
        const result = await saveRecordingVideo(
          recording.blob,
          defaultMp4Name,
          script?.title,
          {
            customDestinationPath: filePath,
            onProgress: (p) => setConversionProgress(p),
          }
        );
        setSaveStatus(result);
        if (result.success) {
          onSaveToHistory(recording, result.filePath);
        }
      } catch (err: any) {
        setSaveStatus({
          success: false,
          method: 'desktop-direct',
          fileName: defaultMp4Name,
          error: err.message || 'Save failed',
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      handleSaveDefault();
    }
  };

  const handleOpenFolder = (path?: string) => {
    if (path && window.promptStudioDesktop?.openPathInFolder) {
      window.promptStudioDesktop.openPathInFolder(path);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="max-w-2xl w-full bg-[#17181B] border border-[#303238] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-12 px-4 border-b border-[#303238] flex items-center justify-between bg-[#111214]">
          <div className="flex items-center space-x-2">
            <Film className="w-4 h-4 text-[#8EA9FF]" />
            <h2 className="text-xs font-semibold text-[#F1F1F2]">Review Take & Export MP4</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#9699A1] hover:text-[#F1F1F2] rounded hover:bg-[#1D1F23] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Preview Area */}
        <div className="p-4 space-y-3">
          <div className="relative w-full aspect-video bg-[#0D0E10] rounded border border-[#303238] overflow-hidden flex items-center justify-center">
            <video
              src={recording.blobUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>

          {/* Stats Badges */}
          <div className="flex items-center justify-between text-xs text-[#9699A1] bg-[#111214] border border-[#303238] px-3 py-2 rounded">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8EA9FF]" />
              <span>Duration: <strong className="text-[#F1F1F2] font-mono">{formattedDuration}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[#8EA9FF]" />
              <span>Size: <strong className="text-[#F1F1F2] font-mono">{fileSizeMB} MB</strong></span>
            </div>
            <div className="flex items-center space-x-1 text-[#30D158] font-medium">
              <span>Codec: H.264 / AAC (MP4)</span>
            </div>
          </div>

          {/* Encoding Progress Bar */}
          {isSaving && conversionProgress && (
            <div className="p-3 bg-[#111214] border border-[#303238] rounded space-y-1.5 text-xs">
              <div className="flex justify-between text-[#9699A1]">
                <span>{conversionProgress.stage}</span>
                <span className="font-mono text-[#8EA9FF]">{conversionProgress.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#1D1F23] rounded overflow-hidden">
                <div
                  className="h-full bg-[#8EA9FF] transition-all duration-150"
                  style={{ width: `${conversionProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Save Status Banner */}
          {saveStatus && (
            <div
              className={`p-3 rounded border text-xs flex items-center justify-between ${
                saveStatus.success
                  ? 'bg-[#1D1F23] border-[#30D158]/40 text-[#F1F1F2]'
                  : saveStatus.userCancelled
                  ? 'bg-[#1D1F23] border-[#303238] text-[#9699A1]'
                  : 'bg-[#1D1F23] border-[#FF5C57]/40 text-[#FF5C57]'
              }`}
            >
              <div className="flex items-center space-x-2 truncate pr-2">
                {saveStatus.success && <CheckCircle className="w-4 h-4 text-[#30D158] shrink-0" />}
                <div className="truncate">
                  {saveStatus.success ? (
                    <div>
                      <p className="font-medium text-[#30D158]">MP4 successfully exported!</p>
                      <p className="text-[11px] text-[#9699A1] font-mono truncate">{saveStatus.fileName}</p>
                    </div>
                  ) : saveStatus.userCancelled ? (
                    <p>Save cancelled.</p>
                  ) : (
                    <p>{saveStatus.error || 'Failed to save recording'}</p>
                  )}
                </div>
              </div>

              {saveStatus.success && isElectron && saveStatus.filePath && (
                <button
                  onClick={() => handleOpenFolder(saveStatus.filePath)}
                  className="px-2 py-1 rounded bg-[#24262B] hover:bg-[#303238] text-[#8EA9FF] text-[11px] font-medium flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <Folder className="w-3 h-3" />
                  <span>Show in Finder</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-4 py-3 bg-[#111214] border-t border-[#303238] flex items-center justify-between">
          <button
            onClick={onTakeAnother}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded hover:bg-[#1D1F23] text-xs text-[#9699A1] hover:text-[#F1F1F2] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake</span>
          </button>

          <div className="flex items-center space-x-2">
            {isElectron && (
              <button
                onClick={handleSaveCustom}
                disabled={isSaving}
                className="px-3 py-1.5 rounded border border-[#303238] bg-[#17181B] hover:bg-[#1D1F23] text-xs text-[#F1F1F2] font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Save As...
              </button>
            )}

            <button
              onClick={handleSaveDefault}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-[#8EA9FF] hover:bg-[#A6BCFF] text-[#111214] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isElectron ? 'Save MP4 to Desktop' : 'Save MP4'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
