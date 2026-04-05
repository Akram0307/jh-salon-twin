/**
 * SalonOS Stores - Barrel Export
 * Central export point for all Zustand stores
 */

// UI Store
export {
  useUIStore,
  selectSidebarCollapsed,
  selectSidebarMobileOpen,
  selectCommandPaletteOpen,
  selectTheme,
  selectNotifications,
  selectUnreadCount,
  selectFilters,
} from './ui-store';

export type {
  Theme,
  Notification,
  PageFilters,
  UIState,
} from './ui-store';
