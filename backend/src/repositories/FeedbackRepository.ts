import feedbackAnalyticsRepo, { Feedback } from './FeedbackAnalyticsRepository';

export class FeedbackRepository {
  static async findAll(filters: any): Promise<{ feedback: Feedback[]; total: number }> {
    return feedbackAnalyticsRepo.getFeedbackByFilters(filters);
  }

  static async create(data: any): Promise<Feedback> {
    return feedbackAnalyticsRepo.createFeedback(data);
  }

  static async findById(id: string): Promise<Feedback | null> {
    return feedbackAnalyticsRepo.getFeedbackById(id, '');
  }

  static async update(id: string, updates: any): Promise<Feedback | null> {
    return feedbackAnalyticsRepo.updateFeedback(id, '', updates);
  }
}
