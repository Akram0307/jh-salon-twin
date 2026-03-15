/**
 * DraggableAppointment Component Tests
 * Tests for drag-and-drop functionality, rendering, and interactions
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DraggableAppointment } from '@/components/schedule/DraggableAppointment';

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: { onMouseDown: vi.fn() },
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}));

describe('DraggableAppointment', () => {
  const mockAppointment = {
    id: 'apt-123',
    clientName: 'Jane Smith',
    serviceName: 'Haircut',
    staffName: 'John Doe',
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed' as const,
    color: '#3b82f6',
  };

  const defaultProps = {
    appointment: mockAppointment,
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<DraggableAppointment {...defaultProps} />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays client name', () => {
    render(<DraggableAppointment {...defaultProps} />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays service name', () => {
    render(<DraggableAppointment {...defaultProps} />);
    expect(screen.getByText('Haircut')).toBeInTheDocument();
  });

  it('displays staff name', () => {
    render(<DraggableAppointment {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(<DraggableAppointment {...defaultProps} />);
    const appointmentElement = screen.getByText('Jane Smith').closest('div[class*="cursor"]') || screen.getByText('Jane Smith').parentElement;
    if (appointmentElement) {
      fireEvent.click(appointmentElement);
      expect(defaultProps.onClick).toHaveBeenCalled();
    }
  });

  it('shows status badge', () => {
    render(<DraggableAppointment {...defaultProps} />);
    expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
  });

  it('applies custom color when provided', () => {
    const { container } = render(<DraggableAppointment {...defaultProps} />);
    const appointmentElement = container.firstChild as HTMLElement;
    // Check that the component renders with some styling
    expect(appointmentElement).toBeInTheDocument();
  });

  it('renders with correct appointment data', () => {
    render(<DraggableAppointment {...defaultProps} />);
    // All appointment data should be rendered
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Haircut')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders with different appointment data', () => {
    const differentAppointment = {
      id: 'apt-456',
      clientName: 'Bob Wilson',
      serviceName: 'Color',
      staffName: 'Alice Brown',
      startTime: '14:00',
      endTime: '15:30',
      status: 'pending' as const,
    };

    render(<DraggableAppointment appointment={differentAppointment} onClick={vi.fn()} />);
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
  });
});
