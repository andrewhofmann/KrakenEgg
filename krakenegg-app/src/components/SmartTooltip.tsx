import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface SmartTooltipProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

interface SnapStyles {
  top: number; left: number; height: number;
  fontSize: string; fontFamily: string; fontWeight: string;
  lineHeight: string; letterSpacing: string; color: string;
}

export const SmartTooltip = ({ text, className, style }: SmartTooltipProps) => {
  const [snap, setSnap] = useState<SnapStyles | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHovering = useRef(false);

  const handleEnter = useCallback(() => {
    isHovering.current = true;
    if (!ref.current || ref.current.scrollWidth <= ref.current.clientWidth) return;
    showTimer.current = setTimeout(() => {
      if (!isHovering.current || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const cs = window.getComputedStyle(ref.current);
      setSnap({
        top: r.top, left: r.left, height: r.height,
        fontSize: cs.fontSize, fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight, lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing, color: cs.color,
      });
    }, 300);
  }, []);

  const handleLeave = useCallback(() => {
    isHovering.current = false;
    if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
    setSnap(null);
  }, []);

  return (
    <>
      <div
        ref={ref}
        className={clsx("truncate", className)}
        style={style}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {text}
      </div>
      {snap && createPortal(
        <div
          onMouseLeave={handleLeave}
          style={{
            position: 'fixed',
            top: snap.top,
            left: snap.left,
            height: snap.height,
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            fontSize: snap.fontSize,
            fontFamily: snap.fontFamily,
            fontWeight: snap.fontWeight,
            lineHeight: snap.lineHeight,
            letterSpacing: snap.letterSpacing,
            color: snap.color,
            paddingRight: '10px',
            backgroundColor: 'var(--ke-bg-elevated)',
            borderRadius: '3px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
};
