/**
 * DroppableTimeSlot Component Tests
 * Tests for time slot drag and drop functionality
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DroppableTimeSlot } from '@/components/schedule/DroppableTimeSlot';

// Mock the @dnd-kit/core hook
vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    isOver: false,
    setNodeRef: vi.fn(),
  }),
}));

describe('DroppableTimeSlot', () => {
  const mockSlot = {
    id: 'slot-1',
    time: '10:00',
    day: 'Monday',
  };

  const mockOnDrop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <DroppableTimeSlot
        id={mockSlot.id}
        time={mockSlot.time}
        day={mockSlot.day}
      />
    );
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('displays the time', () => {
    render(
      <DroppableTimeSlot
        id={mockSlot.id}
        time={mockSlot.time}
      />
    );
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('displays the day when provided', () => {
    render(
      <DroppableTimeSlot
        id={mockSlot.id}
        time={mockSlot.time}
        day={mockSlot.day}
      />
    );
    // The day might not be displayed in the component, so we check the container
    const container = screen.getByText('10:00').closest('div');
    expect(container).toHaveAttribute('data-day', 'Monday');
  });

  it('renders children when provided', () => {
    render(
      <DroppableTimeSlot
        id={mockSlot.id}
        time={mockSlot.time}
      >
        <div>Child Content</div>
      </DroppableTimeSlot>
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <DroppableTimeSlot
        id={mockSlot.id}
        time={mockSlot.time}
        className="custom-class"
      />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('highlights when isOver is true', () => {
    // Mock useDroppable to return isOver: true
    vi.mock('@dnd-kit/core', () => ({
      useDroppable: () => ({
        isOver: true,
        setNodeRef: vi.fn(),
      }),
    }));

    const { container } = render(
      <DroppableTimeSlot
        id={mockSlot.id}
        time={mockSlot.time}
      />
    );
    // Check for highlight class (assuming it's 'bg-gold-500/10')
    expect(container.firstChild).toHaveClass('bg-gold-500/10');
  });
});
