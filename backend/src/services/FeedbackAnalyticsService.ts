import FeedbackAnalyticsRepository, {
  Feedback,
  UsageAnalyticsEvent,
  FeedbackFilters,
  AnalyticsFilters,
  FeedbackStats,
  AnalyticsSummary
} from '../repositories/FeedbackAnalyticsRepository';
import { AppError } from '../utils/errors';

export interface CreateFeedbackInput {
  salon_id: string;
  user_id: string;
  feedback_type: 'bug_report' | 'feature_request' | 'general_feedback';
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  page_url?: string;
  browser_info?: any;
  attachments?: string[];
}

export interface UpdateFeedbackInput {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  admin_notes?: string;
  resolved_by?: string;
}

export interface TrackEventInput {
  salon_id: string;
  user_id?: string;
  event_name: string;
  event_category: string;
  event_data?: any;
  page_url?: string;
  session_id?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  user_agent?: string;
}

export class FeedbackAnalyticsService {
  private repository: typeof FeedbackAnalyticsRepository;

  constructor() {
    this.repository = FeedbackAnalyticsRepository;
  }

  // Feedback methods
  async createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
    // Validate input
    if (!input.salon_id) {
      throw new AppError('Salon ID is required', 400);
    }
    if (!input.user_id) {
      throw new AppError('User ID is required', 400);
    }
    if (!input.title || input.title.trim().length === 0) {
      throw new AppError('Title is required', 400);
    }
    if (!input.description || input.description.trim().length === 0) {
      throw new AppError('Description is required', 400);
    }
    if (!input.feedback_type) {
      throw new AppError('Feedback type is required', 400);
    }

    // Validate feedback type
    const validTypes = ['bug_report', 'feature_request', 'general_feedback'];
    if (!validTypes.includes(input.feedback_type)) {
      throw new AppError('Invalid feedback type', 400);
    }

