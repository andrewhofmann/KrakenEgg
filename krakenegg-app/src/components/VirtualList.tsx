import React, { useRef, useState, useLayoutEffect } from 'react';

interface FixedSizeListProps<T = unknown> {
  height: number;
  width: number;
  itemCount: number;
  itemSize: number;
  children: (props: { index: number; style: React.CSSProperties; data?: T }) => React.ReactNode;
  itemData?: T;
}

export interface FixedSizeListRef {
    scrollToItem: (index: number, align?: 'smart' | 'auto' | 'start' | 'end' | 'center') => void;
}

export const FixedSizeList = React.forwardRef<FixedSizeListRef, FixedSizeListProps<any>>(
  ({ height, width, itemCount, itemSize, children, itemData }, ref) => {
    const [scrollTop, setScrollTop] = useState(0);
    const outerRef = useRef<HTMLDivElement>(null);
    // ... rest of implementation
    
    // Pass itemData to children if needed, though usually handled by closure in parent
    const items = [];
    for (let i = renderStart; i <= renderEnd; i++) {
      items.push(
        children({
          index: i,
          style: {
            position: 'absolute',
            top: i * itemSize,
            left: 0,
            width: '100%',
            height: itemSize,
          },
          data: itemData
        })
      );
    }


    return (
      <div
        ref={outerRef}
        style={{
          position: 'relative',
          height,
          width,
          overflow: 'auto',
          willChange: 'transform',
        }}
      >
        <div style={{ height: itemCount * itemSize, width: '100%' }}>
          {items}
        </div>
      </div>
    );
  }
);
