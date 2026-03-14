/**
 * UI Store Integration Tests
 * Tests Zustand store actions and state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/stores/ui-store';

describe('UI Store Integration', () => {
  beforeEach(() => {
    // Reset store to initial state
    useUIStore.setState({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      commandPaletteOpen: false,
      theme: 'dark',
      notifications: [],
      unreadCount: 0,
      filters: {},
    });
    localStorage.clear();
  });

  describe('Sidebar state', () => {
    it('should toggle sidebar collapsed state', () => {
      const { toggleSidebar } = useUIStore.getState();
      
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
      
      toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
      
      toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it('should set sidebar collapsed directly', () => {
      const { setSidebarCollapsed } = useUIStore.getState();
      
      setSidebarCollapsed(true);
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
      
      setSidebarCollapsed(false);
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it('should toggle mobile sidebar', () => {
      const { toggleSidebarMobile } = useUIStore.getState();
      
      expect(useUIStore.getState().sidebarMobileOpen).toBe(false);
      
      toggleSidebarMobile();
      expect(useUIStore.getState().sidebarMobileOpen).toBe(true);
    });

    it('should set mobile sidebar open directly', () => {
      const { setSidebarMobileOpen } = useUIStore.getState();
      
      setSidebarMobileOpen(true);
      expect(useUIStore.getState().sidebarMobileOpen).toBe(true);
    });
  });

  describe('Command palette state', () => {
    it('should toggle command palette', () => {
      const { toggleCommandPalette } = useUIStore.getState();
      
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
      
      toggleCommandPalette();
      expect(useUIStore.getState().commandPaletteOpen).toBe(true);
      
      toggleCommandPalette();
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    });

    it('should set command palette open directly', () => {
      const { setCommandPaletteOpen } = useUIStore.getState();
      
      setCommandPaletteOpen(true);
      expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    });
  });

  describe('Theme state', () => {
    it('should set theme', () => {
      const { setTheme } = useUIStore.getState();
      
      expect(useUIStore.getState().theme).toBe('dark');
      
      setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');
      
      setTheme('system');
      expect(useUIStore.getState().theme).toBe('system');
    });
  });

  describe('Notifications state', () => {
    it('should add a notification', () => {
      const { addNotification } = useUIStore.getState();
      
      addNotification({
        type: 'success',
        title: 'Test',
        message: 'Test notification',
      });
      
      const { notifications, unreadCount } = useUIStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Test');
      expect(notifications[0].read).toBe(false);
      expect(unreadCount).toBe(1);
    });

    it('should mark notification as read', () => {
      const { addNotification, markNotificationRead } = useUIStore.getState();
      
      addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      
      const notificationId = useUIStore.getState().notifications[0].id;
      markNotificationRead(notificationId);
      
      const { notifications, unreadCount } = useUIStore.getState();
      expect(notifications[0].read).toBe(true);
      expect(unreadCount).toBe(0);
    });

    it('should mark all notifications as read', () => {
      const { addNotification, markAllNotificationsRead } = useUIStore.getState();
      
      addNotification({ type: 'info', title: 'Test 1', message: 'Message 1' });
      addNotification({ type: 'warning', title: 'Test 2', message: 'Message 2' });
      
      expect(useUIStore.getState().unreadCount).toBe(2);
      
      markAllNotificationsRead();
      
      expect(useUIStore.getState().unreadCount).toBe(0);
      expect(useUIStore.getState().notifications.every(n => n.read)).toBe(true);
    });

    it('should remove a notification', () => {
      const { addNotification, removeNotification } = useUIStore.getState();
      
      addNotification({ type: 'error', title: 'Test', message: 'Test message' });
      const notificationId = useUIStore.getState().notifications[0].id;
      
      removeNotification(notificationId);
      
      expect(useUIStore.getState().notifications).toHaveLength(0);
    });

    it('should clear all notifications', () => {
      const { addNotification, clearNotifications } = useUIStore.getState();
      
      addNotification({ type: 'info', title: 'Test 1', message: 'Message 1' });
      addNotification({ type: 'success', title: 'Test 2', message: 'Message 2' });
      
      clearNotifications();
      
      expect(useUIStore.getState().notifications).toHaveLength(0);
      expect(useUIStore.getState().unreadCount).toBe(0);
    });
  });

  describe('Filters state', () => {
    it('should set page filters', () => {
      const { setPageFilters } = useUIStore.getState();
      
      setPageFilters('dashboard', { dateRange: 'week', status: 'active' });
      
      const { filters } = useUIStore.getState();
      expect(filters.dashboard).toEqual({ dateRange: 'week', status: 'active' });
    });

    it('should clear page filters', () => {
      const { setPageFilters, clearPageFilters } = useUIStore.getState();
      
      setPageFilters('schedule', { staff: ['staff-1'] });
      expect(useUIStore.getState().filters.schedule).toBeDefined();
      
      clearPageFilters('schedule');
      expect(useUIStore.getState().filters.schedule).toBeUndefined();
    });

    it('should clear all filters', () => {
      const { setPageFilters, clearAllFilters } = useUIStore.getState();
      
      setPageFilters('dashboard', { dateRange: 'week' });
      setPageFilters('schedule', { staff: ['staff-1'] });
      
      clearAllFilters();
      
      expect(useUIStore.getState().filters).toEqual({});
    });
  });
});
