/**
 * Client Chat Page
 * 
 * This page hosts the conversational booking interface for the Client PWA.
 * It uses the booking state machine and chat components to provide a premium,
 * mobile-first conversational experience.
 */

'use client';

import { useEffect } from 'react';
import { useBookingStore } from '@/lib/state-machines/bookingStateMachine';
import ChatContainer from '@/components/client/chat/ChatContainer';
import { tokens } from '@/lib/design-tokens';

export default function ClientChatPage() {
  const { resetBooking, addMessage, currentState } = useBookingStore();
  
  // Initialize chat with greeting message
  useEffect(() => {
    // Reset booking state when page loads
    resetBooking();
    
    // Add initial greeting message
    addMessage({
      role: 'assistant',
      content: "Welcome to JH Salon! ✨ I'm your personal booking assistant. How can I help you today?",
      quickReplies: [
        { id: 'book', label: 'Book an appointment', value: 'book' },
        { id: 'services', label: 'View services', value: 'services' },
        { id: 'hours', label: 'Opening hours', value: 'hours' },
      ],
    });
  }, [resetBooking, addMessage]);
  
  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: 'oklch(0.98 0.005 85)', // Warm ivory background
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      <ChatContainer />
    </div>
  );
}
