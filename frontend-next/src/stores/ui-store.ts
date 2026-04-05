/**
 * SalonOS UI Store
 * Global UI state management with Zustand + Immer
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================
// Types
// ============================================

export type Theme = 'dark' | 'light' | 'system';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface PageFilters {
  [key: string]: unknown;
}

export interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;

  // Command palette state
  commandPaletteOpen: boolean;

  // Theme state
  theme: Theme;

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Filters (persisted per page)
  filters: Record<string, PageFilters>;

  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarMobile: () => void;
  setSidebarMobileOpen: (open: boolean) => void;

  // Actions - Command Palette
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Actions - Theme
  setTheme: (theme: Theme) => void;

  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Actions - Filters
  setPageFilters: (page: string, filters: PageFilters) => void;
  clearPageFilters: (page: string) => void;
  clearAllFilters: () => void;
}

// ============================================
// Helpers
// ============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}

// ============================================
// Store
// ============================================

export const useUIStore = create<UIState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      commandPaletteOpen: false,
      theme: 'dark',
      notifications: [],
      unreadCount: 0,
      filters: {},

      // ============================================
      // Sidebar Actions
      // ============================================

      toggleSidebar: () =>
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        }),

      setSidebarCollapsed: (collapsed) =>
        set((state) => {
          state.sidebarCollapsed = collapsed;
        }),

      toggleSidebarMobile: () =>
        set((state) => {
          state.sidebarMobileOpen = !state.sidebarMobileOpen;
        }),

      setSidebarMobileOpen: (open) =>
        set((state) => {
          state.sidebarMobileOpen = open;
        }),

      // ============================================
      // Command Palette Actions
      // ============================================

      toggleCommandPalette: () =>
        set((state) => {
          state.commandPaletteOpen = !state.commandPaletteOpen;
        }),

      setCommandPaletteOpen: (open) =>
        set((state) => {
          state.commandPaletteOpen = open;
        }),

      // ============================================
      // Theme Actions
      // ============================================

      setTheme: (theme) =>
        set((state) => {
          state.theme = theme;
        }),

      // ============================================
      // Notification Actions
      // ============================================

      addNotification: (notification) =>
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: generateId(),
            timestamp: new Date().toISOString(),
            read: false,
          };
          state.notifications.unshift(newNotification);
          state.unreadCount = calculateUnreadCount(state.notifications);
          
          // Keep only last 50 notifications
          if (state.notifications.length > 50) {
            state.notifications = state.notifications.slice(0, 50);
          }
        }),

      markNotificationRead: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (notification) {
            notification.read = true;
            state.unreadCount = calculateUnreadCount(state.notifications);
          }
        }),

      markAllNotificationsRead: () =>
        set((state) => {
          state.notifications.forEach((n) => {
            n.read = true;
          });
          state.unreadCount = 0;
        }),

      removeNotification: (id) =>
        set((state) => {
          state.notifications = state.notifications.filter((n) => n.id !== id);
          state.unreadCount = calculateUnreadCount(state.notifications);
        }),

      clearNotifications: () =>
        set((state) => {
          state.notifications = [];
          state.unreadCount = 0;
        }),

      // ============================================
      // Filter Actions
      // ============================================

      setPageFilters: (page, filters) =>
        set((state) => {
          state.filters[page] = filters;
        }),

      clearPageFilters: (page) =>
        set((state) => {
          delete state.filters[page];
        }),

      clearAllFilters: () =>
        set((state) => {
          state.filters = {};
        }),
    })),
    {
      name: 'salonos-ui-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist specific fields
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        filters: state.filters,
      }),
    }
  )
);

// ============================================
// Selectors (for optimized re-renders)
// ============================================

export const selectSidebarCollapsed = (state: UIState) => state.sidebarCollapsed;
export const selectSidebarMobileOpen = (state: UIState) => state.sidebarMobileOpen;
export const selectCommandPaletteOpen = (state: UIState) => state.commandPaletteOpen;
export const selectTheme = (state: UIState) => state.theme;
export const selectNotifications = (state: UIState) => state.notifications;
export const selectUnreadCount = (state: UIState) => state.unreadCount;
export const selectFilters = (page: string) => (state: UIState) => state.filters[page];

// ============================================
// Default Export
// ============================================

export default useUIStore;
