/**
 * DraggableAppointment Component Tests
 * Tests for appointment drag and drop functionality
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DraggableAppointment } from '@/components/schedule/DraggableAppointment';

// Mock the @dnd-kit/sortable hook
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

describe('DraggableAppointment', () => {
  const mockAppointment = {
    id: 'appointment-1',
    clientName: 'John Doe',
    serviceName: 'Haircut',
    staffName: 'Jane Smith',
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    color: '#3b82f6',
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <DraggableAppointment
        id="appointment-1"
        appointment={mockAppointment}
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays client name', () => {
    render(
      <DraggableAppointment
        id="appointment-1"
        appointment={mockAppointment}
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays service name', () => {
    render(
      <DraggableAppointment
        id="appointment-1"
        appointment={mockAppointment}
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText('Haircut')).toBeInTheDocument();
  });

  it('displays staff name', () => {
    render(
      <DraggableAppointment
        id="appointment-1"
        appointment={mockAppointment}
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(
      <DraggableAppointment
        id="appointment-1"
        appointment={mockAppointment}
        onClick={mockOnClick}
      />
    );
    const appointmentElement = screen.getByText('John Doe').closest('div');
    fireEvent.click(appointmentElement!);
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('displays appointment time', () => {
    render(
      <DraggableAppointment
        id="appointment-1"
        appointment={mockAppointment}
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText('10:00 - 11:00')).toBeInTheDocument();
  });

  it('displays status badge', () => {
    render(
      <DraggableAppointment
        id="appointment-1"
        appointment={mockAppointment}
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText('confirmed')).toBeInTheDocument();
  });
});
