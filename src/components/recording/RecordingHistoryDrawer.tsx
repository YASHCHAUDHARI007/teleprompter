import React, { useState } from 'react';
import type { RecordingHistoryItem } from '../../types';
import {
  X,
  Play,
  Trash2,
  Folder,
  Film,
  Download,
} from 'lucide-react';

interface RecordingHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recordings: RecordingHistoryItem[];
  onDeleteRecording: (id: string) => void;
  isElectron: boolean;
}

export const RecordingHistoryDrawer: React.FC<RecordingHistoryDrawerProps> = ({
  isOpen,
  onClose,
  recordings,
  onDeleteRecording,
  isElectron,
}) => {
  const [activePreview, setActivePreview] = useState<RecordingHistoryItem | null>(null);

  if (!isOpen) return null;

  const handleOpenInFolder = (filePath?: string) => {
    if (filePath && window.promptStudioDesktop?.openPathInFolder) {
      window.promptStudioDesktop.openPathInFolder(filePath);
    }
  };

  const handleDownload = (rec: RecordingHistoryItem) => {
    if (!rec.blob) return;
    const url = URL.createObjectURL(rec.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = rec.fileName.endsWith('.mp4') ? rec.fileName : `${rec.fileName}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#1D1F23] border-l border-[#303238] shadow-2xl z-50 flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="h-14 px-4 border-b border-[#303238] flex items-center justify-between bg-[#111214]">
        <div className="flex items-center space-x-2">
          <Film className="w-4 h-4 text-[#8EA9FF]" />
          <h2 className="text-xs font-semibold text-[#F1F1F2]">
            Recording History ({recordings.length})
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#9699A1] hover:text-[#F1F1F2] hover:bg-[#24262B] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Video Preview Popup if Selected */}
      {activePreview && (
        <div className="p-3 bg-[#111214] border-b border-[#303238] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#F1F1F2]">
            <span className="truncate pr-2 font-medium">{activePreview.scriptTitle}</span>
            <button
              onClick={() => setActivePreview(null)}
              className="text-[#9699A1] hover:text-[#F1F1F2] text-[11px]"
            >
              Close Preview
            </button>
          </div>
          <div className="aspect-video bg-black rounded overflow-hidden">
            <video
              src={activePreview.blobUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Takes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {recordings.length === 0 ? (
          <div className="py-20 text-center text-[#9699A1] text-xs">
            <Film className="w-8 h-8 text-[#646770] mx-auto mb-2 opacity-50" />
            <p>No takes recorded yet.</p>
            <p className="text-[11px] text-[#646770] mt-1">Completed video takes will appear here.</p>
          </div>
        ) : (
          recordings.map((rec) => {
            const dateStr = new Date(rec.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const sizeMB = (rec.fileSizeBytes / (1024 * 1024)).toFixed(1);
            const mins = Math.floor(rec.durationSec / 60);
            const secs = rec.durationSec % 60;
            const durStr = `${mins}:${String(secs).padStart(2, '0')}`;

            return (
              <div
                key={rec.id}
                className="p-2.5 rounded bg-[#17181B] border border-[#303238] space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="truncate pr-2">
                    <p className="text-[#F1F1F2] font-medium truncate">{rec.scriptTitle}</p>
                    <p className="text-[11px] text-[#9699A1] font-mono truncate">{rec.fileName}</p>
                  </div>
                  <button
                    onClick={() => onDeleteRecording(rec.id)}
                    className="p-1 text-[#9699A1] hover:text-[#FF5C57] transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#646770]">
                  <div className="flex items-center space-x-2 text-[#9699A1]">
                    <span>{durStr}</span>
                    <span>•</span>
                    <span>{sizeMB} MB</span>
                    <span>•</span>
                    <span className="text-[#30D158]">MP4</span>
                  </div>
                  <span>{dateStr}</span>
                </div>

                <div className="flex items-center justify-end space-x-1 pt-1 border-t border-[#303238]">
                  {rec.blobUrl && (
                    <button
                      onClick={() => setActivePreview(rec)}
                      className="px-2 py-1 rounded bg-[#24262B] hover:bg-[#303238] text-xs text-[#F1F1F2] flex items-center space-x-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 text-[#8EA9FF]" />
                      <span>Play</span>
                    </button>
                  )}

                  {isElectron && rec.savedToDiskPath && (
                    <button
                      onClick={() => handleOpenInFolder(rec.savedToDiskPath)}
                      className="px-2 py-1 rounded bg-[#24262B] hover:bg-[#303238] text-xs text-[#F1F1F2] flex items-center space-x-1 cursor-pointer"
                      title="Reveal in Finder"
                    >
                      <Folder className="w-3 h-3 text-[#8EA9FF]" />
                      <span>Finder</span>
                    </button>
                  )}

                  {!isElectron && rec.blob && (
                    <button
                      onClick={() => handleDownload(rec)}
                      className="px-2 py-1 rounded bg-[#24262B] hover:bg-[#303238] text-xs text-[#F1F1F2] flex items-center space-x-1 cursor-pointer"
                      title="Download MP4"
                    >
                      <Download className="w-3 h-3 text-[#8EA9FF]" />
                      <span>Save</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
