/**
 * QuickReplies Component
 * 
 * Displays quick reply buttons for the user to select.
 * These are contextually relevant options based on the current booking state.
 */

'use client';

import { QuickReply } from '@/lib/state-machines/bookingStateMachine';
import { tokens } from '@/lib/design-tokens';

interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (value: string) => void;
}

export default function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {replies.map((reply) => (
        <button
          key={reply.id}
          onClick={() => onSelect(reply.value)}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'oklch(0.96 0.02 75)', // Champagne tint
            color: 'oklch(0.20 0.01 264)',
            border: '1px solid oklch(0.90 0.01 85)',
            minHeight: '48px', // Touch target minimum
          }}
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
}
