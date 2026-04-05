import feedbackAnalyticsRepo, {
  type UsageAnalyticsEvent,
  type AnalyticsFilters,
  type AnalyticsSummary,
} from './FeedbackAnalyticsRepository';

type PartialAnalyticsFilters = Omit<AnalyticsFilters, 'salon_id'> & { salon_id?: string };

export class AnalyticsRepository {
  static async trackEvent(data: Omit<UsageAnalyticsEvent, 'id' | 'created_at'>): Promise<UsageAnalyticsEvent> {
    return feedbackAnalyticsRepo.trackEvent(data);
  }

  static async batchTrackEvents(events: Omit<UsageAnalyticsEvent, 'id' | 'created_at'>[]): Promise<UsageAnalyticsEvent[]> {
    return Promise.all(events.map((e) => feedbackAnalyticsRepo.trackEvent(e)));
  }

  static async trackPageview(data: Omit<UsageAnalyticsEvent, 'id' | 'created_at'>): Promise<UsageAnalyticsEvent> {
    return feedbackAnalyticsRepo.trackEvent(data);
  }

  static async trackError(data: Omit<UsageAnalyticsEvent, 'id' | 'created_at'>): Promise<UsageAnalyticsEvent> {
    return feedbackAnalyticsRepo.trackEvent(data);
  }

  static async getEventAnalytics(filters: PartialAnalyticsFilters): Promise<{ events: UsageAnalyticsEvent[]; total: number }> {
    return feedbackAnalyticsRepo.getAnalyticsByFilters({ ...filters, salon_id: filters.salon_id || '' } as AnalyticsFilters);
  }

  static async getPageviewAnalytics(filters: PartialAnalyticsFilters): Promise<AnalyticsSummary> {
    return feedbackAnalyticsRepo.getAnalyticsSummary(filters.salon_id || '', filters.start_date, filters.end_date);
  }

  static async getErrorAnalytics(filters: PartialAnalyticsFilters): Promise<AnalyticsSummary> {
    return feedbackAnalyticsRepo.getAnalyticsSummary(filters.salon_id || '', filters.start_date, filters.end_date);
  }
}
