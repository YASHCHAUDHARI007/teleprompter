import React, { useState } from 'react';
import type { Script, RecordingHistoryItem } from '../../types';
import {
  Video,
  FileText,
  Plus,
  Search,
  History,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface LeftSidebarProps {
  scripts: Script[];
  currentScriptId: string;
  onSelectScript: (script: Script) => void;
  onNewScript: () => void;
  onOpenSettings: () => void;
  recordingHistory: RecordingHistoryItem[];
  onOpenHistory: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  scripts,
  currentScriptId,
  onSelectScript,
  onNewScript,
  onOpenSettings,
  recordingHistory,
  onOpenHistory,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScripts = scripts.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#0d131f] border-r border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Video className="w-4 h-4" />
            </div>
            {isOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-white tracking-wide font-['Outfit']">
                  PromptStudio
                </span>
                <span className="text-[10px] text-blue-400 font-medium tracking-wider uppercase">
                  Teleprompter & Rec
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleOpen}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Button: New Script */}
        <div className="p-3">
          <button
            onClick={onNewScript}
            className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20 cursor-pointer active:scale-95 ${
              !isOpen && 'md:p-2.5 md:space-x-0'
            }`}
          >
            <Plus className="w-4 h-4" />
            {isOpen && <span>New Script</span>}
          </button>
        </div>

        {/* Search Bar */}
        {isOpen && (
          <div className="px-3 pb-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search scripts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Scripts List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {isOpen && (
            <div className="px-2 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              My Scripts ({filteredScripts.length})
            </div>
          )}

          {filteredScripts.map((s) => {
            const isSelected = s.id === currentScriptId;
            return (
              <button
                key={s.id}
                onClick={() => onSelectScript(s)}
                title={s.title}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-start space-x-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 border border-blue-500/40 text-blue-200'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                } ${!isOpen && 'md:justify-center md:px-0'}`}
              >
                <FileText
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    isSelected ? 'text-blue-400' : 'text-slate-500'
                  }`}
                />
                {isOpen && (
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{s.title}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{s.wordCount} words</span>
                      <span>•</span>
                      <span>~{Math.round(s.estimatedDurationSec / 60)}m</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          {filteredScripts.length === 0 && isOpen && (
            <div className="p-4 text-center text-xs text-slate-500">
              No matching scripts found.
            </div>
          )}
        </div>

        {/* Footer Navigation: Recording History & Settings */}
        <div className="p-3 border-t border-slate-800/80 space-y-1 bg-[#090d15]">
          <button
            onClick={onOpenHistory}
            className={`w-full flex items-center space-x-2.5 p-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer ${
              !isOpen && 'md:justify-center md:p-2'
            }`}
          >
            <History className="w-4 h-4 text-emerald-400" />
            {isOpen && (
              <div className="flex-1 flex items-center justify-between text-left">
                <span>Takes History</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {recordingHistory.length}
                </span>
              </div>
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className={`w-full flex items-center space-x-2.5 p-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer ${
              !isOpen && 'md:justify-center md:p-2'
            }`}
          >
            <Sliders className="w-4 h-4 text-blue-400" />
            {isOpen && <span>Settings</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
