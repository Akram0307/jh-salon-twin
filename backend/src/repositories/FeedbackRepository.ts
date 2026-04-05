import feedbackAnalyticsRepo, { type Feedback, type FeedbackFilters } from './FeedbackAnalyticsRepository';

export class FeedbackRepository {
  static async findAll(filters: Omit<FeedbackFilters, 'salon_id'> & { salon_id?: string }): Promise<{ feedback: Feedback[]; total: number }> {
    return feedbackAnalyticsRepo.getFeedbackByFilters({ ...filters, salon_id: filters.salon_id || '' } as FeedbackFilters);
  }

  static async create(data: Omit<Feedback, 'id' | 'created_at' | 'updated_at'>): Promise<Feedback> {
    return feedbackAnalyticsRepo.createFeedback(data);
  }

  static async findById(id: string): Promise<Feedback | null> {
    return feedbackAnalyticsRepo.getFeedbackById(id, '');
  }

  static async update(id: string, updates: Partial<Feedback>): Promise<Feedback | null> {
    return feedbackAnalyticsRepo.updateFeedback(id, '', updates);
  }
}
