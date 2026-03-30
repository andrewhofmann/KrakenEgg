import { useState, useRef, useCallback, useEffect } from 'react';
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

  // Dismiss on scroll, keyboard, or click anywhere
  useEffect(() => {
    if (!snap) return;
    const dismiss = () => hide();
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('keydown', dismiss, true);
    window.addEventListener('mousedown', dismiss, true);
    return () => {
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('keydown', dismiss, true);
      window.removeEventListener('mousedown', dismiss, true);
    };
  }, [snap, hide]);

  return (
    <>
      <div
        ref={ref}
        className={clsx("truncate", className)}
        style={style}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {text}
      </div>
      {snap && createPortal(
        <div
          style={{
            position: 'fixed',
            top: snap.top,
            left: snap.left,
            height: snap.height,
            pointerEvents: 'none',
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
