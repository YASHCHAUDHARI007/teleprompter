import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { StudioSettings } from '../../types';
import { Eye, ArrowRight, CornerDownRight } from 'lucide-react';

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

  // Parse text into tokens / paragraphs with stage direction highlights
  const parsedParagraphs = useMemo(() => {
    if (!scriptContent) return [];

    return scriptContent.split('\n\n').map((para, paraIdx) => {
      // Split paragraph by stage directions like [Pause 2s] or [Smile]
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

  // Sync scroll position state
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
        // Base velocity: pixels per millisecond
        // settings.scrollSpeed goes from 0.5 to 10.0
        // e.g. at speed 3: 0.05 * 3 = 0.15 px/ms ≈ 90 px/sec
        const pixelsPerMs = (settings.scrollSpeed * 0.045);
        scrollPosRef.current += pixelsPerMs * deltaTime;

        containerRef.current.scrollTop = scrollPosRef.current;
        updateScrollProgress();

        // Check if reached bottom
        const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight;
        if (scrollPosRef.current >= maxScroll && maxScroll > 0) {
          // Finished scrolling
          // Keep at bottom or pause
        }
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
      // If user is manually scrolling or dragging
      scrollPosRef.current = containerRef.current.scrollTop;
      updateScrollProgress();
    }
  };

  // Wheel speed tweak with Alt key, or normal scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (e.altKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      const newSpeed = Math.min(10, Math.max(0.5, +(settings.scrollSpeed + delta).toFixed(1)));
      onSpeedChange(newSpeed);
    }
  };

  // Reset scroll to top
  useEffect(() => {
    if (containerRef.current && scrollPosRef.current === 0) {
      containerRef.current.scrollTop = 0;
    }
  }, [scriptContent]);

  // Teleprompter container style
  const containerStyle: React.CSSProperties = {
    backgroundColor: `rgba(11, 15, 23, ${settings.overlayBgOpacity})`,
    fontFamily: settings.fontFamily,
    color: settings.textColor,
    opacity: settings.textOpacity,
  };

  // Text content styling
  const contentStyle: React.CSSProperties = {
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    textAlign: settings.textAlign,
    width: `${settings.textWidthPercent}%`,
    maxWidth: '1080px',
  };

  // Reading guide position %
  const guideTopPercent = settings.readingGuidePosition;

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none flex flex-col items-center transition-colors duration-300 ${
        settings.mirrorPrompter ? 'prompter-mirrored' : ''
      } ${isFloatingWindow ? 'p-2' : ''}`}
      style={containerStyle}
      onWheel={handleWheel}
      onDoubleClick={onRestart}
    >
      {/* Tap hint when paused */}
      {!isPlaying && !isFloatingWindow && (
        <div
          onClick={onTogglePlay}
          className="absolute bottom-6 z-30 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300 backdrop-blur-sm cursor-pointer hover:bg-slate-800 transition shadow-lg flex items-center space-x-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Paused • Click to scroll or press Space</span>
        </div>
      )}

      {/* Eye-line Reading Guide Marker */}
      {settings.readingGuideStyle !== 'none' && (
        <div
          className="reading-guide-line pointer-events-none transition-all duration-200"
          style={{ top: `${guideTopPercent}%` }}
        >
          {settings.readingGuideStyle === 'band' && (
            <div className="relative w-full h-24 -mt-12 bg-gradient-to-r from-blue-600/10 via-blue-500/25 to-blue-600/10 border-y border-blue-400/40 backdrop-blur-[2px] shadow-[0_0_25px_rgba(59,130,246,0.25)] flex items-center justify-between px-6">
              <div className="flex items-center space-x-2 text-xs font-semibold text-blue-300 tracking-wider uppercase bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-500/40 shadow-sm">
                <Eye className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>Eye Line</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-blue-300 font-mono opacity-80">
                <span>Maintain Lens Contact</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          {settings.readingGuideStyle === 'line' && (
            <div className="relative w-full flex items-center justify-between px-6">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300 flex items-center justify-center -ml-2 shadow-lg shadow-blue-500/30">
                <CornerDownRight className="w-4 h-4" />
              </div>
              <div className="flex-1 h-[2px] mx-2 bg-gradient-to-r from-blue-500/20 via-blue-400 to-blue-500/20 shadow-[0_0_12px_#3b82f6]" />
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300 flex items-center justify-center -mr-2 shadow-lg shadow-blue-500/30">
                <CornerDownRight className="w-4 h-4 rotate-180" />
              </div>
            </div>
          )}

          {settings.readingGuideStyle === 'arrow' && (
            <div className="relative w-full flex items-center justify-between px-4">
              <div className="text-blue-400 font-bold text-2xl animate-pulse">▶</div>
              <div className="text-blue-400 font-bold text-2xl animate-pulse">◀</div>
            </div>
          )}
        </div>
      )}

      {/* Focus Mode Dim Masks (smooth gradient darkening above and below reading guide) */}
      {settings.focusModeDim && (
        <>
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none z-20 backdrop-blur-[1px]"
            style={{
              height: `${Math.max(5, guideTopPercent - 8)}%`,
              background: 'linear-gradient(to bottom, rgba(11,15,23,0.92) 60%, rgba(11,15,23,0.2) 100%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none z-20 backdrop-blur-[1px]"
            style={{
              top: `${Math.min(95, guideTopPercent + 12)}%`,
              background: 'linear-gradient(to top, rgba(11,15,23,0.92) 60%, rgba(11,15,23,0.2) 100%)',
            }}
          />
        </>
      )}

      {/* Main Scrolling Text Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto px-6 relative z-10 scroll-smooth"
        style={{
          scrollBehavior: isPlaying ? 'auto' : 'smooth',
          // Padding top so initial text starts exactly right at or just below the eye line
          paddingTop: `${guideTopPercent + 5}vh`,
          paddingBottom: '60vh',
        }}
      >
        <div
          ref={contentRef}
          className="mx-auto transition-all"
          style={contentStyle}
        >
          {parsedParagraphs.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-medium">
              No script loaded. Select or write a script to start teleprompter.
            </div>
          ) : (
            parsedParagraphs.map((para) => (
              <p
                key={para.id}
                className="mb-8 leading-relaxed tracking-wide transition-opacity duration-200"
              >
                {para.parts.map((part) =>
                  part.isStageDirection ? (
                    <span
                      key={part.id}
                      className="stage-direction select-none not-italic"
                    >
                      ✦ {part.text}
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

      {/* Bottom Progress Bar Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 z-30">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </div>
  );
};
