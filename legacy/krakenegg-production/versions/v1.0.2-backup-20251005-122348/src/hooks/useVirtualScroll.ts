import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface VirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Items to render outside visible area for smoother scrolling
}

interface VirtualScrollResult {
  visibleItems: {
    index: number;
    start: number;
  }[];
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
}

export const useVirtualScroll = ({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5
}: VirtualScrollOptions): VirtualScrollResult => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollThrottleRef = useRef<number | null>(null);

  // Memoize visible range calculation to avoid recalculating on every render
  const { startIndex, endIndex, visibleItems, totalHeight } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    // Generate visible items with position data
    const items = [];
    for (let i = start; i <= end; i++) {
      items.push({
        index: i,
        start: i * itemHeight
      });
    }

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items,
      totalHeight: itemCount * itemHeight
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, itemCount]);

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    // Throttle scroll events for better performance
    if (scrollThrottleRef.current) {
      cancelAnimationFrame(scrollThrottleRef.current);
    }

    scrollThrottleRef.current = requestAnimationFrame(() => {
      setScrollTop(event.currentTarget.scrollTop);
      scrollThrottleRef.current = null;
    });
  }, []);

  const scrollToIndex = useCallback((index: number, behavior: 'auto' | 'smooth' = 'auto') => {
    if (containerRef.current) {
      const targetScrollTop = index * itemHeight;
      const currentScrollTop = containerRef.current.scrollTop;
      const containerRect = containerRef.current.getBoundingClientRect();
      const itemTop = targetScrollTop;
      const itemBottom = targetScrollTop + itemHeight;
      const visibleTop = currentScrollTop;
      const visibleBottom = currentScrollTop + containerRect.height;

      // For keyboard navigation, ensure item is visible with some buffer
      // Check if item is outside visible area or too close to edges
      const bufferSize = itemHeight; // One item height buffer
      const needsScroll =
        itemTop < visibleTop + bufferSize ||
        itemBottom > visibleBottom - bufferSize;

      if (needsScroll) {
        let newScrollTop: number;

        if (itemTop < visibleTop + bufferSize) {
          // Item is too close to top or above visible area
          newScrollTop = Math.max(0, itemTop - bufferSize);
        } else {
          // Item is too close to bottom or below visible area
          newScrollTop = itemBottom - containerRect.height + bufferSize;
        }

        // Use smooth scrolling only for large jumps, instant for keyboard navigation
        if (behavior === 'smooth') {
          containerRef.current.scrollTo({
            top: newScrollTop,
            behavior: 'smooth'
          });
        } else {
          containerRef.current.scrollTop = newScrollTop;
        }
        setScrollTop(newScrollTop);
      }
    }
  }, [itemHeight]);

  // Cleanup throttle on unmount
  useEffect(() => {
    return () => {
      if (scrollThrottleRef.current) {
        cancelAnimationFrame(scrollThrottleRef.current);
      }
    };
  }, []);

  return {
    visibleItems,
    totalHeight,
    scrollToIndex,
    containerRef,
    onScroll
  };
};