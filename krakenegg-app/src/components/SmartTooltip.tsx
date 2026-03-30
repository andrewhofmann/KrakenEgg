import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface SmartTooltipProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SmartTooltip = ({ text, className, style }: SmartTooltipProps) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, fontSize: '', lineHeight: '', fontFamily: '', fontWeight: '', letterSpacing: '', height: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (ref.current && ref.current.scrollWidth > ref.current.clientWidth) {
      const rect = ref.current.getBoundingClientRect();
      const computed = window.getComputedStyle(ref.current);
      // Clamp left to prevent tooltip from going off-screen right
      const maxLeft = window.innerWidth - Math.min(rect.width + 40, 600);
      setPos({
        top: rect.top,
        left: Math.min(rect.left, Math.max(0, maxLeft)),
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        fontFamily: computed.fontFamily,
        fontWeight: computed.fontWeight,
        letterSpacing: computed.letterSpacing,
        height: rect.height,
      });
      setShow(true);
    }
  };

  return (
    <>
      <div
        ref={ref}
        className={clsx("truncate", className)}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
      >
        {text}
      </div>
      {show && createPortal(
        <div
          className="fixed z-[1000] pointer-events-none whitespace-nowrap"
          style={{
              top: pos.top,
              left: pos.left,
              height: pos.height,
              fontSize: pos.fontSize,
              lineHeight: pos.lineHeight,
              fontFamily: pos.fontFamily,
              fontWeight: pos.fontWeight,
              letterSpacing: pos.letterSpacing,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 0,
              paddingRight: '8px',
              backgroundColor: 'var(--ke-bg-elevated)',
              color: 'var(--ke-text)',
              border: '1px solid var(--ke-border)',
              borderRadius: '4px',
              boxShadow: 'var(--ke-shadow-sm)',
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
};
