import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Client, Staff, PaymentMethod } from '@/types/pos';

interface CartState {
  items: CartItem[];
  client: Client | null;
  staff: Staff | null;
  paymentMethod: PaymentMethod;
  tip: number;
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setClient: (client: Client | null) => void;
  setStaff: (staff: Staff | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setTip: (tip: number) => void;
  // Computed
  subtotal: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      client: null,
      staff: null,
      paymentMethod: 'card',
      tip: 0,

      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === item.id);
          if (existingIndex >= 0) {
            // Item exists, increment quantity
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: (newItems[existingIndex].quantity || 1) + 1,
            };
            return { items: newItems };
          } else {
            // New item
            return { items: [...state.items, { ...item, quantity: 1 }] };
          }
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], tip: 0 });
      },

      setClient: (client) => set({ client }),
      setStaff: (staff) => set({ staff }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setTip: (tip) => set({ tip }),

      subtotal: () => {
        const state = get();
        return state.items.reduce((total, item) => {
          const quantity = item.quantity || 1;
          return total + item.price * quantity;
        }, 0);
      },

      total: () => {
        const state = get();
        return state.subtotal() + state.tip;
      },
    }),
    {
      name: 'pos-cart-storage',
      partialize: (state) => ({
        items: state.items,
        client: state.client,
        staff: state.staff,
        paymentMethod: state.paymentMethod,
        tip: state.tip,
      }),
    }
  )
);
