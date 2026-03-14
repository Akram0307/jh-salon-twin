/**
 * ServiceCarousel Component
 * 
 * Horizontal scrollable carousel for browsing services in the Client PWA.
 * Uses snap scrolling for a smooth, mobile-friendly experience.
 */

'use client';

import { useRef } from 'react';
import { Service } from '@/lib/state-machines/bookingStateMachine';
import ServiceCard from './ServiceCard';
import { tokens } from '@/lib/design-tokens';

interface ServiceCarouselProps {
  services: Service[];
  onSelectService: (service: Service) => void;
  isLoading?: boolean;
}

export default function ServiceCarousel({ 
  services, 
  onSelectService, 
  isLoading = false 
}: ServiceCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll left/right by one card width
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280; // Approximate card width + gap
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };
  
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="relative">
        <div 
          className="flex space-x-4 overflow-hidden"
          style={{ padding: '0 16px' }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className="flex-shrink-0 w-64 h-48 rounded-xl animate-pulse"
              style={{ backgroundColor: 'oklch(0.95 0.01 75)' }}
            />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative">
      {/* Scroll buttons (desktop only) */}
      <div className="hidden md:block">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: 'oklch(0.98 0.005 85)',
            border: '1px solid oklch(0.90 0.01 85)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <span style={{ color: 'oklch(0.20 0.01 264)' }}>←</span>
        </button>
        
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: 'oklch(0.98 0.005 85)',
            border: '1px solid oklch(0.90 0.01 85)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <span style={{ color: 'oklch(0.20 0.01 264)' }}>→</span>
        </button>
      </div>
      
      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ 
          scrollSnapType: 'x mandatory',
          scrollPadding: '0 16px',
          padding: '0 16px',
        }}
      >
        {services.map((service) => (
          <div 
            key={service.id}
            className="flex-shrink-0 w-64"
            style={{ scrollSnapAlign: 'start' }}
          >
            <ServiceCard 
              service={service} 
              onSelect={onSelectService}
            />
          </div>
        ))}
        
        {/* Empty state if no services */}
        {services.length === 0 && (
          <div 
            className="flex-shrink-0 w-full text-center py-8"
            style={{ color: 'oklch(0.45 0.01 264)' }}
          >
            No services available in this category.
          </div>
        )}
      </div>
      
      {/* Scroll indicators (mobile) */}
      <div className="flex justify-center mt-2 md:hidden">
        <div className="flex space-x-2">
          {services.slice(0, 5).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'oklch(0.90 0.01 85)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
