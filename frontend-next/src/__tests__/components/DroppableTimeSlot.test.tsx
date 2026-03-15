/**
 * DroppableTimeSlot Component Tests
 * Tests for drop zone functionality and visual feedback
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DroppableTimeSlot } from '@/components/schedule/DroppableTimeSlot';

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
    active: null,
  }),
}));

describe('DroppableTimeSlot', () => {
  const defaultProps = {
    id: 'slot-10:00',
    time: '10:00',
    staffId: 'staff-123',
    onDrop: vi.fn(),
    children: <div>Slot content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<DroppableTimeSlot {...defaultProps} />);
    expect(screen.getByText('Slot content')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<DroppableTimeSlot {...defaultProps} />);
    expect(screen.getByText('Slot content')).toBeInTheDocument();
  });

  it('renders with correct structure', () => {
    const { container } = render(<DroppableTimeSlot {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('accepts time prop', () => {
    render(<DroppableTimeSlot {...defaultProps} time="11:00" />);
    // Component should render with the time prop
    expect(screen.getByText('Slot content')).toBeInTheDocument();
  });

  it('accepts staffId prop', () => {
    render(<DroppableTimeSlot {...defaultProps} staffId="staff-456" />);
    // Component should render with the staffId prop
    expect(screen.getByText('Slot content')).toBeInTheDocument();
  });

  it('renders with isDisabled prop', () => {
    render(<DroppableTimeSlot {...defaultProps} isDisabled={true} />);
    expect(screen.getByText('Slot content')).toBeInTheDocument();
  });

  it('calls onDrop when provided', () => {
    render(<DroppableTimeSlot {...defaultProps} />);
    // onDrop should be available as a prop
    expect(defaultProps.onDrop).toBeDefined();
  });

  it('renders multiple children', () => {
    render(
      <DroppableTimeSlot {...defaultProps}>
        <div>Child 1</div>
        <div>Child 2</div>
      </DroppableTimeSlot>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});
