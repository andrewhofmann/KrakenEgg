import { useState, useRef } from 'react';
import clsx from 'clsx';

interface SmartTooltipProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SmartTooltip = ({ text, className, style }: SmartTooltipProps) => {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isTruncated = () => ref.current ? ref.current.scrollWidth > ref.current.clientWidth : false;

  return (
    <div className="relative" style={{ minWidth: 0 }}>
      <div
        ref={ref}
        className={clsx("truncate", className)}
        style={style}
        onMouseEnter={() => { if (isTruncated()) setExpanded(true); }}
        onMouseLeave={() => setExpanded(false)}
      >
        {text}
      </div>
      {expanded && (
        <div
          className={clsx("absolute top-0 left-0 whitespace-nowrap z-30", className)}
          style={{
            ...style,
            backgroundColor: 'var(--ke-bg-elevated)',
            paddingRight: '8px',
            borderRadius: '2px',
            boxShadow: '4px 0 12px rgba(0,0,0,0.2)',
          }}
          onMouseLeave={() => setExpanded(false)}
        >
          {text}
        </div>
      )}
    </div>
  );
};
