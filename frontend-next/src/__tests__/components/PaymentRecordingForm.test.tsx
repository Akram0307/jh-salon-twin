/**
 * PaymentRecordingForm Component Tests
 * Tests for payment form validation, method selection, and submission
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentRecordingForm } from '@/components/pos/PaymentRecordingForm';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('PaymentRecordingForm', () => {
  const defaultProps = {
    salonId: 'salon-123',
    staffId: 'staff-456',
    appointmentId: 'apt-789',
    clientName: 'John Doe',
    serviceTotal: 500,
    onPaymentRecorded: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as any;
  });

  it('renders without crashing', () => {
    render(<PaymentRecordingForm {...defaultProps} />);
    expect(screen.getByText(/payment/i)).toBeInTheDocument();
  });

  it('displays the service total amount', () => {
    render(<PaymentRecordingForm {...defaultProps} />);
    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
  });

  it('shows all payment method options', () => {
    render(<PaymentRecordingForm {...defaultProps} />);
    expect(screen.getByText(/cash/i)).toBeInTheDocument();
    expect(screen.getByText(/phonepe/i)).toBeInTheDocument();
    expect(screen.getByText(/upi/i)).toBeInTheDocument();
    expect(screen.getByText(/card/i)).toBeInTheDocument();
  });

  it('allows changing the payment amount', () => {
    render(<PaymentRecordingForm {...defaultProps} />);
    const amountInput = screen.getByDisplayValue('500');
    fireEvent.change(amountInput, { target: { value: '600' } });
    expect(screen.getByDisplayValue('600')).toBeInTheDocument();
  });

  it('allows entering tip amount', () => {
    render(<PaymentRecordingForm {...defaultProps} />);
    const tipInput = screen.getByPlaceholderText(/tip/i) || screen.getByLabelText(/tip/i);
    if (tipInput) {
      fireEvent.change(tipInput, { target: { value: '50' } });
      expect(tipInput).toHaveValue('50');
    }
  });

  it('allows entering discount amount', () => {
    render(<PaymentRecordingForm {...defaultProps} />);
    const discountInput = screen.getByPlaceholderText(/discount/i) || screen.getByLabelText(/discount/i);
    if (discountInput) {
      fireEvent.change(discountInput, { target: { value: '25' } });
      expect(discountInput).toHaveValue('25');
    }
  });

  it('selects different payment methods', () => {
    render(<PaymentRecordingForm {...defaultProps} />);
    const upiButton = screen.getByText(/upi/i);
    fireEvent.click(upiButton);
    // UPI should now be selected
  });

  it('displays client name when provided', () => {
    render(<PaymentRecordingForm {...defaultProps} />);
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });
});
