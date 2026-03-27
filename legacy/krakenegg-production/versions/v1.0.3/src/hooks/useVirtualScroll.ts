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
  scrollToIndex: (index: number, behavior?: 'auto' | 'smooth') => void;
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

  // Use actual container height if available, fallback to provided height
  const effectiveContainerHeight = useMemo(() => {
    if (containerRef.current && containerRef.current.clientHeight > 0) {
      return containerRef.current.clientHeight;
    }
    return containerHeight > 0 ? containerHeight : 600; // Ultimate fallback
  }, [containerHeight]);

  // Memoize visible range calculation to avoid recalculating on every render
  const { startIndex, endIndex, visibleItems, totalHeight } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + effectiveContainerHeight) / itemHeight) + overscan
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
  }, [scrollTop, itemHeight, effectiveContainerHeight, overscan, itemCount]);

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
    console.log(`🎯 scrollToIndex called: index=${index}, behavior=${behavior}`);
    if (containerRef.current) {
      const container = containerRef.current;
      const actualContainerHeight = container.clientHeight; // Use actual DOM height instead of prop
      const targetScrollTop = index * itemHeight;
      const itemTop = targetScrollTop;
      const itemBottom = itemTop + itemHeight;
      const visibleTop = container.scrollTop;
      const visibleBottom = visibleTop + actualContainerHeight;

      console.log(`📊 Scroll calculations:`, {
        index,
        itemHeight,
        targetScrollTop,
        currentScrollTop: visibleTop,
        containerHeight: actualContainerHeight,
        propContainerHeight: containerHeight,
        itemTop,
        itemBottom,
        visibleTop,
        visibleBottom,
        totalItems: itemCount
      });

      // For keyboard navigation, ensure item is visible with some buffer
      // Check if item is outside visible area or too close to edges
      const bufferSize = itemHeight; // One item height buffer
      const needsScroll =
        itemTop < visibleTop + bufferSize ||
        itemBottom > visibleBottom - bufferSize;

      console.log(`🔍 needsScroll=${needsScroll}, bufferSize=${bufferSize}`);

      if (needsScroll) {
        let newScrollTop: number;

        if (itemTop < visibleTop + bufferSize) {
          // Item is too close to top or above visible area
          newScrollTop = Math.max(0, itemTop - bufferSize);
          console.log(`⬆️ Scrolling up: newScrollTop=${newScrollTop}`);
        } else {
          // Item is too close to bottom or below visible area
          newScrollTop = itemBottom - actualContainerHeight + bufferSize;
          console.log(`⬇️ Scrolling down: newScrollTop=${newScrollTop}`);
        }

        // Ensure we don't scroll past the bottom
        const maxScroll = container.scrollHeight - actualContainerHeight;
        newScrollTop = Math.min(newScrollTop, maxScroll);
        console.log(`📏 Clamped scroll: ${newScrollTop} (max: ${maxScroll})`);

        // Use smooth scrolling only for large jumps, instant for keyboard navigation
        if (behavior === 'smooth') {
          console.log(`🔄 Using smooth scroll`);
          containerRef.current.scrollTo({
            top: newScrollTop,
            behavior: 'smooth'
          });
        } else {
          console.log(`⚡ Using instant scroll`);
          containerRef.current.scrollTop = newScrollTop;
        }
        setScrollTop(newScrollTop);
        console.log(`✅ Scroll completed`);
      } else {
        console.log(`❌ No scroll needed - item already visible`);
      }
    } else {
      console.log(`❌ No container ref available`);
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