import React, { useRef, useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, useInView } from 'motion/react';
import { cn } from '@/lib/utils';

// Generic AnimatedItem component
interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
  index: number;
  onMouseEnter?: () => void;
  onClick?: () => void;
  inViewMargin?: string;
  className?: string;
}

const AnimatedItem = ({ children, delay = 0, index, onMouseEnter, onClick, className = '' }: AnimatedItemProps) => {
  const ref = useRef(null);
  // @ts-ignore: motion/react type definitions might differ, falling back to standard usage
  const inView = useInView(ref, { amount: 0.5, once: false });

  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2, delay }}
      className={cn("cursor-pointer mb-4 last:mb-0", className)}
    >
      {children}
    </motion.div>
  );
};

// Generic AnimatedList component
interface AnimatedListProps<T> {
  items: T[];
  onItemSelect?: (item: T, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  itemClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
  renderItem?: (item: T, index: number, isSelected: boolean) => ReactNode;
  children?: ReactNode; // Fallback if no items/renderItem provided, though less likely with this design
}

const AnimatedList = <T,>({
  items,
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
  renderItem
}: AnimatedListProps<T>) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const handleItemMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleItemClick = useCallback((item: T, index: number) => {
    setSelectedIndex(index);
    if (onItemSelect) {
      onItemSelect(item, index);
    }
  }, [onItemSelect]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
  }, []);

  useEffect(() => {
    if (!enableArrowNavigation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        if (document.activeElement === listRef.current || listRef.current?.contains(document.activeElement)) {
          e.preventDefault();
          setKeyboardNav(true);
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        }
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        if (document.activeElement === listRef.current || listRef.current?.contains(document.activeElement)) {
          e.preventDefault();
          setKeyboardNav(true);
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        }
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          // Only trigger if focus is within list context presumably
          if (document.activeElement === listRef.current || listRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            if (onItemSelect) {
              onItemSelect(items[selectedIndex], selectedIndex);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth'
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={listRef}
        className={cn(
          "max-h-[600px] overflow-y-auto p-4",
          displayScrollbar
            ? "[&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-secondary/50 [&::-webkit-scrollbar-thumb]:rounded-[4px]"
            : "scrollbar-hide"
        )}
        onScroll={handleScroll}
        style={{
          scrollbarWidth: displayScrollbar ? 'thin' : 'none',
        }}
        tabIndex={0} // Make list focusable for arrow keys
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={index}
            delay={index * 0.05} // Staggered delay logic could be improved, mostly 0.1 per item is slow for large lists, let's keep it simple
            index={index}
            onMouseEnter={() => handleItemMouseEnter(index)}
            onClick={() => handleItemClick(item, index)}
            className={itemClassName}
          >
            {renderItem ? renderItem(item, index, selectedIndex === index) : (
              <div className={cn("p-4 bg-card rounded-lg border border-border", selectedIndex === index ? "bg-accent/50" : "")}>
                {/* Fallback rendering */}
                {String(item)}
              </div>
            )}
          </AnimatedItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-[50px] bg-gradient-to-b from-background to-transparent pointer-events-none transition-opacity duration-300 ease-in-out z-10"
            style={{ opacity: topGradientOpacity }}
          ></div>
          <div
            className="absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-background to-transparent pointer-events-none transition-opacity duration-300 ease-in-out z-10"
            style={{ opacity: bottomGradientOpacity }}
          ></div>
        </>
      )}
    </div>
  );
};

export default AnimatedList;
