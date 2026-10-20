import React from 'react';
import { X, Command } from 'lucide-react';

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
    { key: 'Space', desc: 'Toggle Teleprompter Play / Pause' },
    { key: 'R', desc: 'Restart Teleprompter to the Top' },
    { key: '[', desc: 'Decrease Teleprompter Scroll Speed (-0.2x)' },
    { key: ']', desc: 'Increase Teleprompter Scroll Speed (+0.2x)' },
    { key: 'Alt + Scroll', desc: 'Fine-tune speed directly with mouse wheel' },
    { key: 'F', desc: 'Toggle Focus Mode Dimmer (dims surrounding lines)' },
    { key: 'M', desc: 'Toggle Optical Mirroring (horizontal flip)' },
    { key: 'Esc', desc: 'Close modals & drawers / Exit fullscreen' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-[#1D1F23] border border-[#303238] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-12 px-4 border-b border-[#303238] flex items-center justify-between bg-[#111214]">
          <div className="flex items-center space-x-2">
            <Command className="w-4 h-4 text-[#8EA9FF]" />
            <h2 className="text-xs font-semibold text-[#F1F1F2]">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9699A1] hover:text-[#F1F1F2] hover:bg-[#24262B] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-2 text-xs">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 border-b border-[#303238]/60 last:border-b-0"
            >
              <span className="text-[#9699A1]">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-[#17181B] border border-[#303238] font-mono text-[11px] text-[#8EA9FF] font-medium shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="px-4 py-2.5 bg-[#111214] border-t border-[#303238] text-[11px] text-[#646770]">
          Shortcuts are automatically paused while actively typing inside the script editor.
        </div>
      </div>
    </div>
  );
};
