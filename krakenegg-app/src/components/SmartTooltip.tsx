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

  const show = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => {
      if (!ref.current || ref.current.scrollWidth <= ref.current.clientWidth) return;
      const r = ref.current.getBoundingClientRect();
      const cs = window.getComputedStyle(ref.current);
      setSnap({
        top: r.top, left: r.left, height: r.height,
        fontSize: cs.fontSize, fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight, lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing, color: cs.color,
      });
    }, 400);
  }, []);

  const hide = useCallback(() => {
    if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
    setSnap(null);
  }, []);

  return (
    <>
      <div
        ref={ref}
        className={clsx("truncate", className)}
        style={style}
        onMouseEnter={show}
        // Don't hide on source mouseLeave — the portal covers the source,
        // so only the portal's mouseLeave should dismiss.
        onMouseLeave={() => {
          // Only hide if portal isn't showing yet (still in timer delay)
          if (!snap) hide();
        }}
      >
        {text}
      </div>
      {snap && createPortal(
        <div
          onMouseLeave={hide}
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
            borderRadius: '2px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.2)',
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
};
