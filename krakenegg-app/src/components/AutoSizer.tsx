import React, { useEffect, useRef, useState } from "react";

interface AutoSizerProps {
  children: (size: { height: number; width: number }) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const AutoSizer = ({ children, className, style }: AutoSizerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ height: number; width: number }>({ height: 0, width: 0 });

  useEffect(() => {
    if (!ref.current) return;
    
    // Initial measure
    const rect = ref.current.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use contentRect for precise content box size
        const { width, height } = entry.contentRect;
        // Or getBoundingClientRect if needed, but contentRect is standard for observers
        setSize({ width, height });
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
        ref={ref} 
        className={className} 
        style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}
    >
      {/* Only render children if we have a valid size, preventing initial flash/error */}
      {size.height > 0 && size.width > 0 && children(size)}
    </div>
  );
};
