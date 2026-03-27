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
          className={clsx(
              "fixed z-[1000] border shadow-xl text-[13px] whitespace-nowrap pointer-events-none px-1.5 py-[1px] rounded",
              // Match the row style roughly (or standard tooltip style)
              // macOS style: Yellowish/White in light mode. Dark gray in dark mode.
              "bg-[#2C2C2C] border-white/20 text-white"
          )}
          style={{ 
              top: coords.top, 
              left: coords.left,
              minWidth: ref.current?.getBoundingClientRect().width 
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
};
