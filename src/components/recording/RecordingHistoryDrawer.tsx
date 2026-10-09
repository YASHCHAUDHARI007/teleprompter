import React, { useState } from 'react';
import type { RecordingHistoryItem } from '../../types';
import {
  X,
  History,
  Play,
  Download,
  Trash2,
  HardDrive,
  Clock,
  Film,
  ExternalLink,
} from 'lucide-react';
import { saveRecordingVideo } from '../../services/fileSaver';

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
  const [playingItem, setPlayingItem] = useState<RecordingHistoryItem | null>(null);

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${String(remainder).padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadItem = async (item: RecordingHistoryItem) => {
    if (item.blob) {
      await saveRecordingVideo(item.blob, item.fileName, item.scriptTitle);
    } else if (item.blobUrl) {
      const a = document.createElement('a');
      a.href = item.blobUrl;
      a.download = item.fileName;
      a.click();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-[#111827] border-l border-slate-800 shadow-2xl z-50 flex flex-col overflow-hidden animate-slideIn select-none">
      {/* Header */}
      <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-[#141d2e]">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">Takes History</h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {recordings.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video Preview Popup if an item is selected for playback */}
      {playingItem && (
        <div className="p-4 bg-black/90 border-b border-slate-800 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 truncate">
              Preview: {playingItem.fileName}
            </span>
            <button
              onClick={() => setPlayingItem(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
            >
              Close Player
            </button>
          </div>
          <video
            src={playingItem.blobUrl || (playingItem.blob ? URL.createObjectURL(playingItem.blob) : '')}
            controls
            autoPlay
            className="w-full max-h-48 rounded-xl bg-black border border-slate-800"
          />
        </div>
      )}

      {/* Recordings list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {recordings.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center space-y-3 text-slate-500">
            <Film className="w-10 h-10 text-slate-600" />
            <p className="text-sm font-medium">No recorded takes yet.</p>
            <p className="text-xs text-slate-500">
              Record your first presentation take in the studio and it will be preserved here!
            </p>
          </div>
        ) : (
          recordings.map((rec) => {
            const sizeMB = (rec.fileSizeBytes / (1024 * 1024)).toFixed(1);
            return (
              <div
                key={rec.id}
                className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">
                      {rec.scriptTitle || 'Untitled Recording'}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {rec.fileName}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatDate(rec.timestamp)}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>{formatDuration(rec.durationSec)}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{sizeMB} MB</span>
                  </span>
                </div>

                {rec.savedToDiskPath && (
                  <div className="text-[10px] text-slate-400 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80 truncate">
                    Saved: {rec.savedToDiskPath}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <button
                    onClick={() => setPlayingItem(rec)}
                    className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadItem(rec)}
                      title="Save / Export Video"
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {isElectron && rec.savedToDiskPath && (
                      <button
                        onClick={() => window.promptStudioDesktop?.openPathInFolder(rec.savedToDiskPath!)}
                        title="Show in Finder / Folder"
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm('Delete this recording from history?')) {
                          onDeleteRecording(rec.id);
                        }
                      }}
                      title="Delete recording"
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
