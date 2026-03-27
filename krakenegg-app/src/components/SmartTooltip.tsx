import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface SmartTooltipProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  isActive?: boolean;
}

export const SmartTooltip = ({ text, className, style }: SmartTooltipProps) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (ref.current && ref.current.scrollWidth > ref.current.clientWidth) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.left });
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
          className="fixed z-[1000] text-[13px] whitespace-nowrap pointer-events-none px-1.5 py-[1px] rounded"
          style={{
              top: coords.top,
              left: coords.left,
              minWidth: ref.current?.getBoundingClientRect().width,
              backgroundColor: 'var(--ke-bg-elevated)',
              color: 'var(--ke-text)',
              border: '1px solid var(--ke-border)',
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
