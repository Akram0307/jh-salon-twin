/**
 * SalonOS Usage Analytics Tracking
 * TASK-034: Track page views, feature usage, and performance metrics
 */

interface AnalyticsEvent {
  type: 'page_view' | 'feature_usage' | 'performance' | 'session_start' | 'session_end';
  name: string;
  data?: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
  page: string;
  userAgent: string;
}

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
const ANALYTICS_ENDPOINT = `${API_BASE}/api/analytics/events`;
const BATCH_SIZE = 10;
const BATCH_INTERVAL = 30000; // 30 seconds

// Generate or retrieve session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('salonos_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('salonos_session_id', sessionId);
  }
  return sessionId;
}

// Event queue for batching
let eventQueue: AnalyticsEvent[] = [];
let batchTimer: ReturnType<typeof setInterval> | null = null;

// Initialize analytics
export function initAnalytics(): void {
  // Track session start
  trackEvent('session_start', 'session_start');
  
  // Track page views on navigation
  setupPageViewTracking();
  
  // Track performance metrics
  trackPerformanceMetrics();
  
  // Track session end on page unload
  window.addEventListener('beforeunload', () => {
    trackEvent('session_end', 'session_end');
    flushQueue(); // Send remaining events
  });
  
  // Start batch timer
  batchTimer = setInterval(flushQueue, BATCH_INTERVAL);
}

// Track page views
function setupPageViewTracking(): void {
  // Track initial page load
  trackPageView(window.location.pathname);
  
  // Track navigation (for SPA)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    trackPageView(window.location.pathname);
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    trackPageView(window.location.pathname);
  };
  
  // Track back/forward navigation
  window.addEventListener('popstate', () => {
    trackPageView(window.location.pathname);
  });
}

// Track page view
export function trackPageView(page: string): void {
  trackEvent('page_view', page, {
    referrer: document.referrer,
    title: document.title,
  });
}

// Track feature usage
export function trackFeatureUsage(featureName: string, data?: Record<string, unknown>): void {
  trackEvent('feature_usage', featureName, data);
}

// Track custom events
export function trackEvent(
  type: AnalyticsEvent['type'],
  name: string,
  data?: Record<string, unknown>
): void {
  const event: AnalyticsEvent = {
    type,
    name,
    data,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    page: window.location.pathname,
    userAgent: navigator.userAgent,
  };
  
  eventQueue.push(event);
  
  // Flush if queue is full
  if (eventQueue.length >= BATCH_SIZE) {
    flushQueue();
  }
}

// Track performance metrics
function trackPerformanceMetrics(): void {
  if ('performance' in window && 'getEntriesByType' in performance) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');
        
        const metrics: PerformanceMetrics = {
          pageLoadTime: perfData?.loadEventEnd - perfData?.loadEventStart || 0,
          domContentLoaded: perfData?.domContentLoadedEventEnd - perfData?.domContentLoadedEventStart || 0,
        };
        
        // Get paint metrics
        paintEntries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });
        
        // Get LCP if available
        if ('PerformanceObserver' in window) {
          try {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1] as any;
              if (lastEntry) {
                metrics.largestContentfulPaint = lastEntry.startTime;
              }
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
          } catch (e) {
            // LCP observer not supported
          }
        }
        
        trackEvent('performance', 'page_performance', metrics as unknown as Record<string, unknown>);
      }, 0);
    });
  }
}

// Flush event queue
async function flushQueue(): Promise<void> {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  try {
    await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events: eventsToSend }),
      keepalive: true, // Allow request to complete even if page is unloading
    });
  } catch (error) {
    // Silently fail - analytics should not impact user experience
    console.debug('Analytics batch send failed:', error);
    // Re-queue events on failure (optional, limited retry)
    eventQueue = [...eventsToSend, ...eventQueue].slice(0, 100); // Keep max 100 events
  }
}

// React hook for tracking feature usage
export function useAnalytics() {
  return {
    trackPageView,
    trackFeatureUsage,
    trackEvent,
  };
}

// Higher-order component for tracking page views
export function withPageTracking<P extends object>(
  Component: React.ComponentType<P>,
  pageName: string
): React.ComponentType<P> {
  return function TrackedComponent(props: P) {
    React.useEffect(() => {
      trackPageView(pageName);
    }, []);
    
    return React.createElement(Component, props);
  };
}

// Export for React import
import React from 'react';
