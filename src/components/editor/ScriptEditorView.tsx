import React, { useRef, useState, useEffect } from 'react';
import type { Script } from '../../types';
import {
  Clock,
  Sparkles,
  Download,
  Upload,
  Copy,
  Trash2,
  Check,
} from 'lucide-react';

interface ScriptEditorViewProps {
  script: Script;
  onUpdateScript: (updated: Partial<Script>) => void;
  onDuplicateScript: (script: Script) => void;
  onDeleteScript: (id: string) => void;
  wordsPerMinute: number;
}

export const ScriptEditorView: React.FC<ScriptEditorViewProps> = ({
  script,
  onUpdateScript,
  onDuplicateScript,
  onDeleteScript,
  wordsPerMinute,
}) => {
  const [content, setContent] = useState(script.content);
  const [title, setTitle] = useState(script.title);
  const [isSaved, setIsSaved] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync incoming script changes
  useEffect(() => {
    setContent(script.content);
    setTitle(script.title);
  }, [script.id]);

  // Recalculate word count and duration when content changes
  const handleContentChange = (newText: string) => {
    setContent(newText);
    setIsSaved(false);

    // Calculate words
    const words = newText.trim() ? newText.trim().split(/\s+/).length : 0;
    const duration = Math.round((words / wordsPerMinute) * 60);

    onUpdateScript({
      content: newText,
      wordCount: words,
      estimatedDurationSec: duration,
      updatedAt: Date.now(),
    });

    setIsSaved(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onUpdateScript({
      title: newTitle,
      updatedAt: Date.now(),
    });
  };

  // Insert stage direction at cursor or end
  const insertStageDirection = (text: string) => {
    const textarea = document.getElementById('script-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);

    const inserted = `\n\n[${text}]\n\n`;
    const updated = before + inserted + after;
    handleContentChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + inserted.length;
    }, 50);
  };

  // Import .txt or .md file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleContentChange(text);
        if (!title || title === 'Untitled Script') {
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          handleTitleChange(cleanName);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Export script as plain text
  const handleExportText = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSpeakingTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}m ${remainder > 0 ? `${remainder}s` : ''}`;
  };

  return (
    <div className="flex-1 w-full h-full bg-[#0b0f17] flex flex-col overflow-hidden p-4 sm:p-6 select-none">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col bg-[#111827] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Editor Toolbar */}
        <div className="border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-[#141d2e]">
          {/* Title input */}
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Script Title..."
              className="w-full bg-transparent text-lg font-bold text-slate-100 focus:outline-none placeholder:text-slate-500"
            />
            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
              <span>{script.wordCount} words</span>
              <span>•</span>
              <span className="flex items-center space-x-1 text-blue-300">
                <Clock className="w-3.5 h-3.5" />
                <span>Estimated speaking time: {formatSpeakingTime(script.estimatedDurationSec)}</span>
              </span>
              <span>•</span>
              <span className={`${isSaved ? 'text-emerald-400' : 'text-amber-400'} flex items-center space-x-1`}>
                <Check className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Autosaved locally' : 'Saving...'}</span>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import .txt or .md script"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>

            <button
              onClick={handleExportText}
              title="Export script as .txt"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => onDuplicateScript(script)}
              title="Duplicate script"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${script.title}"?`)) {
                  onDeleteScript(script.id);
                }
              }}
              title="Delete script"
              className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stage Directions Helper Bar */}
        <div className="px-6 py-2.5 bg-[#0f172a] border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Insert Stage Cue:</span>
          </span>
          {[
            'Pause 2s',
            'Look at camera',
            'Smile',
            'Emphasize',
            'Deep breath',
            'Next slide',
          ].map((tag) => (
            <button
              key={tag}
              onClick={() => insertStageDirection(tag)}
              className="px-2.5 py-1 rounded-md bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 font-medium whitespace-nowrap transition cursor-pointer"
            >
              + [{tag}]
            </button>
          ))}
        </div>

        {/* Main Textarea */}
        <div className="flex-1 p-6 flex flex-col">
          <textarea
            id="script-textarea"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Type or paste your presentation, YouTube, or talking-head script here...&#10;&#10;Tip: Leave double line breaks between paragraphs for optimal teleprompter pacing. Insert stage directions in brackets like [Smile] or [Pause 2s]."
            className="flex-1 w-full bg-transparent text-slate-200 text-base sm:text-lg leading-relaxed focus:outline-none resize-none font-sans placeholder:text-slate-600"
          />
        </div>
      </div>
    </div>
  );
};
