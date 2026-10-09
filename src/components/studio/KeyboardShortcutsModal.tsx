import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause Teleprompter Scrolling' },
    { key: 'R', desc: 'Restart Script to Beginning (Top)' },
    { key: '↑ / ↓', desc: 'Manual Step Scroll Script Up / Down' },
    { key: '[ / ]', desc: 'Decrease / Increase Scroll Speed' },
    { key: 'Alt + Wheel', desc: 'Adjust Scroll Speed with Mouse Wheel' },
    { key: 'F', desc: 'Toggle Reading Focus Mode Dimmer' },
    { key: 'M', desc: 'Toggle Prompter Horizontal Mirroring' },
    { key: 'Esc', desc: 'Close Modal / Exit Fullscreen' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="max-w-md w-full bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#141d2e]">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 space-y-3">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-b-0"
            >
              <span className="text-xs text-slate-300 font-medium">{item.desc}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-semibold text-blue-300 bg-slate-900 border border-slate-700/80 rounded-lg shadow-inner">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="px-6 py-3 bg-[#0d131f] border-t border-slate-800/80 text-[11px] text-slate-400 text-center">
          Keyboard shortcuts are automatically suppressed while actively typing inside the script editor.
        </div>
      </div>
    </div>
  );
};
