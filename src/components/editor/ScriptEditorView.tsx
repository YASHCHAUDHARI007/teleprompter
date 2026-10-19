import React, { useRef, useState, useEffect } from 'react';
import type { Script } from '../../types';
import {
  Clock,
  Download,
  Upload,
  Copy,
  Trash2,
  Check,
  Video,
} from 'lucide-react';

interface ScriptEditorViewProps {
  script: Script;
  onUpdateScript: (updated: Partial<Script>) => void;
  onDuplicateScript: (script: Script) => void;
  onDeleteScript: (id: string) => void;
  onReturnToStudio: () => void;
  wordsPerMinute: number;
}

export const ScriptEditorView: React.FC<ScriptEditorViewProps> = ({
  script,
  onUpdateScript,
  onDuplicateScript,
  onDeleteScript,
  onReturnToStudio,
  wordsPerMinute,
}) => {
  const [content, setContent] = useState(script.content);
  const [title, setTitle] = useState(script.title);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(script.content);
    setTitle(script.title);
  }, [script.id]);

  const handleContentChange = (newText: string) => {
    setContent(newText);

    const words = newText.trim() ? newText.trim().split(/\s+/).length : 0;
    const duration = Math.round((words / wordsPerMinute) * 60);

    onUpdateScript({
      content: newText,
      wordCount: words,
      estimatedDurationSec: duration,
      updatedAt: Date.now(),
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onUpdateScript({
      title: newTitle,
      updatedAt: Date.now(),
    });
  };

  const insertStageDirection = (text: string) => {
    const textarea = document.getElementById('script-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);

    const inserted = `\n[${text}]\n`;
    const updated = before + inserted + after;
    handleContentChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + inserted.length;
    }, 50);
  };

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

  const handleExportText = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'script'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const estimatedMins = Math.floor((words / wordsPerMinute) * 60 / 60);
  const estimatedSecs = Math.round(((words / wordsPerMinute) * 60) % 60);

  return (
    <div className="flex-1 overflow-y-auto bg-[#17181B] flex flex-col items-center p-4 sm:p-8 select-text">
      <div className="w-full max-w-3xl space-y-6">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-[#303238] pb-4">
          <button
            onClick={onReturnToStudio}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#1D1F23] hover:bg-[#24262B] border border-[#303238] text-xs text-[#F1F1F2] transition-colors cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-[#8EA9FF]" />
            <span>Return to Studio</span>
          </button>

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
              className="p-1.5 rounded hover:bg-[#1D1F23] text-[#9699A1] hover:text-[#F1F1F2] transition-colors cursor-pointer"
              title="Import script (.txt, .md)"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportText}
              className="p-1.5 rounded hover:bg-[#1D1F23] text-[#9699A1] hover:text-[#F1F1F2] transition-colors cursor-pointer"
              title="Export script (.md)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDuplicateScript(script)}
              className="p-1.5 rounded hover:bg-[#1D1F23] text-[#9699A1] hover:text-[#F1F1F2] transition-colors cursor-pointer"
              title="Duplicate script"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDeleteScript(script.id)}
              className="p-1.5 rounded hover:bg-[#1D1F23] text-[#FF5C57] hover:text-[#FF7A75] transition-colors cursor-pointer"
              title="Delete script"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Script Title & Metadata */}
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Script Title..."
            className="w-full bg-transparent text-2xl font-semibold text-[#F1F1F2] tracking-tight focus:outline-none placeholder-[#646770]"
          />

          <div className="flex items-center space-x-3 text-xs text-[#9699A1]">
            <span>{words} words</span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-[#8EA9FF]" />
              <span>
                ~{estimatedMins > 0 ? `${estimatedMins}m ` : ''}{estimatedSecs}s speaking ({wordsPerMinute} WPM)
              </span>
            </div>
            <span>•</span>
            <span className="text-[#30D158] flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>Autosaved</span>
            </span>
          </div>
        </div>

        {/* Stage Cues Toolbar */}
        <div className="flex items-center space-x-2 py-2 border-y border-[#303238] text-xs">
          <span className="text-[#9699A1] text-[11px] font-medium mr-1">Insert Cue:</span>
          {['Pause 2s', 'Smile', 'Look at camera', 'Emphasize'].map((cue) => (
            <button
              key={cue}
              onClick={() => insertStageDirection(cue)}
              className="px-2.5 py-1 rounded bg-[#1D1F23] hover:bg-[#24262B] border border-[#303238] text-[11px] text-[#8EA9FF] transition-colors cursor-pointer"
            >
              +{cue}
            </button>
          ))}
        </div>

        {/* Clean Writing Textarea */}
        <textarea
          id="script-textarea"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start typing your script here... Use paragraph breaks to separate sections. Add stage cues using the toolbar above."
          rows={22}
          className="w-full bg-transparent text-[#F1F1F2] text-[16px] leading-[1.8] tracking-normal focus:outline-none resize-none font-sans"
        />
      </div>
    </div>
  );
};
