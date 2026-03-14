/**
 * SalonOS Booking State Machine
 * 
 * States: GREETING → SERVICE_BROWSE → SERVICE_SELECT → STYLIST_PREFERENCE → DATE_TIME → SLOT_SELECT → CONFIRMATION → COMPLETED
 * 
 * This state machine manages the conversational booking flow for the Client PWA.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Booking States
export type BookingState = 
  | 'GREETING'
  | 'SERVICE_BROWSE'
  | 'SERVICE_SELECT'
  | 'STYLIST_PREFERENCE'
  | 'DATE_TIME'
  | 'SLOT_SELECT'
  | 'CONFIRMATION'
  | 'COMPLETED';

// Service type
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  imageUrl?: string;
}

// Staff/Stylist type
export interface Stylist {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  specialties?: string[];
}

// Time slot type
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  stylistId: string;
  available: boolean;
}

// Booking data type
export interface BookingData {
  service: Service | null;
  stylist: Stylist | null;
  date: string | null;
  slot: TimeSlot | null;
  notes: string;
}

// Message type for chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickReplies?: QuickReply[];
  card?: ServiceCard | null;
}

// Quick reply type
export interface QuickReply {
  id: string;
  label: string;
  value: string;
  action?: () => void;
}

// Service card for rich display
export interface ServiceCard {
  type: 'service' | 'stylist' | 'slot' | 'confirmation';
  data: Service | Stylist | TimeSlot | BookingData;
}

// State transitions map
export const stateTransitions: Record<BookingState, BookingState[]> = {
  GREETING: ['SERVICE_BROWSE'],
  SERVICE_BROWSE: ['SERVICE_SELECT', 'GREETING'],
  SERVICE_SELECT: ['STYLIST_PREFERENCE', 'DATE_TIME'],
  STYLIST_PREFERENCE: ['DATE_TIME', 'SERVICE_SELECT'],
  DATE_TIME: ['SLOT_SELECT', 'STYLIST_PREFERENCE'],
  SLOT_SELECT: ['CONFIRMATION', 'DATE_TIME'],
  CONFIRMATION: ['COMPLETED', 'SLOT_SELECT'],
  COMPLETED: ['GREETING'],
};

// Initial state
const initialState = {
  currentState: 'GREETING' as BookingState,
  bookingData: {
    service: null,
    stylist: null,
    date: null,
    slot: null,
    notes: '',
  } as BookingData,
  messages: [] as ChatMessage[],
  isLoading: false,
  error: null as string | null,
};

// Store interface
interface BookingStore {
  // State
  currentState: BookingState;
  bookingData: BookingData;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  transition: (newState: BookingState) => void;
  setService: (service: Service) => void;
  setStylist: (stylist: Stylist | null) => void;
  setDateTime: (date: string, slot: TimeSlot) => void;
  setNotes: (notes: string) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetBooking: () => void;
  canTransition: (newState: BookingState) => boolean;
}

// Create the store
export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Transition to a new state
      transition: (newState) => {
        const { currentState } = get();
        const allowedTransitions = stateTransitions[currentState];
        
        if (allowedTransitions.includes(newState)) {
          set({ currentState: newState });
        } else {
          console.error(`Invalid transition from ${currentState} to ${newState}`);
          set({ error: `Cannot transition from ${currentState} to ${newState}` });
        }
      },
      
      // Check if transition is valid
      canTransition: (newState) => {
        const { currentState } = get();
        return stateTransitions[currentState].includes(newState);
      },
      
      // Set selected service
      setService: (service) => {
        set((state) => ({
          bookingData: { ...state.bookingData, service },
        }));
      },
      
      // Set stylist preference
      setStylist: (stylist) => {
        set((state) => ({
          bookingData: { ...state.bookingData, stylist },
        }));
      },
      
      // Set date and time slot
      setDateTime: (date, slot) => {
        set((state) => ({
          bookingData: { ...state.bookingData, date, slot },
        }));
      },
      
      // Set booking notes
      setNotes: (notes) => {
        set((state) => ({
          bookingData: { ...state.bookingData, notes },
        }));
      },
      
      // Add a chat message
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      },
      
      // Clear all messages
      clearMessages: () => {
        set({ messages: [] });
      },
      
      // Set loading state
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      // Set error
      setError: (error) => {
        set({ error });
      },
      
      // Reset booking to initial state
      resetBooking: () => {
        set({
          ...initialState,
          messages: [],
        });
      },
    }),
    {
      name: 'salonos-booking-storage',
      partialize: (state) => ({
        currentState: state.currentState,
        bookingData: state.bookingData,
      }),
    }
  )
);

// Helper function to get greeting message based on state
export const getStateGreeting = (state: BookingState, bookingData?: BookingData): string => {
  switch (state) {
    case 'GREETING':
      return "Welcome to JH Salon! ✨ I'm your personal booking assistant. How can I help you today?";
    case 'SERVICE_BROWSE':
      return "Let me show you our services. Swipe through to find what you're looking for.";
    case 'SERVICE_SELECT':
      return bookingData?.service 
        ? `Great choice! You selected **${bookingData.service.name}**. Would you like to choose a specific stylist?`
        : "Please select a service to continue.";
    case 'STYLIST_PREFERENCE':
      return "Do you have a preferred stylist? You can choose one or let us assign the best available.";
    case 'DATE_TIME':
      return "When would you like to book your appointment?";
    case 'SLOT_SELECT':
      return "Here are the available time slots for your selected date.";
    case 'CONFIRMATION':
      return "Please review your booking details and confirm.";
    case 'COMPLETED':
      return "🎉 Your booking is confirmed! We look forward to seeing you.";
    default:
      return "How can I help you today?";
  }
};

// Export default quick replies for each state
export const getDefaultQuickReplies = (state: BookingState): QuickReply[] => {
  switch (state) {
    case 'GREETING':
      return [
        { id: 'book', label: 'Book an appointment', value: 'book' },
        { id: 'services', label: 'View services', value: 'services' },
        { id: 'hours', label: 'Opening hours', value: 'hours' },
      ];
    case 'SERVICE_BROWSE':
      return [
        { id: 'hair', label: '💇 Hair', value: 'hair' },
        { id: 'nails', label: '💅 Nails', value: 'nails' },
        { id: 'spa', label: '🧖 Spa', value: 'spa' },
        { id: 'makeup', label: '💄 Makeup', value: 'makeup' },
      ];
    case 'STYLIST_PREFERENCE':
      return [
        { id: 'any', label: 'Any available stylist', value: 'any' },
        { id: 'specific', label: 'Choose a stylist', value: 'specific' },
      ];
    case 'CONFIRMATION':
      return [
        { id: 'confirm', label: '✓ Confirm booking', value: 'confirm' },
        { id: 'edit', label: '✏️ Edit details', value: 'edit' },
        { id: 'cancel', label: '✕ Cancel', value: 'cancel' },
      ];
    case 'COMPLETED':
      return [
        { id: 'another', label: 'Book another', value: 'another' },
        { id: 'home', label: 'Back to home', value: 'home' },
      ];
    default:
      return [];
  }
};
