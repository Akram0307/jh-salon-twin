import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface ScrollableTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function ScrollableTabs({ tabs, activeTab, onTabChange, className }: ScrollableTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Scroll active tab into view on mount and when activeTab changes
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeTabElement = activeTabRef.current;
      
      // Calculate scroll position to center the active tab
      const containerWidth = container.offsetWidth;
      const tabLeft = activeTabElement.offsetLeft;
      const tabWidth = activeTabElement.offsetWidth;
      const scrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

  return (
    <div 
      ref={scrollContainerRef}
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 scrollbar-hide',
        className
      )}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            ref={isActive ? activeTabRef : null}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 min-h-11 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
              isActive
                ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
            )}
          >
            {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ScrollableTabs;
