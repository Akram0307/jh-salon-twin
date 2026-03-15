import PaymentRecordingRepository, {
  PaymentRecord,
  DailyZReport,
  PaymentFilters,
  PaymentStats
} from '../repositories/PaymentRecordingRepository';
import { AppError } from '../utils/errors';

export interface CreatePaymentInput {
  salon_id: string;
  appointment_id?: string;
  client_id?: string;
  staff_id?: string;
  amount: number;
  payment_method: 'cash' | 'phonepe' | 'upi' | 'card' | 'other';
  reference_number?: string;
  notes?: string;
  recorded_by: string;
}

export interface UpdatePaymentInput {
  amount?: number;
  payment_method?: 'cash' | 'phonepe' | 'upi' | 'card' | 'other';
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
  reference_number?: string;
  notes?: string;
}

export class PaymentRecordingService {
  private repository: typeof PaymentRecordingRepository;

  constructor() {
    this.repository = PaymentRecordingRepository;
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentRecord> {
    // Validate input
    if (!input.salon_id) {
      throw new AppError('Salon ID is required', 400);
    }
    if (!input.amount || input.amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }
    if (!input.payment_method) {
      throw new AppError('Payment method is required', 400);
    }
    if (!input.recorded_by) {
      throw new AppError('Recorded by is required', 400);
    }

    // Validate payment method
    const validMethods = ['cash', 'phonepe', 'upi', 'card', 'other'];
    if (!validMethods.includes(input.payment_method)) {
      throw new AppError('Invalid payment method', 400);
    }

    // For UPI/PhonePe/Card, require reference number
    if (['phonepe', 'upi', 'card'].includes(input.payment_method) && !input.reference_number) {
      // Warning: reference number is recommended but not required
      // In production, you might want to make this mandatory
    }

    const paymentData = {
      ...input,
      payment_status: 'completed' as const,
      recorded_at: new Date()
    };

    return this.repository.createPayment(paymentData);
  }

  async getPaymentById(id: string, salon_id: string): Promise<PaymentRecord> {
    if (!id || !salon_id) {
      throw new AppError('Payment ID and Salon ID are required', 400);
    }

    const payment = await this.repository.getPaymentById(id, salon_id);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    return payment;
  }

  async getPaymentsByFilters(filters: PaymentFilters): Promise<{
    payments: PaymentRecord[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    if (!filters.salon_id) {
      throw new AppError('Salon ID is required', 400);
    }

    const result = await this.repository.getPaymentsByFilters(filters);
    const limit = filters.limit || 20;
    const page = filters.page || 1;

    return {
      ...result,
      page,
      limit,
      total_pages: Math.ceil(result.total / limit)
    };
  }

  async updatePayment(
    id: string,
    salon_id: string,
    updates: UpdatePaymentInput
  ): Promise<PaymentRecord> {
    if (!id || !salon_id) {
      throw new AppError('Payment ID and Salon ID are required', 400);
    }

    // Check if payment exists
    const existingPayment = await this.repository.getPaymentById(id, salon_id);
    if (!existingPayment) {
      throw new AppError('Payment not found', 404);
    }

    // Validate updates
    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    if (updates.payment_method) {
      const validMethods = ['cash', 'phonepe', 'upi', 'card', 'other'];
      if (!validMethods.includes(updates.payment_method)) {
        throw new AppError('Invalid payment method', 400);
      }
    }

    if (updates.payment_status) {
      const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
      if (!validStatuses.includes(updates.payment_status)) {
        throw new AppError('Invalid payment status', 400);
      }
    }

    return this.repository.updatePayment(id, salon_id, updates);
  }

  async deletePayment(id: string, salon_id: string): Promise<void> {
    if (!id || !salon_id) {
      throw new AppError('Payment ID and Salon ID are required', 400);
    }

    // Check if payment exists
    const existingPayment = await this.repository.getPaymentById(id, salon_id);
    if (!existingPayment) {
      throw new AppError('Payment not found', 404);
    }

    // Only allow deletion of pending or failed payments
    if (existingPayment.payment_status === 'completed') {
      throw new AppError('Cannot delete completed payment. Use refund instead.', 400);
    }

    await this.repository.deletePayment(id, salon_id);
  }

  async refundPayment(id: string, salon_id: string, notes?: string): Promise<PaymentRecord> {
    if (!id || !salon_id) {
      throw new AppError('Payment ID and Salon ID are required', 400);
    }

    const existingPayment = await this.repository.getPaymentById(id, salon_id);
    if (!existingPayment) {
      throw new AppError('Payment not found', 404);
    }

    if (existingPayment.payment_status === 'refunded') {
      throw new AppError('Payment is already refunded', 400);
    }

    if (existingPayment.payment_status !== 'completed') {
      throw new AppError('Only completed payments can be refunded', 400);
    }

    return this.repository.updatePayment(id, salon_id, {
      payment_status: 'refunded',
      notes: notes || `Refunded from payment ${id}`
    });
  }

  async getPaymentStats(
    salon_id: string,
    start_date?: string,
    end_date?: string
  ): Promise<PaymentStats> {
    if (!salon_id) {
      throw new AppError('Salon ID is required', 400);
    }

    return this.repository.getPaymentStats(salon_id, start_date, end_date);
  }

  // Daily Z-Report methods
  async generateZReport(salon_id: string, report_date: string, generated_by: string): Promise<DailyZReport> {
    if (!salon_id || !report_date || !generated_by) {
      throw new AppError('Salon ID, report date, and generated by are required', 400);
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(report_date)) {
      throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
    }

    // Check if date is valid
    const date = new Date(report_date);
    if (isNaN(date.getTime())) {
      throw new AppError('Invalid date', 400);
    }

    // Don't allow future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) {
      throw new AppError('Cannot generate report for future dates', 400);
    }

    return this.repository.generateZReport(salon_id, report_date, generated_by);
  }

  async getZReport(salon_id: string, report_date: string): Promise<DailyZReport | null> {
    if (!salon_id || !report_date) {
      throw new AppError('Salon ID and report date are required', 400);
    }

    return this.repository.getZReport(salon_id, report_date);
  }

  async getZReportsByDateRange(
    salon_id: string,
    start_date: string,
    end_date: string
  ): Promise<DailyZReport[]> {
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

    return this.repository.getZReportsByDateRange(salon_id, start_date, end_date);
  }

  async updateZReportNotes(id: string, salon_id: string, notes: string): Promise<DailyZReport> {
    if (!id || !salon_id) {
      throw new AppError('Report ID and Salon ID are required', 400);
    }

    const report = await this.repository.getZReport(salon_id, new Date().toISOString().split('T')[0]);
    if (!report) {
      throw new AppError('Z-Report not found', 404);
    }

    return this.repository.updateZReportNotes(id, salon_id, notes);
  }

  // Helper method to get today's payment summary
  async getTodaySummary(salon_id: string): Promise<{
    total_amount: number;
    transaction_count: number;
    by_method: Record<string, { amount: number; count: number }>;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const stats = await this.repository.getPaymentStats(salon_id, today, today);

    return {
      total_amount: stats.total_amount,
      transaction_count: stats.transaction_count,
      by_method: stats.by_method
    };
  }
}

export default new PaymentRecordingService();
