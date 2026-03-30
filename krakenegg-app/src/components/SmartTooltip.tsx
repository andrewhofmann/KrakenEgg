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
    <div
      ref={ref}
      className={clsx(expanded ? "whitespace-nowrap" : "truncate", className)}
      style={{
        ...style,
        ...(expanded ? {
          position: 'relative' as const,
          zIndex: 20,
          backgroundColor: 'var(--ke-bg-elevated)',
          borderRadius: '2px',
          paddingRight: '6px',
          boxShadow: '4px 0 8px rgba(0,0,0,0.15)',
        } : {}),
      }}
      onMouseEnter={() => { if (isTruncated()) setExpanded(true); }}
      onMouseLeave={() => setExpanded(false)}
    >
      {text}
    </div>
  );
};