    // Validate priority if provided
    if (input.priority) {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(input.priority)) {
        throw new AppError('Invalid priority', 400);
      }
    }

    const feedbackData = {
      ...input,
      priority: input.priority || 'medium',
      status: 'open' as const
    };

    return this.repository.createFeedback(feedbackData);
  }

  async getFeedbackById(id: string, salon_id: string): Promise<Feedback> {
    if (!id || !salon_id) {
      throw new AppError('Feedback ID and Salon ID are required', 400);
    }

    const feedback: Feedback | null = await this.repository.getFeedbackById(id, salon_id);
    if (!feedback) {
      throw new AppError('Feedback not found', 404);
    }

    return feedback || null;
  }

  async getFeedbackByFilters(filters: FeedbackFilters): Promise<{
    feedback: Feedback[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    if (!filters.salon_id) {
      throw new AppError('Salon ID is required', 400);
    }

    const result = await this.repository.getFeedbackByFilters(filters);
    const limit = filters.limit || 20;
    const page = filters.page || 1;

    return {
      ...result,
      page,
      limit,
      total_pages: Math.ceil(result.total / limit)
    };
  }

  async updateFeedback(
    id: string,
    salon_id: string,
    updates: UpdateFeedbackInput
  ): Promise<Feedback> {
    if (!id || !salon_id) {
      throw new AppError('Feedback ID and Salon ID are required', 400);
    }

    // Check if feedback exists
    const existingFeedback = await this.repository.getFeedbackById(id, salon_id);
    if (!existingFeedback) {
      throw new AppError('Feedback not found', 404);
    }

    // Validate updates
    if (updates.status) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(updates.status)) {
        throw new AppError('Invalid status', 400);
      }
    }

    if (updates.priority) {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(updates.priority)) {
        throw new AppError('Invalid priority', 400);
      }
    }

    // If resolving, set resolved_at
    if (updates.status === 'resolved' && existingFeedback.status !== 'resolved') {
      updates.resolved_by = updates.resolved_by || existingFeedback.user_id;
    }

    return this.repository.updateFeedback(id, salon_id, updates);
  }

  async deleteFeedback(id: string, salon_id: string): Promise<void> {
    if (!id || !salon_id) {
      throw new AppError('Feedback ID and Salon ID are required', 400);
    }

    // Check if feedback exists
    const existingFeedback = await this.repository.getFeedbackById(id, salon_id);
    if (!existingFeedback) {
      throw new AppError('Feedback not found', 404);
    }

    // Only allow deletion of open or closed feedback
    if (existingFeedback.status === 'in_progress') {
      throw new AppError('Cannot delete feedback that is in progress', 400);
    }

    await this.repository.deleteFeedback(id, salon_id);
  }

  async getFeedbackStats(
    salon_id: string,
    start_date?: string,
    end_date?: string
  ): Promise<FeedbackStats> {
    if (!salon_id) {
      throw new AppError('Salon ID is required', 400);
    }

    return this.repository.getFeedbackStats(salon_id, start_date, end_date);
  }

  // Analytics methods
  async trackEvent(input: TrackEventInput): Promise<UsageAnalyticsEvent> {
    // Validate input
    if (!input.salon_id) {
      throw new AppError('Salon ID is required', 400);
    }
    if (!input.event_name) {
      throw new AppError('Event name is required', 400);
    }
    if (!input.event_category) {
      throw new AppError('Event category is required', 400);
    }

    // Validate event category
    const validCategories = ['navigation', 'interaction', 'conversion', 'error', 'performance', 'custom'];
    if (!validCategories.includes(input.event_category)) {
      throw new AppError('Invalid event category', 400);
    }

    return this.repository.trackEvent(input);
  }

  async getAnalyticsByFilters(filters: AnalyticsFilters): Promise<{
    events: UsageAnalyticsEvent[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    if (!filters.salon_id) {
      throw new AppError('Salon ID is required', 400);
    }

    const result = await this.repository.getAnalyticsByFilters(filters);
    const limit = filters.limit || 100;
    const page = filters.page || 1;

    return {
      ...result,
      page,
      limit,
      total_pages: Math.ceil(result.total / limit)
    };
  }

  async getAnalyticsSummary(
    salon_id: string,
    start_date?: string,
    end_date?: string
  ): Promise<AnalyticsSummary> {
    if (!salon_id) {
      throw new AppError('Salon ID is required', 400);
    }

    return this.repository.getAnalyticsSummary(salon_id, start_date, end_date);
  }

  async getDailyAnalyticsSummary(
    salon_id: string,
    start_date: string,
    end_date: string
  ): Promise<any[]> {
    if (!salon_id || !start_date || !end_date) {
      throw new AppError('Salon ID, start date, and end date are required', 400);
    }

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
      throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
    }

    // Check if start_date is before end_date
    if (new Date(start_date) > new Date(end_date)) {
      throw new AppError('Start date must be before end date', 400);
    }

    return this.repository.getDailyAnalyticsSummary(salon_id, start_date, end_date);
  }

  // Helper method to track page view
  async trackPageView(
    salon_id: string,
    page_url: string,
    user_id?: string,
    session_id?: string,
    device_info?: {
      device_type?: string;
      browser?: string;
      os?: string;
      ip_address?: string;
      user_agent?: string;
    }
  ): Promise<UsageAnalyticsEvent> {
    return this.trackEvent({
      salon_id,
      user_id,
      event_name: 'page_view',
      event_category: 'navigation',
      event_data: { page_url },
      page_url,
      session_id,
      ...device_info
    });
  }

  // Helper method to track user interaction
  async trackInteraction(
    salon_id: string,
    interaction_type: string,
    element_id?: string,
    element_type?: string,
    user_id?: string,
    session_id?: string,
    page_url?: string
  ): Promise<UsageAnalyticsEvent> {
    return this.trackEvent({
      salon_id,
      user_id,
      event_name: 'user_interaction',
      event_category: 'interaction',
      event_data: {
        interaction_type,
        element_id,
        element_type
      },
      page_url,
      session_id
    });
  }

  // Helper method to track conversion event
  async trackConversion(
    salon_id: string,
    conversion_type: string,
    value?: number,
    user_id?: string,
    session_id?: string,
    page_url?: string
  ): Promise<UsageAnalyticsEvent> {
    return this.trackEvent({
      salon_id,
      user_id,
      event_name: 'conversion',
      event_category: 'conversion',
      event_data: {
        conversion_type,
        value
      },
      page_url,
      session_id
    });
  }

  // Helper method to track error
  async trackError(
    salon_id: string,
    error_type: string,
    error_message: string,
    stack_trace?: string,
    user_id?: string,
    session_id?: string,
    page_url?: string
  ): Promise<UsageAnalyticsEvent> {
    return this.trackEvent({
      salon_id,
      user_id,
      event_name: 'error',
      event_category: 'error',
      event_data: {
        error_type,
        error_message,
        stack_trace
      },
      page_url,
      session_id
    });
  }
}

export default new FeedbackAnalyticsService();
