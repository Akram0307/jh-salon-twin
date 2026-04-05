/**
 * MessageBubble Component
 * 
 * Displays a single chat message with appropriate styling for AI and user messages.
 * AI messages have a champagne tint, user messages have a rose-gold tint.
 */

'use client';

import { ChatMessage } from '@/lib/state-machines/bookingStateMachine';
import { tokens } from '@/lib/design-tokens';

interface MessageBubbleProps {
  message: ChatMessage;
  onQuickReply?: (value: string) => void;
}

export default function MessageBubble({ message, onQuickReply }: MessageBubbleProps) {
  const isAI = message.role === 'assistant';
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-[80%] ${isAI ? 'mr-auto' : 'ml-auto'}`}>
        {/* Message bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${isAI ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
          style={{
            backgroundColor: isAI 
              ? 'oklch(0.96 0.02 75)' // Champagne tint for AI
              : 'oklch(0.92 0.04 25)', // Rose-gold tint for user
            color: 'oklch(0.20 0.01 264)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Message content */}
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
          
          {/* Service card if present */}
          {message.card && message.card.type === 'service' && (
            <div 
              className="mt-3 p-3 rounded-xl"
              style={{ 
                backgroundColor: 'oklch(0.98 0.005 85)',
                border: '1px solid oklch(0.90 0.01 85)',
              }}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-16 h-16 rounded-lg bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url(${(message.card.data as any).imageUrl || '/images/placeholder.jpg'})`,
                    backgroundColor: 'oklch(0.95 0.01 75)',
                  }}
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm" style={{ color: 'oklch(0.20 0.01 264)' }}>
                    {(message.card.data as any).name}
                  </h4>
                  <p className="text-xs mt-1" style={{ color: 'oklch(0.45 0.01 264)' }}>
                    {(message.card.data as any).description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-sm" style={{ color: 'oklch(0.78 0.10 75)' }}>
                      ${(message.card.data as any).price}
                    </span>
                    <span className="text-xs" style={{ color: 'oklch(0.45 0.01 264)' }}>
                      {(message.card.data as any).duration} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Stylist card if present */}
          {message.card && message.card.type === 'stylist' && (
            <div 
              className="mt-3 p-3 rounded-xl"
              style={{ 
                backgroundColor: 'oklch(0.98 0.005 85)',
                border: '1px solid oklch(0.90 0.01 85)',
              }}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url(${(message.card.data as any).avatar || '/images/avatar.jpg'})`,
                    backgroundColor: 'oklch(0.95 0.01 75)',
                  }}
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm" style={{ color: 'oklch(0.20 0.01 264)' }}>
                    {(message.card.data as any).name}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs" style={{ color: 'oklch(0.78 0.10 75)' }}>
                      ★ {(message.card.data as any).rating}
                    </span>
                    {(message.card.data as any).specialties && (
                      <span className="text-xs" style={{ color: 'oklch(0.45 0.01 264)' }}>
                        {(message.card.data as any).specialties.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Slot card if present */}
          {message.card && message.card.type === 'slot' && (
            <div 
              className="mt-3 p-3 rounded-xl"
              style={{ 
                backgroundColor: 'oklch(0.98 0.005 85)',
                border: '1px solid oklch(0.90 0.01 85)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: 'oklch(0.20 0.01 264)' }}>
                    {(message.card.data as any).startTime} - {(message.card.data as any).endTime}
                  </h4>
                  <p className="text-xs mt-1" style={{ color: 'oklch(0.45 0.01 264)' }}>
                    Available
                  </p>
                </div>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'oklch(0.70 0.18 145)' }}
                >
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Confirmation card if present */}
          {message.card && message.card.type === 'confirmation' && (
            <div 
              className="mt-3 p-4 rounded-xl"
              style={{ 
                backgroundColor: 'oklch(0.98 0.005 85)',
                border: '1px solid oklch(0.90 0.01 85)',
              }}
            >
              <h4 className="font-semibold text-sm mb-3" style={{ color: 'oklch(0.20 0.01 264)' }}>
                Booking Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'oklch(0.45 0.01 264)' }}>Service</span>
                  <span style={{ color: 'oklch(0.20 0.01 264)' }}>
                    {(message.card.data as any).service?.name || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'oklch(0.45 0.01 264)' }}>Date</span>
                  <span style={{ color: 'oklch(0.20 0.01 264)' }}>
                    {(message.card.data as any).date || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'oklch(0.45 0.01 264)' }}>Time</span>
                  <span style={{ color: 'oklch(0.20 0.01 264)' }}>
                    {(message.card.data as any).slot?.startTime || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'oklch(0.45 0.01 264)' }}>Stylist</span>
                  <span style={{ color: 'oklch(0.20 0.01 264)' }}>
                    {(message.card.data as any).stylist?.name || 'Any available'}
                  </span>
                </div>
                <div className="pt-2 mt-2 border-t" style={{ borderColor: 'oklch(0.90 0.01 85)' }}>
                  <div className="flex justify-between font-semibold">
                    <span style={{ color: 'oklch(0.20 0.01 264)' }}>Total</span>
                    <span style={{ color: 'oklch(0.78 0.10 75)' }}>
                      ${(message.card.data as any).service?.price || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div 
          className={`text-xs mt-1 ${isAI ? 'text-left' : 'text-right'}`}
          style={{ color: 'oklch(0.45 0.01 264)' }}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
