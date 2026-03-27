import { useCallback, useRef } from 'react';

interface VirtualScrollHookProps {
  itemHeight: number;
  containerHeight: number;
  totalItems: number;
}

interface VirtualScrollHookReturn {
  scrollToIndex: (index: number, behavior?: 'auto' | 'smooth') => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const useVirtualScroll = ({
  itemHeight,
  containerHeight,
  totalItems
}: VirtualScrollHookProps): VirtualScrollHookReturn => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = useCallback((index: number, behavior: 'auto' | 'smooth' = 'auto') => {
    const container = containerRef.current;
    if (!container || index < 0 || index >= totalItems) {
      console.log('🚫 scrollToIndex: Invalid conditions', {
        hasContainer: !!container,
        index,
        totalItems
      });
      return;
    }

    const itemTop = index * itemHeight;
    const itemBottom = itemTop + itemHeight;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + containerHeight;

    // Buffer zone to reduce frequent micro-scrolling
    const bufferSize = itemHeight;

    console.log('📊 scrollToIndex calculation:', {
      index,
      itemTop,
      itemBottom,
      containerTop,
      containerBottom,
      bufferSize,
      behavior
    });

    // Determine if scrolling is needed
    const needsScroll =
      itemTop < (containerTop + bufferSize) ||
      itemBottom > (containerBottom - bufferSize);

    if (!needsScroll) {
      console.log('✅ scrollToIndex: Item already visible, no scroll needed');
      return;
    }

    let targetScrollTop: number;

    if (itemTop < containerTop) {
      // Item is above visible area - scroll up
      targetScrollTop = Math.max(0, itemTop - bufferSize);
      console.log('⬆️ scrollToIndex: Scrolling up to', targetScrollTop);
    } else {
      // Item is below visible area - scroll down
      targetScrollTop = itemBottom - containerHeight + bufferSize;
      console.log('⬇️ scrollToIndex: Scrolling down to', targetScrollTop);
    }

    // Clamp to valid range
    const maxScrollTop = Math.max(0, (totalItems * itemHeight) - containerHeight);
    targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));

    console.log('🎯 scrollToIndex: Final scroll target', targetScrollTop);

    container.scrollTo({
      top: targetScrollTop,
      behavior
    });

  }, [itemHeight, containerHeight, totalItems]);

  return {
    scrollToIndex,
    containerRef
  };
};

export default useVirtualScroll;