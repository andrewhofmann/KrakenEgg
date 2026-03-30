import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface SmartTooltipProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SmartTooltip = ({ text, className, style }: SmartTooltipProps) => {
  const [show, setShow] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback(() => {
    if (ref.current && ref.current.scrollWidth > ref.current.clientWidth) {
      setRect(ref.current.getBoundingClientRect());
      // Small delay to prevent flicker on quick mouse passes
      timerRef.current = setTimeout(() => setShow(true), 150);
    }
  }, []);

  const handleLeave = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setShow(false);
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
      {show && rect && createPortal(
        <div
          onMouseEnter={() => {}}
          onMouseLeave={handleLeave}
          style={{
            position: 'fixed',
            top: rect.top,
            left: rect.left,
            height: rect.height,
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            lineHeight: 'inherit',
            letterSpacing: 'inherit',
            paddingRight: '10px',
            backgroundColor: 'var(--ke-bg-elevated)',
            color: 'var(--ke-text)',
            borderRadius: '3px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            pointerEvents: 'auto',
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
};
