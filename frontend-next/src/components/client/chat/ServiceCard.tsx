/**
 * ServiceCard Component
 * 
 * Displays a single service in a rich card format for the Client PWA.
 * Used in the service browsing carousel and chat messages.
 */

'use client';

import { Service } from '@/lib/state-machines/bookingStateMachine';
import { tokens } from '@/lib/design-tokens';

interface ServiceCardProps {
  service: Service;
  onSelect?: (service: Service) => void;
  variant?: 'default' | 'compact';
}

export default function ServiceCard({ service, onSelect, variant = 'default' }: ServiceCardProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(service);
    }
  };
  
  return (
    <div
      onClick={handleClick}
      className="rounded-xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        backgroundColor: 'oklch(0.98 0.005 85)',
        border: '1px solid oklch(0.90 0.01 85)',
        minHeight: variant === 'compact' ? '120px' : '160px',
      }}
    >
      {/* Service Image */}
      <div 
        className="w-full bg-cover bg-center"
        style={{
          height: variant === 'compact' ? '80px' : '100px',
          backgroundImage: `url(${service.imageUrl || '/images/placeholder.jpg'})`,
          backgroundColor: 'oklch(0.95 0.01 75)',
        }}
      />
      
      {/* Service Details */}
      <div className="p-3">
        <h3 
          className="font-semibold text-sm mb-1"
          style={{ color: 'oklch(0.20 0.01 264)' }}
        >
          {service.name}
        </h3>
        
        {variant === 'default' && (
          <p 
            className="text-xs mb-2 line-clamp-2"
            style={{ color: 'oklch(0.45 0.01 264)' }}
          >
            {service.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span 
            className="font-semibold"
            style={{ color: 'oklch(0.78 0.10 75)' }}
          >
            ${service.price}
          </span>
          <span 
            className="text-xs"
            style={{ color: 'oklch(0.45 0.01 264)' }}
          >
            {service.duration} min
          </span>
        </div>
        
        {variant === 'default' && service.category && (
          <div 
            className="mt-2 inline-block px-2 py-1 rounded-full text-xs"
            style={{ 
              backgroundColor: 'oklch(0.96 0.02 75)',
              color: 'oklch(0.20 0.01 264)',
            }}
          >
            {service.category}
          </div>
        )}
      </div>
    </div>
  );
}
