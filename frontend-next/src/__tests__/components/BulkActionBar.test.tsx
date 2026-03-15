/**
 * BulkActionBar Component Tests
 * Tests for bulk selection, actions, and confirmation dialogs
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BulkActionBar } from '@/components/shared/BulkActionBar';

describe('BulkActionBar', () => {
  const defaultProps = {
    selectedCount: 5,
    entityType: 'clients' as const,
    onClearSelection: vi.fn(),
    onBulkAction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(screen.getByText(/5 selected/i)).toBeInTheDocument();
  });

  it('displays correct count of selected items', () => {
    render(<BulkActionBar {...defaultProps} selectedCount={10} />);
    expect(screen.getByText(/10 selected/i)).toBeInTheDocument();
  });

  it('shows entity type in the bar', () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(screen.getByText(/clients/i)).toBeInTheDocument();
  });

  it('calls onClearSelection when clear button is clicked', () => {
    render(<BulkActionBar {...defaultProps} />);
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    expect(defaultProps.onClearSelection).toHaveBeenCalled();
  });

  it('shows bulk action options', () => {
    render(<BulkActionBar {...defaultProps} />);
    // Should have export, delete, or other bulk action buttons
    expect(screen.getByText(/export/i) || screen.getByText(/delete/i)).toBeInTheDocument();
  });

  it('calls onBulkAction with correct action type', async () => {
    render(<BulkActionBar {...defaultProps} />);
    const exportButton = screen.getByText(/export/i);
    fireEvent.click(exportButton);
    await waitFor(() => {
      expect(defaultProps.onBulkAction).toHaveBeenCalledWith('export', expect.any(Array));
    });
  });

  it('is hidden when no items are selected', () => {
    const { container } = render(<BulkActionBar {...defaultProps} selectedCount={0} />);
    // Bar should be hidden or not render when count is 0
    expect(container.firstChild).toBeNull();
  });

  it('shows confirmation dialog for destructive actions', async () => {
    render(<BulkActionBar {...defaultProps} />);
    const deleteButton = screen.getByText(/delete/i);
    fireEvent.click(deleteButton);
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });
});
