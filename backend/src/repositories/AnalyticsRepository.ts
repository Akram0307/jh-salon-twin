import feedbackAnalyticsRepo from './FeedbackAnalyticsRepository';

export class AnalyticsRepository {
  static async trackEvent(data: any): Promise<any> {
    return feedbackAnalyticsRepo.trackEvent(data);
  }

  static async batchTrackEvents(events: any[]): Promise<any[]> {
    return Promise.all(events.map((e: any) => feedbackAnalyticsRepo.trackEvent(e)));
  }

  static async trackPageview(data: any): Promise<any> {
    return feedbackAnalyticsRepo.trackEvent(data);
  }

  static async trackError(data: any): Promise<any> {
    return feedbackAnalyticsRepo.trackEvent(data);
  }

  static async getEventAnalytics(filters: any): Promise<any> {
    return feedbackAnalyticsRepo.getAnalyticsByFilters(filters);
  }

  static async getPageviewAnalytics(filters: any): Promise<any> {
    return feedbackAnalyticsRepo.getAnalyticsSummary(filters.salon_id, filters.start_date, filters.end_date);
  }

  static async getErrorAnalytics(filters: any): Promise<any> {
    return feedbackAnalyticsRepo.getAnalyticsSummary(filters.salon_id, filters.start_date, filters.end_date);
  }
}
