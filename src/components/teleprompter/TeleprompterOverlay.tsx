import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import type { StudioSettings } from '../../types';

interface TeleprompterOverlayProps {
  scriptContent: string;
  settings: StudioSettings;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSpeedChange: (speed: number) => void;
  isFloatingWindow?: boolean;
}

export const TeleprompterOverlay: React.FC<TeleprompterOverlayProps> = ({
  scriptContent,
  settings,
  isPlaying,
  onTogglePlay,
  onRestart,
  onSpeedChange,
  isFloatingWindow = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const lastTimestampRef = useRef<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Parse text into tokens with stage cues like [Pause 2s]
  const parsedParagraphs = useMemo(() => {
    if (!scriptContent) return [];

    return scriptContent.split('\n\n').map((para, paraIdx) => {
      const parts = para.split(/(\[[^\]]+\])/g);
      return {
        id: `para-${paraIdx}`,
        parts: parts.map((part, partIdx) => {
          const isStageDir = part.startsWith('[') && part.endsWith(']');
          return {
            id: `part-${paraIdx}-${partIdx}`,
            text: isStageDir ? part.slice(1, -1) : part,
            isStageDirection: isStageDir,
          };
        }),
      };
    });
  }, [scriptContent]);

  // Sync scroll position
  const updateScrollProgress = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const container = containerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (container.scrollTop / maxScroll) * 100)));
    }
  }, []);

  // Frame-rate independent scrolling loop
  useEffect(() => {
    let animId: number;

    const scrollLoop = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      const deltaTime = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      if (isPlaying && containerRef.current) {
        const pixelsPerMs = settings.scrollSpeed * 0.045;
        scrollPosRef.current += pixelsPerMs * deltaTime;

        containerRef.current.scrollTop = scrollPosRef.current;
        updateScrollProgress();
      }

      animId = requestAnimationFrame(scrollLoop);
    };

    animId = requestAnimationFrame(scrollLoop);

    return () => {
      cancelAnimationFrame(animId);
      lastTimestampRef.current = null;
    };
  }, [isPlaying, settings.scrollSpeed, updateScrollProgress]);

  // Handle manual scroll (wheel, scrollbar drag)
  const handleScroll = () => {
    if (containerRef.current) {
      scrollPosRef.current = containerRef.current.scrollTop;
      updateScrollProgress();
    }
  };

  // Wheel speed adjustment with Alt key
  const handleWheel = (e: React.WheelEvent) => {
    if (e.altKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      const newSpeed = Math.min(10, Math.max(0.5, +(settings.scrollSpeed + delta).toFixed(1)));
      onSpeedChange(newSpeed);
    }
  };

  // Reset scroll to top when script changes
  useEffect(() => {
    if (containerRef.current && scrollPosRef.current === 0) {
      containerRef.current.scrollTop = 0;
    }
  }, [scriptContent]);

  const containerStyle: React.CSSProperties = {
    backgroundColor: `rgba(17, 18, 20, ${settings.overlayBgOpacity})`,
    fontFamily: settings.fontFamily,
    color: settings.textColor,
    opacity: settings.textOpacity,
  };

  const contentStyle: React.CSSProperties = {
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    textAlign: settings.textAlign,
    width: `${settings.textWidthPercent}%`,
    maxWidth: '960px',
  };

  const guideTopPercent = settings.readingGuidePosition;

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none flex flex-col items-center transition-colors duration-200 ${
        settings.mirrorPrompter ? 'prompter-mirrored' : ''
      } ${isFloatingWindow ? 'p-3' : ''}`}
      style={containerStyle}
      onWheel={handleWheel}
      onDoubleClick={onRestart}
      onClick={(e) => {
        // Clicking directly on background toggles play/pause
        if (e.target === containerRef.current || e.target === contentRef.current) {
          onTogglePlay();
        }
      }}
    >
      {/* Eye-line Reading Guide Marker */}
      {settings.readingGuideStyle !== 'none' && (
        <div
          className="eyeline-guide transition-all duration-150"
          style={{ top: `${guideTopPercent}%` }}
        >
          {settings.readingGuideStyle === 'line' && (
            <div className="relative w-full flex items-center justify-between px-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8EA9FF]" />
              <div className="flex-1 h-px mx-2 bg-[#8EA9FF]/35" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#8EA9FF]" />
            </div>
          )}

          {settings.readingGuideStyle === 'band' && (
            <div className="relative w-full h-16 -mt-8 bg-[#8EA9FF]/[0.08] border-y border-[#8EA9FF]/30 flex items-center justify-between px-6">
              <div className="text-[11px] font-medium tracking-wider uppercase text-[#8EA9FF]/80">
                Eye Line
              </div>
              <div className="text-[11px] font-mono text-[#8EA9FF]/60">
                Webcam Lens
              </div>
            </div>
          )}

          {settings.readingGuideStyle === 'arrow' && (
            <div className="relative w-full flex items-center justify-between px-3 text-[#8EA9FF] text-sm">
              <span>▶</span>
              <div className="flex-1 h-px mx-2 bg-[#8EA9FF]/20" />
              <span>◀</span>
            </div>
          )}
        </div>
      )}

      {/* Focus Mode Dim Masks */}
      {settings.focusModeDim && (
        <>
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none z-20"
            style={{
              height: `${Math.max(5, guideTopPercent - 8)}%`,
              background: 'linear-gradient(to bottom, rgba(17,18,20,0.88) 60%, rgba(17,18,20,0.15) 100%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
            style={{
              top: `${Math.min(95, guideTopPercent + 12)}%`,
              background: 'linear-gradient(to top, rgba(17,18,20,0.88) 60%, rgba(17,18,20,0.15) 100%)',
            }}
          />
        </>
      )}

      {/* Main Scrolling Text Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto px-6 relative z-10"
        style={{
          scrollBehavior: isPlaying ? 'auto' : 'smooth',
          paddingTop: `${guideTopPercent + 4}vh`,
          paddingBottom: '55vh',
        }}
      >
        <div
          ref={contentRef}
          className="mx-auto"
          style={contentStyle}
        >
          {parsedParagraphs.length === 0 ? (
            <div className="py-24 text-center text-[#9699A1] text-sm font-medium">
              No script loaded. Select or write a script to start teleprompter.
            </div>
          ) : (
            parsedParagraphs.map((para) => (
              <p
                key={para.id}
                className="mb-7 leading-relaxed tracking-normal"
              >
                {para.parts.map((part) =>
                  part.isStageDirection ? (
                    <span
                      key={part.id}
                      className="prompter-stage-cue"
                    >
                      {part.text}
                    </span>
                  ) : (
                    <span key={part.id}>{part.text}</span>
                  )
                )}
              </p>
            ))
          )}
        </div>
      </div>

      {/* Subtle Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#303238] z-30">
        <div
          className="h-full bg-[#8EA9FF] transition-all duration-120"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </div>
  );
};
