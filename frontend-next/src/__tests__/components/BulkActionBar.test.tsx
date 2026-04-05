/**
 * BulkActionBar Component Tests
 * Tests for bulk selection, actions, and confirmation dialogs
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BulkActionBar } from '@/components/shared/BulkActionBar';
import { BulkOperationsProvider } from '@/contexts/BulkOperationsContext';

// Mock the BulkOperationsContext
const mockClearSelection = vi.fn();
const mockExecuteAction = vi.fn();

const mockBulkOperationsContext = {
  selectedIds: ['1', '2', '3', '4', '5'],
  isSelecting: true,
  actions: [
    { id: 'export', label: 'Export', requiresConfirmation: false },
    { id: 'delete', label: 'Delete', requiresConfirmation: true },
  ],
  clearSelection: mockClearSelection,
  executeAction: mockExecuteAction,
  isExecuting: false,
  executionProgress: 0,
  executionTotal: 5,
};

// Mock the useBulkOperations hook
vi.mock('@/contexts/BulkOperationsContext', () => ({
  useBulkOperations: () => mockBulkOperationsContext,
  BulkOperationsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('BulkActionBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <BulkOperationsProvider>
        <BulkActionBar />
      </BulkOperationsProvider>
    );
    expect(screen.getByText(/5 selected/i)).toBeInTheDocument();
  });

  it('displays correct count of selected items', () => {
    mockBulkOperationsContext.selectedIds = Array(10).fill('id');
    render(
      <BulkOperationsProvider>
        <BulkActionBar />
      </BulkOperationsProvider>
    );
    expect(screen.getByText(/10 selected/i)).toBeInTheDocument();
  });

  it('shows entity type in the bar', () => {
    render(
      <BulkOperationsProvider>
        <BulkActionBar entityName="clients" />
      </BulkOperationsProvider>
    );
    expect(screen.getByText(/clients/i)).toBeInTheDocument();
  });

  it('calls clearSelection when clear button is clicked', () => {
    render(
      <BulkOperationsProvider>
        <BulkActionBar />
      </BulkOperationsProvider>
    );
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    expect(mockClearSelection).toHaveBeenCalled();
  });

  it('shows bulk action options', () => {
    render(
      <BulkOperationsProvider>
        <BulkActionBar />
      </BulkOperationsProvider>
    );
    expect(screen.getByText(/export/i)).toBeInTheDocument();
    expect(screen.getByText(/delete/i)).toBeInTheDocument();
  });

  it('calls executeAction with correct action type', async () => {
    render(
      <BulkOperationsProvider>
        <BulkActionBar />
      </BulkOperationsProvider>
    );
    const exportButton = screen.getByText(/export/i);
    fireEvent.click(exportButton);
    await waitFor(() => {
      expect(mockExecuteAction).toHaveBeenCalledWith('export');
    });
  });

  it('is hidden when no items are selected', () => {
    mockBulkOperationsContext.selectedIds = [];
    mockBulkOperationsContext.isSelecting = false;
    const { container } = render(
      <BulkOperationsProvider>
        <BulkActionBar />
      </BulkOperationsProvider>
    );
    // Bar should be hidden or not render when count is 0
    expect(container.firstChild).toBeNull();
  });

  it('shows confirmation dialog for destructive actions', async () => {
    render(
      <BulkOperationsProvider>
        <BulkActionBar />
      </BulkOperationsProvider>
    );
    const deleteButton = screen.getByText(/delete/i);
    fireEvent.click(deleteButton);
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });
});
