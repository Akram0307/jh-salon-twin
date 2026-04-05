/**
 * ChatContainer Component
 * 
 * Main container for the conversational booking interface.
 * Manages the chat state, message display, and user interactions.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useBookingStore, getStateGreeting, getDefaultQuickReplies } from '@/lib/state-machines/bookingStateMachine';
import MessageBubble from './MessageBubble';
import QuickReplies from './QuickReplies';
import { tokens } from '@/lib/design-tokens';

export default function ChatContainer() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    messages, 
    currentState, 
    addMessage, 
    transition, 
    setService,
    bookingData,
    isLoading 
  } = useBookingStore();
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle quick reply selection
  const handleQuickReply = (value: string) => {
    // Add user message
    addMessage({
      role: 'user',
      content: value,
    });
    
    // Process the quick reply based on current state
    switch (currentState) {
      case 'GREETING':
        if (value === 'book' || value === 'services') {
          transition('SERVICE_BROWSE');
          addMessage({
            role: 'assistant',
            content: getStateGreeting('SERVICE_BROWSE'),
            quickReplies: getDefaultQuickReplies('SERVICE_BROWSE'),
          });
        } else if (value === 'hours') {
          addMessage({
            role: 'assistant',
            content: "We're open Monday to Saturday, 9 AM to 8 PM. Sunday, 10 AM to 6 PM.",
            quickReplies: getDefaultQuickReplies('GREETING'),
          });
        }
        break;
        
      case 'SERVICE_BROWSE':
        // For now, simulate service selection
        // In a real app, this would show a service carousel
        addMessage({
          role: 'assistant',
          content: `You selected ${value} services. Let me show you the options.`,
        });
        // Transition to service selection
        transition('SERVICE_SELECT');
        // Add a sample service card
        addMessage({
          role: 'assistant',
          content: "Here's our most popular service:",
          card: {
            type: 'service',
            data: {
              id: 'service-1',
              name: 'Premium Haircut',
              description: 'A luxurious haircut experience with consultation and styling.',
              price: 65,
              duration: 45,
              category: 'Hair',
              imageUrl: '/images/services/haircut.jpg',
            },
          },
          quickReplies: [
            { id: 'select', label: 'Select this service', value: 'select' },
            { id: 'back', label: 'Back to categories', value: 'back' },
          ],
        });
        break;
        
      case 'SERVICE_SELECT':
        if (value === 'select') {
          // Set a sample service
          setService({
            id: 'service-1',
            name: 'Premium Haircut',
            description: 'A luxurious haircut experience with consultation and styling.',
            price: 65,
            duration: 45,
            category: 'Hair',
          });
          transition('STYLIST_PREFERENCE');
          addMessage({
            role: 'assistant',
            content: getStateGreeting('STYLIST_PREFERENCE'),
            quickReplies: getDefaultQuickReplies('STYLIST_PREFERENCE'),
          });
        } else if (value === 'back') {
          transition('SERVICE_BROWSE');
          addMessage({
            role: 'assistant',
            content: getStateGreeting('SERVICE_BROWSE'),
            quickReplies: getDefaultQuickReplies('SERVICE_BROWSE'),
          });
        }
        break;
        
      case 'STYLIST_PREFERENCE':
        if (value === 'any') {
          transition('DATE_TIME');
          addMessage({
            role: 'assistant',
            content: getStateGreeting('DATE_TIME'),
            quickReplies: getDefaultQuickReplies('DATE_TIME'),
          });
        } else if (value === 'specific') {
          // Show stylist selection
          addMessage({
            role: 'assistant',
            content: "Here are our top stylists:",
            card: {
              type: 'stylist',
              data: {
                id: 'stylist-1',
                name: 'Sarah Johnson',
                avatar: '/images/stylists/sarah.jpg',
                rating: 4.9,
                specialties: ['Hair Color', 'Balayage'],
              },
            },
            quickReplies: [
              { id: 'select-sarah', label: 'Select Sarah', value: 'select-sarah' },
              { id: 'any', label: 'Any stylist is fine', value: 'any' },
            ],
          });
        } else if (value === 'select-sarah') {
          // Set stylist
          transition('DATE_TIME');
          addMessage({
            role: 'assistant',
            content: "Great choice! Sarah is available. When would you like to book?",
            quickReplies: getDefaultQuickReplies('DATE_TIME'),
          });
        }
        break;
        
      case 'DATE_TIME':
        // For now, simulate date selection
        addMessage({
          role: 'assistant',
          content: "Let me check availability for tomorrow.",
        });
        transition('SLOT_SELECT');
        addMessage({
          role: 'assistant',
          content: "Here are the available time slots for tomorrow:",
          card: {
            type: 'slot',
            data: {
              id: 'slot-1',
              startTime: '10:00 AM',
              endTime: '10:45 AM',
              stylistId: 'stylist-1',
              available: true,
            },
          },
          quickReplies: [
            { id: '10am', label: '10:00 AM', value: '10am' },
            { id: '2pm', label: '2:00 PM', value: '2pm' },
            { id: '4pm', label: '4:00 PM', value: '4pm' },
          ],
        });
        break;
        
      case 'SLOT_SELECT':
        // Set slot and move to confirmation
        addMessage({
          role: 'assistant',
          content: `You selected ${value}. Let me prepare your booking confirmation.`,
        });
        transition('CONFIRMATION');
        addMessage({
          role: 'assistant',
          content: getStateGreeting('CONFIRMATION'),
          card: {
            type: 'confirmation',
            data: bookingData,
          },
          quickReplies: getDefaultQuickReplies('CONFIRMATION'),
        });
        break;
        
      case 'CONFIRMATION':
        if (value === 'confirm') {
          transition('COMPLETED');
          addMessage({
            role: 'assistant',
            content: getStateGreeting('COMPLETED'),
            quickReplies: getDefaultQuickReplies('COMPLETED'),
          });
        } else if (value === 'edit') {
          // Go back to service selection
          transition('SERVICE_SELECT');
          addMessage({
            role: 'assistant',
            content: "Let's update your booking details.",
            quickReplies: getDefaultQuickReplies('SERVICE_SELECT'),
          });
        } else if (value === 'cancel') {
          // Reset booking
          transition('GREETING');
          addMessage({
            role: 'assistant',
            content: "Booking cancelled. How can I help you today?",
            quickReplies: getDefaultQuickReplies('GREETING'),
          });
        }
        break;
        
      case 'COMPLETED':
        if (value === 'another') {
          transition('GREETING');
          addMessage({
            role: 'assistant',
            content: getStateGreeting('GREETING'),
            quickReplies: getDefaultQuickReplies('GREETING'),
          });
        } else if (value === 'home') {
          // In a real app, this would navigate to home
          addMessage({
            role: 'assistant',
            content: "Thank you for using JH Salon! We look forward to seeing you.",
          });
        }
        break;
    }
  };
  
  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Chat Header */}
      <div 
        className="p-4 border-b"
        style={{ 
          backgroundColor: 'oklch(0.98 0.005 85)',
          borderColor: 'oklch(0.90 0.01 85)',
        }}
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'oklch(0.78 0.10 75)' }}
          >
            <span className="text-white font-semibold">JH</span>
          </div>
          <div>
            <h1 className="font-semibold" style={{ color: 'oklch(0.20 0.01 264)' }}>
              JH Salon Assistant
            </h1>
            <p className="text-sm" style={{ color: 'oklch(0.45 0.01 264)' }}>
              Always here to help
            </p>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            onQuickReply={handleQuickReply}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick Replies (if last message has them) */}
      {messages.length > 0 && messages[messages.length - 1].quickReplies && (
        <div className="p-4 border-t" style={{ borderColor: 'oklch(0.90 0.01 85)' }}>
          <QuickReplies 
            replies={messages[messages.length - 1].quickReplies!} 
            onSelect={handleQuickReply}
          />
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="p-4 text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'oklch(0.78 0.10 75)' }} />
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'oklch(0.78 0.10 75)', animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'oklch(0.78 0.10 75)', animationDelay: '0.4s' }} />
          </div>
        </div>
      )}
    </div>
  );
}
